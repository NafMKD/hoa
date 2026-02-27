<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\InvoicePenalty;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LegacyMultiPaymentImportSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Setup Custom Logging
        $targetMonth = "September/2024";
        $log_date = str_replace('/', '_', $targetMonth);
        $log = Log::build([
            'driver' => 'single',
            'path'   => storage_path("logs/legacy_payment_import_{$log_date}.log"),
        ]);

        $log->info("--- Starting Multi-Column Import " . now()->toDateTimeString() . " ---");

        // 2. Configuration
        $csvPath = base_path('database/seeders/csv/september_payments.csv');
        $issueDate = Carbon::parse(env('LEGACY_SEED_DATE', '2024-04-19'))->toDateString();

        if (!file_exists($csvPath)) {
            $this->command->error("File not found at: $csvPath");
            $log->error("File not found at: $csvPath");
            return;
        }

        // 3. Cache Units
        $this->command->info("Caching units...");
        $unitsMap = DB::table('units')->pluck('id', 'name')->toArray();

        $handle = fopen($csvPath, 'r');
        fgetcsv($handle); 

        $successCount = 0;
        $skippedCount = 0;

        while (($row = fgetcsv($handle)) !== false) {
            // CSV: unit_name, amount_1, amount_2, amount_3, reference, receipt_number
            $unitName = trim($row[0]);
            $amt1     = (float) trim($row[1]);
            $amt2     = (float) trim($row[2]);
            $amt3     = (float) trim($row[3]);
            $ref      = trim($row[4]);
            $receipt  = trim($row[5]);

            // --- A. Basic Validation ---
            if (!isset($unitsMap[$unitName])) {
                $log->warning("SKIPPED: Unit '$unitName' not found.");
                $skippedCount++;
                continue;
            }
            $unitId = $unitsMap[$unitName];

            // --- B. Calculate Splits & Validate Amounts ---
            $calc = $this->calculateSplits($amt1, $amt2, $amt3);

            if ($calc['error']) {
                $log->warning("SKIPPED: Invalid Amounts for '$unitName'. Error: {$calc['error']}");
                $skippedCount++;
                continue;
            }

            // --- C. Find Invoices ---
            // 1. Find Main Invoice 
            $mainInvoice = Invoice::where('unit_id', $unitId)
                ->whereNotIn('status', ['cancelled', 'paid'])
                ->get()
                ->first(function ($inv) use ($targetMonth) {
                    $months = $inv->metadata['invoice_snapshot']['invoice_months'] ?? [];
                    return isset($months[0]) && $months[0] === $targetMonth;
                });

            if (!$mainInvoice) {
                $log->warning("SKIPPED: Main Invoice '$targetMonth' not found for '$unitName'.");
                $skippedCount++;
                continue;
            }

            // 2. Find Secondary Invoice (if needed)
            // We search for ANY other active invoice for this unit that isn't the main one
            $secondaryInvoice = null;
            if ($calc['total_secondary_payment'] > 0) {
                $secondaryInvoice = Invoice::where('unit_id', $unitId)
                    ->whereNotIn('status', ['cancelled', 'paid'])
                    ->get()
                    ->first(function ($inv) use ($targetMonth) {
                        $months = $inv->metadata['fee_snapshot']['name'] ?? null;
                        return isset($months) && $months == "ማስተካከያ ክፍያ";
                    });

                if (!$secondaryInvoice) {
                    $log->warning("SKIPPED: Secondary invoice needed ($calc[total_secondary_payment]) but not found for '$unitName'.");
                    $skippedCount++;
                    continue;
                }
            }

            // --- D. DB Transaction ---
            try {
                DB::transaction(function () use ($mainInvoice, $secondaryInvoice, $calc, $ref, $receipt, $issueDate) {
                    
                    // 1. Process Main Invoice Penalties
                    $penaltyTotal = 0;
                    for ($i = 0; $i < $calc['penalties_count']; $i++) {
                        $periodCounter = $i+1;
                        InvoicePenalty::create([
                            'invoice_id'   => $mainInvoice->id,
                            'amount'       => 100.00,
                            'applied_date' => $issueDate,
                            'reason'       => "Overdue Period #{$periodCounter}",
                        ]);
                        $penaltyTotal += 100;
                    }

                    // 2. Update Main Invoice
                    if ($calc['total_main_payment'] > 0 || $penaltyTotal > 0) {
                        $mainInvoice->penalty_amount += $penaltyTotal;
                        $mainInvoice->amount_paid    += $calc['total_main_payment'];
                        
                        // Status Update
                        $mainInvoice->status = ($mainInvoice->amount_paid >= $mainInvoice->total_amount + $mainInvoice->penalty_amount) ? 'paid' : 'partial';
                        $mainInvoice->save();

                        // Payment Record (Main)
                        Payment::create([
                            'invoice_id'     => $mainInvoice->id,
                            'amount'         => $calc['total_main_payment'],
                            'method'         => 'bank_transfer',
                            'reference'      => $ref, 
                            'status'         => 'confirmed',
                            'type'           => 'web',
                            'processed_by'   => 'system',
                            'processed_at'   => $issueDate,
                            'receipt_number' => $receipt,
                        ]);
                    }

                    // 3. Process Secondary Invoice (if applicable)
                    if ($secondaryInvoice && $calc['total_secondary_payment'] > 0) {
                        $secondaryInvoice->amount_paid += $calc['total_secondary_payment'];
                        $secondaryInvoice->status = ($secondaryInvoice->amount_paid >= $secondaryInvoice->total_amount) ? 'paid' : 'partial';
                        $secondaryInvoice->save();

                        // Payment Record (Secondary)
                        // Note: Reference must be unique, so we append a suffix
                        Payment::create([
                            'invoice_id'     => $secondaryInvoice->id,
                            'amount'         => $calc['total_secondary_payment'],
                            'method'         => 'bank_transfer',
                            'reference'      => $ref . '_SEC', 
                            'status'         => 'confirmed',
                            'type'           => 'web',
                            'processed_by'   => 'system',
                            'processed_at'   => $issueDate,
                            'receipt_number' => $receipt,
                        ]);
                    }
                });

                $successCount++;
                $log->info("SUCCESS: $unitName | Main: {$calc['total_main_payment']} | Sec: {$calc['total_secondary_payment']} | Pen: {$calc['penalties_count']}");

            } catch (\Exception $e) {
                $log->error("ERROR: DB Transaction failed for $unitName. " . $e->getMessage());
            }
        }

        fclose($handle);
        $log->info("--- Import Complete. Success: $successCount, Skipped: $skippedCount ---");
        $this->command->info("Done. Check logs/legacy_payment_import_{$log_date}.log");
    }

    /**
     * Helper to calculate logic without DB interaction
     */
    private function calculateSplits(float $a1, float $a2, float $a3): array
    {
        $penalties = 0;
        $mainPay   = 0;
        $secPay    = 0;

        // --- Amount 1 Logic ---
        // Allowed: 700, 800
        if ($a1 == 800) {
            $penalties++;
            $mainPay += 800;
        } elseif ($a1 == 700) {
            $mainPay += 700;
        } else { 
             return ['error' => "Month 1 invalid value: $a1", 'total_main_payment' => 0, 'total_secondary_payment' => 0, 'penalties_count' => 0];
        }

        // --- Amount 2 Logic ---
        // Allowed: 700, 800, 1000, 1100
        if (!in_array($a2, [700, 800, 1000, 1100])) {
             return ['error' => "Month 2 invalid value: $a2", 'total_main_payment' => 0, 'total_secondary_payment' => 0, 'penalties_count' => 0];
        }

        if ($a2 == 800) {
            $penalties++;
            $mainPay += 800;
        } elseif ($a2 == 1100) {
            $penalties++;
            $mainPay += 800; 
            $secPay  += 300; 
        } elseif ($a2 == 1000) {
            $mainPay += 700;
            $secPay  += 300;
        } elseif ($a2 == 700) {
            $mainPay += 700;
        }

        // --- Amount 3 Logic (Same as 2) ---
        if (!in_array($a3, [700, 800, 1000, 1100])) {
             return ['error' => "Month 3 invalid value: $a3", 'total_main_payment' => 0, 'total_secondary_payment' => 0, 'penalties_count' => 0];
        }

        if ($a3 == 800) {
            $penalties++;
            $mainPay += 800;
        } elseif ($a3 == 1100) {
            $penalties++;
            $mainPay += 800;
            $secPay  += 300;
        } elseif ($a3 == 1000) {
            $mainPay += 700;
            $secPay  += 300;
        } elseif ($a3 == 700) {
            $mainPay += 700;
        }

        return [
            'error'                   => null,
            'total_main_payment'      => $mainPay,
            'total_secondary_payment' => $secPay,
            'penalties_count'         => $penalties
        ];
    }
}