<?php

namespace Database\Seeders;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Unit;
use App\Models\UnitLease;
use App\Models\UnitOwner;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

/**
 * Imports owner/tenant relations from a CSV. Units must already exist; only inserts into users, unit_owners, unit_leases.
 *
 * CSV columns: unit_name, owner_phone_number, tenant_phone_number
 * Optional 4th column: owner_name (parsed to first_name/last_name; max 3 words).
 * Delimiter: auto-detected from first line (comma if 3+ columns, else tab). Override with LEGACY_UNITS_CSV_DELIMITER.
 *
 * Flow per row (all in one transaction):
 * 1. Find unit by name (no insert into units table). If not found → FAILED.
 * 2. Create or get users by phone (insert into users only when new).
 * 3. Create UnitOwner and/or UnitLease (insert into unit_owners, unit_leases) linking unit_id to user(s).
 * 4. Update unit status (rented/owner_occupied/vacant).
 * If any step fails, entire row is rolled back.
 */
class LegacyUnitsFromCsvSeeder extends Seeder
{
    public function run(): void
    {
        if (env('APP_ENV') === 'production') {
            $this->command?->warn('LegacyUnitsFromCsvSeeder skipped in production.');
            return;
        }

        $csvPath = env('LEGACY_UNITS_CSV', base_path('database/seeders/csv/legacy_user_units.csv'));
        if (!file_exists($csvPath)) {
            $this->command?->error("CSV not found: {$csvPath}");
            $this->command?->line('Set LEGACY_UNITS_CSV or create database/seeders/csv/legacy_user_units.csv');
            return;
        }

        $legacyDate = Carbon::parse(env('LEGACY_SEED_DATE', '2024-04-19'))->startOfDay();
        $legacyDateStr = $legacyDate->toDateString();

        $handle = fopen($csvPath, 'r');
        if ($handle === false) {
            $this->command?->error("Could not open CSV: {$csvPath}");
            return;
        }

        $delimiter = env('LEGACY_UNITS_CSV_DELIMITER');
        if ($delimiter === null || $delimiter === '') {
            $firstLine = fgets($handle);
            if ($firstLine !== false) {
                $commaCount = count(str_getcsv(trim($firstLine), ','));
                $tabCount = count(str_getcsv(trim($firstLine), "\t"));
                if ($commaCount >= 3) {
                    $delimiter = ',';
                } elseif ($tabCount >= 3) {
                    $delimiter = "\t";
                } else {
                    $delimiter = ',';
                }
            } else {
                $delimiter = ',';
            }
            rewind($handle);
        }

        $logDate = now()->format('Y-m-d_H-i');
        $log = Log::build([
            'driver' => 'single',
            'path'   => storage_path("logs/legacy_units_import_{$logDate}.log"),
        ]);

        DB::disableQueryLog();

        $placeholderDocId = $this->ensurePlaceholderDocument($log);
        $systemUserId = $this->ensureSystemUser($log);

        $log->info('LegacyUnitsFromCsvSeeder started');
        $log->info("  CSV: {$csvPath}");
        $log->info("  delimiter: " . ($delimiter === "\t" ? 'tab' : $delimiter));
        $log->info("  legacy_date: {$legacyDateStr}");
        $log->info("  placeholder_doc_id: {$placeholderDocId}");
        $log->info("  system_user_id: {$systemUserId}");
        $log->info('  (Units table: no insert — lookup by name only)');
        $log->info('---');

        $this->command?->info('LegacyUnitsFromCsvSeeder');
        $this->command?->line("  CSV:        {$csvPath}");
        $this->command?->line("  log:        storage/logs/legacy_units_import_{$logDate}.log");

        $header = fgetcsv($handle, 0, $delimiter);
        if ($header === false) {
            fclose($handle);
            $this->command?->error('CSV is empty or unreadable.');
            $log->error('CSV is empty or unreadable.');
            return;
        }

        $createdOwners = 0;
        $createdLeases = 0;
        $createdUsers = 0;
        $successCount = 0;
        $failedCount = 0;
        $rowIndex = 0;

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            $rowIndex++;

            if (count($row) < 3) {
                $unitLabel = trim($row[0] ?? '') ?: '(no unit name)';
                $log->warning("FAILED: {$unitLabel} — row has fewer than 3 columns (row {$rowIndex})");
                $failedCount++;
                continue;
            }

            $unitName = trim($row[0] ?? '');
            $ownerPhoneRaw = trim($row[1] ?? '');
            $tenantPhoneRaw = trim($row[2] ?? '');
            $ownerNameRaw = trim($row[3] ?? '');

            if ($unitName === '') {
                $log->warning("FAILED: (empty unit name) — unit name is required (row {$rowIndex})");
                $failedCount++;
                continue;
            }

            $ownerPhone = $this->normalizePhone($ownerPhoneRaw);
            $tenantPhone = $this->normalizePhone($tenantPhoneRaw);

            if ($ownerPhoneRaw !== '' && $ownerPhone === '') {
                $log->warning("FAILED: {$unitName} — invalid owner phone (row {$rowIndex})");
                $failedCount++;
                continue;
            }
            if ($tenantPhoneRaw !== '' && $tenantPhone === '') {
                $log->warning("FAILED: {$unitName} — invalid tenant phone (row {$rowIndex})");
                $failedCount++;
                continue;
            }

            [$ownerFirst, $ownerLast] = $this->nameToFirstLast($ownerNameRaw);

            try {
                DB::transaction(function () use (
                    $unitName,
                    $ownerPhone,
                    $tenantPhone,
                    $ownerFirst,
                    $ownerLast,
                    $legacyDateStr,
                    $placeholderDocId,
                    $systemUserId,
                    $log,
                    $rowIndex,
                    &$createdOwners,
                    &$createdLeases,
                    &$createdUsers,
                    &$successCount
                ) {
                    $log->info("Row {$rowIndex}: {$unitName} — start");

                    $unit = Unit::where('name', $unitName)->first();
                    if (!$unit) {
                        throw new \RuntimeException("Unit not found in database: {$unitName}");
                    }
                    $log->info("  Unit found: id={$unit->id} name={$unitName}");

                    $status = 'vacant';
                    $ownerUser = null;
                    $tenantUser = null;

                    if ($tenantPhone !== '') {
                        $tenantUser = $this->createOrGetUser($tenantPhone, 'tenant', 'Unknown', 'Tenant');
                        if ($tenantUser->wasRecentlyCreated) {
                            $createdUsers++;
                            $log->info("  User created: id={$tenantUser->id} phone={$tenantPhone} role=tenant");
                        } else {
                            $log->info("  User reused: id={$tenantUser->id} phone={$tenantPhone} role=tenant");
                        }
                        UnitLease::create([
                            'unit_id'          => $unit->id,
                            'tenant_id'        => $tenantUser->id,
                            'lease_start_date' => $legacyDateStr,
                            'lease_end_date'   => null,
                            'status'           => 'active',
                            'agreement_type'   => 'owner',
                            'agreement_amount' => 0,
                            'created_by'       => $systemUserId,
                            'updated_by'       => null,
                        ]);
                        $createdLeases++;
                        $log->info("  UnitLease created: unit_id={$unit->id} tenant_id={$tenantUser->id}");
                        $status = 'rented';
                    }

                    if ($ownerPhone !== '') {
                        $ownerUser = $this->createOrGetUser($ownerPhone, 'homeowner', $ownerFirst, $ownerLast);
                        if ($ownerUser->wasRecentlyCreated) {
                            $createdUsers++;
                            $log->info("  User created: id={$ownerUser->id} phone={$ownerPhone} role=homeowner");
                        } else {
                            $log->info("  User reused: id={$ownerUser->id} phone={$ownerPhone} role=homeowner");
                        }
                        UnitOwner::create([
                            'unit_id'             => $unit->id,
                            'user_id'             => $ownerUser->id,
                            'start_date'          => $legacyDateStr,
                            'end_date'            => null,
                            'status'              => 'active',
                            'ownership_file_id'   => $placeholderDocId,
                            'created_by'          => $systemUserId,
                            'updated_by'          => null,
                        ]);
                        $createdOwners++;
                        $log->info("  UnitOwner created: unit_id={$unit->id} user_id={$ownerUser->id}");
                        if ($status === 'vacant') {
                            $status = 'owner_occupied';
                        }
                    }

                    $unit->update(['status' => $status]);
                    $log->info("  Unit status updated: {$status}");
                    $log->info("SUCCESS: {$unitName}");
                    $successCount++;
                });
            } catch (\Throwable $e) {
                $log->warning("FAILED: {$unitName} — " . $e->getMessage() . " (row {$rowIndex})");
                Log::error("LegacyUnitsFromCsvSeeder row failed: unit_name={$unitName}", [
                    'row'   => $row,
                    'error' => $e->getMessage(),
                ]);
                $this->command?->warn("Failed: {$unitName} — " . $e->getMessage());
                $failedCount++;
            }
        }

        fclose($handle);

        $log->info('---');
        $log->info('Final counts:');
        $log->info("  SUCCESS: {$successCount}");
        $log->info("  FAILED:  {$failedCount}");
        $log->info("  UnitOwners created: {$createdOwners}");
        $log->info("  UnitLeases created: {$createdLeases}");
        $log->info("  Users created:  {$createdUsers}");
        $log->info('LegacyUnitsFromCsvSeeder finished.');

        $this->command?->info("Done. SUCCESS: {$successCount} | FAILED: {$failedCount} | Owners: {$createdOwners} | Leases: {$createdLeases} | Users: {$createdUsers}");
    }

    /**
     * Normalize phone to DB format: 10 digits, starts with 0, second digit 7 or 9.
     * - Trim; strip trailing .00 / .0; replace leading 251 or +251 with 0; keep only digits.
     * - If 9 digits and first is 7 or 9, prepend 0. If not exactly 10 digits or second char not 7/9, return ''.
     */
    private function normalizePhone(string $phone): string
    {
        $phone = trim($phone);
        $phone = preg_replace('/\.0+$/', '', $phone);
        $phone = preg_replace('/\s+/', '', $phone);
        if (preg_match('/^(\+?251)(.*)$/', $phone, $m)) {
            $phone = '0' . $m[2];
        }
        $digits = preg_replace('/\D/', '', $phone);
        if (strlen($digits) === 9 && isset($digits[0]) && ($digits[0] === '7' || $digits[0] === '9')) {
            $digits = '0' . $digits;
        }
        if (strlen($digits) !== 10) {
            return '';
        }
        if ($digits[0] !== '0' || ($digits[1] !== '7' && $digits[1] !== '9')) {
            return '';
        }
        return $digits;
    }

    /**
     * Split name into first_name and last_name (max 3 words).
     * 3 words → first = "W1 W2", last = "W3"
     * 2 words → first = W1, last = W2
     * 1 word  → first = W1, last = "Legacy"
     * 0 words → first = "Unknown", last = "User"
     *
     * @return array{0: string, 1: string} [first_name, last_name]
     */
    private function nameToFirstLast(string $name): array
    {
        $name = trim(preg_replace('/\s+/', ' ', $name));
        $words = array_slice(array_filter(explode(' ', $name)), 0, 3);
        $n = count($words);
        if ($n >= 3) {
            return [$words[0] . ' ' . $words[1], $words[2]];
        }
        if ($n === 2) {
            return [$words[0], $words[1]];
        }
        if ($n === 1) {
            return [$words[0], 'Legacy'];
        }
        return ['Unknown', 'User'];
    }

    private function ensurePlaceholderDocument(\Psr\Log\LoggerInterface $log): int
    {
        $doc = Document::firstOrCreate(
            [
                'file_path' => 'legacy/placeholder.pdf',
                'category'  => 'ownership_files',
            ],
            [
                'file_name'  => 'Legacy placeholder',
                'mime_type'  => 'application/pdf',
                'file_size'  => 0,
            ]
        );
        $log->info("Placeholder document: id={$doc->id} (created=" . ($doc->wasRecentlyCreated ? 'yes' : 'no') . ")");
        return $doc->id;
    }

    private function ensureSystemUser(\Psr\Log\LoggerInterface $log): int
    {
        $phone = env('LEGACY_SYSTEM_PHONE', '0000000000');
        $user = User::firstOrCreate(
            ['phone' => $phone],
            [
                'first_name' => 'Legacy',
                'last_name'  => 'System',
                'password'   => Hash::make(env('LEGACY_SYSTEM_PASSWORD', Controller::_DEFAULT_PASSWORD)),
                'role'       => 'admin',
                'status'     => 'active',
            ]
        );
        $log->info("System user: id={$user->id} phone={$phone} (created=" . ($user->wasRecentlyCreated ? 'yes' : 'no') . ")");
        return $user->id;
    }

    /** Create or get user by phone (same phone across rows = one user). Call only when phone is non-empty. */
    private function createOrGetUser(string $phone, string $role, string $firstName, string $lastName): User
    {
        return User::firstOrCreate(
            ['phone' => $phone],
            [
                'first_name' => $firstName ?: 'Unknown',
                'last_name'  => $lastName !== '' ? $lastName : 'User',
                'password'   => Hash::make(env('LEGACY_USER_PASSWORD', Controller::_DEFAULT_PASSWORD)),
                'role'       => $role,
                'status'     => 'active',
            ]
        );
    }
}

