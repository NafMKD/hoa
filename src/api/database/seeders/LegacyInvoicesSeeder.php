<?php

namespace Database\Seeders;

use App\Models\Fee;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class LegacyInvoicesSeeder extends Seeder
{
    public function run(): void
    {
        // disable if the env is production
        if (env('APP_ENV') === 'production') return;
        
        DB::disableQueryLog();

        // 1) One shared legacy date for ALL generated invoices
        $issueDate = Carbon::parse(env('LEGACY_SEED_DATE', '2024-04-19'))->toDateString();
        $legacyTimestamp = Carbon::parse($issueDate)->startOfDay();

        // 2) Helpful batch marker for filtering later
        $batchId = env('LEGACY_BATCH_ID', 'legacy-' . $issueDate);

        // Optional: filter fees via env (comma-separated). Default: all fees
        $feeIds = $this->csvIds(env('LEGACY_FEE_IDS', '11'));

        // Optional: chunk size for units
        $unitChunkSize = (int) env('LEGACY_UNIT_CHUNK', 200);
        if ($unitChunkSize < 1) $unitChunkSize = 200;

        // Fees to invoice (different fees)
        $feesQuery = Fee::query()->select(['id', 'name', 'category', 'amount']);
        if (!empty($feeIds)) {
            $feesQuery->whereIn('id', $feeIds);
        }
        $fees = $feesQuery->orderBy('id')->get();

        if ($fees->isEmpty()) {
            $this->command?->warn('No fees found. Seeder will not create invoices.');
            return;
        }

        // Units: ALL units in DB 
        $unitsQuery = DB::table('units')->select('id')->orderBy('id');

        $unitsCount = (clone $unitsQuery)->count();
        if ($unitsCount === 0) {
            $this->command?->warn('No units found. Seeder will not create invoices.');
            return;
        }

        // Invoice number prefix based on the chosen legacy date
        $prefix = 'INV/' . Carbon::parse($issueDate)->format('ym') . '/';

        $this->command?->info("LegacyInvoicesSeeder");
        $this->command?->line("  issue_date: {$issueDate}");
        $this->command?->line("  batch:      {$batchId}");
        $this->command?->line("  units:      {$unitsCount}");
        $this->command?->line("  fees:       {$fees->count()}");
        $this->command?->line("  user_id:    NULL (unassigned)");
        $this->command?->line("  prefix:     {$prefix}######");

        DB::transaction(function () use (
            $fees,
            $feesQuery,
            $unitsQuery,
            $unitChunkSize,
            $issueDate,
            $legacyTimestamp,
            $batchId,
            $prefix
        ) {
            // Lock + read last invoice number ONCE, then increment in memory
            $lastInvoiceNumber = Invoice::withTrashed()
                ->where('invoice_number', 'like', $prefix . '%')
                ->lockForUpdate()
                ->orderBy('invoice_number', 'desc')
                ->value('invoice_number');

            $next = $lastInvoiceNumber
                ? ((int) Str::afterLast($lastInvoiceNumber, '/')) + 1
                : 1;

            $feeIdsForLookup = $fees->pluck('id')->all();

            $unitsQuery->chunkById($unitChunkSize, function ($unitsChunk) use (
                $fees,
                $feeIdsForLookup,
                $issueDate,
                $legacyTimestamp,
                $batchId,
                $prefix,
                &$next
            ) {
                $unitIds = $unitsChunk->pluck('id')->all();
                if (empty($unitIds)) return;

                /**
                 * Idempotency (fast, cross-db):
                 * skip creating if invoice already exists for:
                 * unit_id + source_type(Fee::class) + source_id(fee_id) + issue_date
                 * Includes soft-deleted invoices so we don’t recreate duplicates.
                 */
                $existing = Invoice::withTrashed()
                    ->where('issue_date', $issueDate)
                    ->where('source_type', \App\Models\Fee::class)
                    ->whereIn('unit_id', $unitIds)
                    ->whereIn('source_id', $feeIdsForLookup)
                    ->get(['unit_id', 'source_id']);

                $existingMap = [];
                foreach ($existing as $inv) {
                    $existingMap[$inv->unit_id . '|' . $inv->source_id] = true;
                }

                $rows = [];
                foreach ($unitIds as $unitId) {
                    foreach ($fees as $fee) {
                        $key = $unitId . '|' . $fee->id;
                        if (isset($existingMap[$key])) {
                            continue;
                        }

                        $invoiceNumber = $prefix . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
                        $next++;

                        $legacyKey = "{$batchId}|unit:{$unitId}|fee:{$fee->id}";

                        $metadata = [
                            'legacy'       => true,
                            'legacy_batch' => $batchId,
                            'legacy_key'   => $legacyKey,
                            'fee_snapshot' => [
                                'id'       => $fee->id,
                                'name'     => $fee->name,
                                'category' => $fee->category,
                                'amount'   => (float) $fee->amount,
                            ]
                        ];

                        $rows[] = [
                            'invoice_number' => $invoiceNumber,
                            'user_id'        => null,

                            'unit_id'        => $unitId,
                            'issue_date'     => $issueDate,
                            'due_date'       => $issueDate, 

                            'total_amount'   => $fee->amount,
                            'amount_paid'    => 0,
                            'status'         => 'issued',

                            'source_type'    => \App\Models\Fee::class, 
                            'source_id'      => $fee->id,

                            'penalty_amount' => 0,

                            'metadata'       => json_encode($metadata),

                            'created_at'     => $legacyTimestamp,
                            'updated_at'     => $legacyTimestamp,
                        ];
                    }
                }

                if (!empty($rows)) {
                    DB::table('invoices')->insert($rows);
                }

                $this->command?->info("  Created " . count($rows) . " invoices");
            });
        });
    }

    private function csvIds(string $value): array
    {
        $value = trim($value);
        if ($value === '') return [];

        return array_values(array_filter(array_map(
            fn ($v) => (int) trim($v),
            explode(',', $value)
        )));
    }
}
