<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\InvoicePenalty;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LegacyPaymentImportSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Configuration
        $csvPath = base_path('database/seeders/csv/june_payments.csv');
        $targetMonth = "June/2024";
        $issueDate = Carbon::parse(env('LEGACY_SEED_DATE', '2024-04-19'))->toDateString();
        $log_date = str_replace('/', '_', $targetMonth);
        $log = Log::build([
            'driver' => 'single',
            'path' => storage_path("logs/legacy_payment_import_{$log_date}.log"),
            ]);
        
        if (!file_exists($csvPath)) {
            $log->error("File not found at: $csvPath");
            return;
        }

        // 2. Pre-load Units into memory to avoid N+1 queries inside the loop
        // Mapping: 'Unit Name' => unit_id
        $log->info("Caching units...");
        $unitsMap = DB::table('units')->pluck('id', 'name')->toArray(); 

        $handle = fopen($csvPath, 'r');
        // Skip header row if exists
        fgetcsv($handle); 

        $log->info("Starting Import...");

        $successCount = 0;
        $skippedCount = 0;

        while (($row = fgetcsv($handle)) !== false) {
            // Map CSV columns based on your structure
            // 0: unit_name, 1: amount, 2: reference, 3: receipt_number
            $unitName      = trim($row[0]);
            $paymentAmount = (float) trim($row[1]);
            $reference     = trim($row[2]);
            $receiptNumber = trim($row[3]);

            // A. Find Unit ID
            if (!isset($unitsMap[$unitName])) {
                $log->warning("Unit not found: $unitName. Skipping.");
                $skippedCount++;
                continue;
            }
            $unitId = $unitsMap[$unitName];

            // B. Find the specific Invoice
            // We search for invoices belonging to this unit, then filter by the JSON path
            $invoice = Invoice::where('unit_id', $unitId)
                ->whereNotIn('status', ['cancelled', 'paid'])
                ->get()
                ->first(function ($inv) use ($targetMonth) {
                    // Navigate the JSON structure: metadata -> invoice_snapshot -> invoice_months -> [0]
                    $months = $inv->metadata['invoice_snapshot']['invoice_months'] ?? [];
                    return isset($months[0]) && $months[0] === $targetMonth;
                });

            if (!$invoice) {
                $log->warning("Target invoice ($targetMonth) not found for unit: $unitName. Skipping.");
                $skippedCount++;
                continue;
            }

            // C. Check for duplicate payment (Idempotency)
            if (Payment::where('reference', $reference)->exists()) {
                $log->warning("Payment reference $reference already exists. Skipping.");
                $skippedCount++;
                continue;
            }

            // D. Check if the amount greater than 2400 or less than 2100
            if ($paymentAmount > 2400 || $paymentAmount < 2100) {
                if ($paymentAmount > 2400) {
                    $log->warning("Payment amount $paymentAmount greater than 2400. Skipping.");
                } else {  
                    $log->warning("Payment amount $paymentAmount less than 2100. Skipping.");
                }
                $skippedCount++;
                continue;
            }

            // E. Process Logic inside Transaction
            try {
                DB::transaction(function () use ($invoice, $paymentAmount, $reference, $receiptNumber, $issueDate) {
                    
                    // 1. Calculate Penalties
                    $penaltyCount = 0;
                    
                    // Logic based on specific amounts provided
                    if ($paymentAmount == 2200) {
                        $penaltyCount = 1;
                    } elseif ($paymentAmount == 2300) {
                        $penaltyCount = 2;
                    } elseif ($paymentAmount == 2400) {
                        $penaltyCount = 3;
                    }
                    // If 2100, count remains 0.

                    // 2. Create Penalty Records
                    $penaltyTotal = 0;
                    if ($penaltyCount > 0) {
                        for ($i = 0; $i < $penaltyCount; $i++) {
                            $periodCounter = $i+1;
                            InvoicePenalty::create([
                                'invoice_id'   => $invoice->id,
                                'amount'       => 100.00,
                                'applied_date' => $issueDate, 
                                'reason'       => "Overdue Period #{$periodCounter}",
                            ]);
                            $penaltyTotal += 100;
                        }
                    }

                    // 3. Update Invoice Totals
                    // We must increase the total_amount by the penalty amount so the math balances
                    $invoice->penalty_amount += $penaltyTotal;
                    $invoice->amount_paid    += $paymentAmount;

                    // Determine Status
                    if ($invoice->amount_paid >= $invoice->total_amount + $invoice->penalty_amount) {
                        $invoice->status = 'paid';
                    } else {
                        $invoice->status = 'partial';
                    }
                    
                    $invoice->save();

                    // 4. Create Payment Record
                    Payment::create([
                        'invoice_id'      => $invoice->id,
                        'amount'          => $paymentAmount,
                        'method'          => 'bank_transfer', 
                        'reference'       => $reference,
                        'status'          => 'confirmed',     
                        'type'            => 'web',           
                        'processed_by'    => 'system',
                        'processed_at'    => $issueDate,
                        'receipt_number'  => $receiptNumber,
                        'payment_date'    => $issueDate,           
                    ]);

                });

                $successCount++;
                $log->info("Processed: $unitName | Amount: $paymentAmount");

            } catch (\Exception $e) {
                $log->error("Error processing $unitName: " . $e->getMessage());
                Log::error("Import Error $unitName", ['error' => $e]);
            }
        }

        fclose($handle);
        $log->info("Import Complete. Success: $successCount, Skipped: $skippedCount");
    }
}