<?php

namespace Database\Seeders;

use App\Models\Fee;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LegacyFee9InvoicesSeeder extends Seeder
{
    public function run(): void
    {
        if (env('APP_ENV') === 'production') return;

        DB::disableQueryLog();

        $issueDate = Carbon::parse(env('LEGACY_SEED_DATE', '2024-04-19'))->toDateString();
        $legacyTimestamp = Carbon::parse($issueDate)->startOfDay();
        $batchId = env('LEGACY_BATCH_ID', 'legacy-' . $issueDate);

        $invoiceMonths = ['December/2025', 'January/2026', 'February/2026'];
        $monthCount = count($invoiceMonths);

        $fee = Fee::select(['id', 'name', 'category', 'amount'])->find(9);
        if (!$fee) {
            $this->command?->warn('Fee #9 not found. Seeder aborted.');
            return;
        }

        $totalAmount = $fee->amount;

        $unitChunkSize = (int) env('LEGACY_UNIT_CHUNK', 200);
        if ($unitChunkSize < 1) $unitChunkSize = 200;

        $unitsQuery = DB::table('units')->select('id')->orderBy('id');
        $unitsCount = (clone $unitsQuery)->count();
        if ($unitsCount === 0) {
            $this->command?->warn('No units found. Seeder aborted.');
            return;
        }

        $prefix = 'INV/' . Carbon::parse($issueDate)->format('ym') . '/';

        $this->command?->info("LegacyFee9InvoicesSeeder");
        $this->command?->line("  issue_date:  {$issueDate}");
        $this->command?->line("  batch:       {$batchId}");
        $this->command?->line("  fee:         #{$fee->id} — {$fee->name}");
        $this->command?->line("  months:      " . implode(', ', $invoiceMonths));
        $this->command?->line("  per-unit:    {$totalAmount} ({$fee->amount} x {$monthCount})");
        $this->command?->line("  units:       {$unitsCount}");
        $this->command?->line("  prefix:      {$prefix}######");

        DB::transaction(function () use (
            $fee,
            $totalAmount,
            $invoiceMonths,
            $unitsQuery,
            $unitChunkSize,
            $issueDate,
            $legacyTimestamp,
            $batchId,
            $prefix
        ) {
            $lastInvoiceNumber = Invoice::withTrashed()
                ->where('invoice_number', 'like', $prefix . '%')
                ->lockForUpdate()
                ->orderBy('invoice_number', 'desc')
                ->value('invoice_number');

            $next = $lastInvoiceNumber
                ? ((int) Str::afterLast($lastInvoiceNumber, '/')) + 1
                : 1;

            $unitsQuery->chunkById($unitChunkSize, function ($unitsChunk) use (
                $fee,
                $totalAmount,
                $invoiceMonths,
                $issueDate,
                $legacyTimestamp,
                $batchId,
                $prefix,
                &$next
            ) {
                $unitIds = $unitsChunk->pluck('id')->all();
                if (empty($unitIds)) return;

                $existing = Invoice::withTrashed()
                    ->where('issue_date', $issueDate)
                    ->where('source_type', Fee::class)
                    ->where('source_id', $fee->id)
                    ->whereIn('unit_id', $unitIds)
                    ->pluck('unit_id')
                    ->flip()
                    ->all();

                $rows = [];
                foreach ($unitIds as $unitId) {
                    if (isset($existing[$unitId])) continue;

                    $invoiceNumber = $prefix . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
                    $next++;

                    $legacyKey = "{$batchId}|unit:{$unitId}|fee:{$fee->id}";

                    $metadata = [
                        'legacy'           => true,
                        'legacy_batch'     => $batchId,
                        'legacy_key'       => $legacyKey,
                        'fee_snapshot'     => [
                            'id'       => $fee->id,
                            'name'     => $fee->name,
                            'category' => $fee->category,
                            'amount'   => (float) $fee->amount,
                        ],
                        'invoice_snapshot' => [
                            'invoice_months' => $invoiceMonths,
                        ],
                    ];

                    $rows[] = [
                        'invoice_number' => $invoiceNumber,
                        'user_id'        => null,
                        'unit_id'        => $unitId,
                        'issue_date'     => $issueDate,
                        'due_date'       => $issueDate,
                        'total_amount'   => $totalAmount,
                        'amount_paid'    => 0,
                        'status'         => 'issued',
                        'source_type'    => Fee::class,
                        'source_id'      => $fee->id,
                        'penalty_amount' => 0,
                        'metadata'       => json_encode($metadata),
                        'created_at'     => $legacyTimestamp,
                        'updated_at'     => $legacyTimestamp,
                    ];
                }

                if (!empty($rows)) {
                    DB::table('invoices')->insert($rows);
                }

                $this->command?->info("  Created " . count($rows) . " invoices for fee #{$fee->id}");
            });
        });
    }
}
