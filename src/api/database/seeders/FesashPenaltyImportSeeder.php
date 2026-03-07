<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\InvoicePenalty;
use App\Models\Payment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FesashPenaltyImportSeeder extends Seeder
{
    public function run(): void
    {
        $csvPath = base_path('database/seeders/csv/fesash_penalty_data.csv');
        $log = Log::build([
            'driver' => 'single',
            'path'   => storage_path('logs/fesash_penalty_import.log'),
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
            // CSV: 0: unit_name, 1: penality, 2: penality_reciept, 3: reference, 4: reciept
            $unitName      = trim($row[0]);
            $penaltyAmount = (float) trim($row[1]);
            $penReceipt    = trim($row[2]);
            $reference     = trim($row[3]);
            $receiptNumber = trim($row[4]);

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
                    $query->where('name', 'ፍሳሽ አና LED መብራት');
                })
                ->first();

            if (!$invoice) {
                $log->warning("Invoice for 'ፍሳሽ አና LED መብራት' not found for unit: $unitName. Skipping.");
                $skippedCount++;
                continue;
            }

            if (Payment::where('reference', $reference)->exists()) {
                // add number to the reference
                $reference = $reference . '-' . rand(1000, 9999);
            }

            try {
                DB::transaction(function () use ($invoice, $penaltyAmount, $penReceipt, $reference, $receiptNumber, $log) {

                    $hasPenalty = ($penaltyAmount == 500 && $penReceipt == $reference);

                    // 1. Add penalty if conditions met
                    if ($hasPenalty) {
                        InvoicePenalty::create([
                            'invoice_id'   => $invoice->id,
                            'amount'       => $penaltyAmount,
                            'applied_date' => now(),
                            'reason'       => "Imported penalty (ref: {$reference})",
                        ]);

                        $invoice->penalty_amount += $penaltyAmount;
                    }

                    // 2. Payment for the main invoice (full total_amount)
                    $mainPaymentAmount = $invoice->total_amount;
                    Payment::create([
                        'invoice_id'     => $invoice->id,
                        'amount'         => $mainPaymentAmount,
                        'method'         => 'bank_transfer',
                        'reference'      => $reference,
                        'status'         => 'confirmed',
                        'type'           => 'web',
                        'processed_by'   => 'system',
                        'processed_at'   => now(),
                        'receipt_number' => $receiptNumber,
                        'payment_date'   => now(),
                    ]);

                    $invoice->amount_paid += $mainPaymentAmount;

                    // 3. Payment for the penalty if it was added
                    if ($hasPenalty) {
                        Payment::create([
                            'invoice_id'     => $invoice->id,
                            'amount'         => $penaltyAmount,
                            'method'         => 'bank_transfer',
                            'reference'      => "{$reference}-PEN",
                            'status'         => 'confirmed',
                            'type'           => 'web',
                            'processed_by'   => 'system',
                            'processed_at'   => now(),
                            'receipt_number' => $penReceipt,
                            'payment_date'   => now(),
                        ]);

                        $invoice->amount_paid += $penaltyAmount;
                    }

                    // 4. Update invoice status
                    $totalOwed = $invoice->total_amount + $invoice->penalty_amount;
                    if ($invoice->amount_paid >= $totalOwed) {
                        $invoice->status = 'paid';
                    } else {
                        $invoice->status = 'partial';
                    }

                    $invoice->save();

                    $log->info("Processed: unit={$invoice->unit_id}, ref={$reference}, main={$mainPaymentAmount}" .
                        ($hasPenalty ? ", penalty={$penaltyAmount}" : '') .
                        ", status={$invoice->status}");
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
