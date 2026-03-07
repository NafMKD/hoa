<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MengedPaymentImportSeeder extends Seeder
{
    public function run(): void
    {
        $csvPath = base_path('database/seeders/csv/menged_data.csv');
        $log = Log::build([
            'driver' => 'single',
            'path'   => storage_path('logs/menged_payment_import.log'),
        ]);

        if (!file_exists($csvPath)) {
            $log->error("File not found at: $csvPath");
            return;
        }

        $unitsMap = DB::table('units')->pluck('id', 'name')->toArray();
        $handle = fopen($csvPath, 'r');
        fgetcsv($handle);

        $successCount = 0;
        $skippedCount = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $unitName      = trim($row[0] ?? '');
            $reference     = trim($row[1] ?? '');
            $receiptNumber = trim($row[2] ?? '');

            if (empty($unitName) || empty($reference)) {
                $log->warning("Skipping: Missing unit or reference. Row: $unitName");
                $skippedCount++;
                continue;
            }

            if (!isset($unitsMap[$unitName])) {
                $log->warning("Unit not found: $unitName. Skipping.");
                $skippedCount++;
                continue;
            }
            $unitId = $unitsMap[$unitName];

            $invoice = Invoice::where('unit_id', $unitId)
                ->whereNotIn('status', ['cancelled', 'paid'])
                ->whereHas('source', function ($query) {
                    $query->where('name', 'የመንገድ');
                })
                ->first();

            if (!$invoice) {
                $log->warning("Invoice for 'የመንገድ' not found for unit: $unitName. Skipping.");
                $skippedCount++;
                continue;
            }

            if (Payment::where('reference', $reference)->exists()) {
                $reference = $reference . '-' . rand(1000, 9999);
            }

            try {
                DB::transaction(function () use ($invoice, $reference, $receiptNumber, $log) {
                    $paymentAmount = $invoice->total_amount;

                    Payment::create([
                        'invoice_id'     => $invoice->id,
                        'amount'         => $paymentAmount,
                        'method'         => 'bank_transfer',
                        'reference'      => $reference,
                        'status'         => 'confirmed',
                        'type'           => 'web',
                        'processed_by'   => 'system',
                        'processed_at'   => now(),
                        'receipt_number' => $receiptNumber,
                        'payment_date'   => now(),
                    ]);

                    $invoice->amount_paid += $paymentAmount;

                    $totalOwed = $invoice->total_amount + $invoice->penalty_amount;
                    if ($invoice->amount_paid >= $totalOwed) {
                        $invoice->status = 'paid';
                    } else {
                        $invoice->status = 'partial';
                    }

                    $invoice->save();

                    $log->info("Processed: unit={$invoice->unit_id}, ref={$reference}, amount={$paymentAmount}, status={$invoice->status}");
                });

                $successCount++;
            } catch (\Exception $e) {
                $log->error("Error processing $unitName (ref: $reference): " . $e->getMessage());
            }
        }

        fclose($handle);
        $log->info("Import Complete. Success: $successCount, Skipped: $skippedCount");
    }
}
