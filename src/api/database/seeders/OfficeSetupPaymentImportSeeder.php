<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Fee; // Ensure Fee model exists or use DB::table
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OfficeSetupPaymentImportSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Setup Logging
        $log = Log::build([
            'driver' => 'single',
            'path'   => storage_path('logs/legacy_payment_import_office_setup.log'),
        ]);
        
        $log->info("--- Starting Office Setup Payment Import ---");

        // 2. Config
        $csvPath = base_path('database/seeders/csv/office_setup_payments.csv');
        $targetFeeName = "የቢሮ ማደራጃ"; 
        $issueDate = Carbon::parse(env('LEGACY_SEED_DATE', '2024-04-19'))->toDateString();

        if (!file_exists($csvPath)) {
            $this->command->error("File not found: $csvPath");
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
            // CSV: unit_name, amount, reference, receipt_number
            $unitName      = trim($row[0]);
            $amount        = (float) trim($row[1]);
            $reference     = trim($row[2]);
            $receiptNumber = trim($row[3]);

            // Validation: Unit
            if (!isset($unitsMap[$unitName])) {
                $log->warning("SKIPPED: Unit '$unitName' not found.");
                $skippedCount++;
                continue;
            }
            $unitId = $unitsMap[$unitName];

            // Validation: Amount Supported?
            if (!in_array($amount, [2000, 3400, 5500])) {
                $log->warning("SKIPPED: Unsupported amount ($amount) for '$unitName'.");
                $skippedCount++;
                continue;
            }

            // Find Main Invoice
            // Filtering by JSON path: metadata -> fee_invoice -> name
            $mainInvoice = Invoice::where('unit_id', $unitId)
                ->whereNotIn('status', ['cancelled', 'paid'])
                ->get()
                ->first(function ($inv) use ($targetFeeName) {
                    // Check the specific path requested
                    return ($inv->metadata['fee_snapshot']['name'] ?? '') === $targetFeeName;
                });

            if (!$mainInvoice) {
                $log->warning("SKIPPED: Main Invoice '$targetFeeName' not found for '$unitName'.");
                $skippedCount++;
                continue;
            }

            // Validation: Duplicate Reference
            if (Payment::where('reference', $reference)->exists()) {
                $log->info("SKIPPED: Duplicate reference '$reference'.");
                $skippedCount++;
                continue;
            }

            try {
                DB::transaction(function () use ($mainInvoice, $amount, $reference, $receiptNumber, $unitId, $issueDate) {
                    
                    // --- STEP 1: Pay the Main Invoice (Always 2000) ---
                    $this->payInvoice($mainInvoice, 2000, $reference, $receiptNumber, $issueDate);

                    // --- STEP 2: Handle Extra Amounts ---
                    if ($amount == 3400) {
                        // Case 2: 3400 Total -> 2000 Main + 1400 Split (Fee 5: 700, Fee 4: 700)
                        
                        $invA = $this->createAuxInvoice($unitId, 5, 700, 'Fee ID 5 Split', $issueDate, ['name' => "ተከራይ ክፍያ", "category" => "administrational", "amount" =>"700"]);
                        $this->payInvoice($invA, 700, $reference . '-EXT1', $receiptNumber, $issueDate);

                        $invB = $this->createAuxInvoice($unitId, 4, 700, 'Fee ID 4 Split', $issueDate, ['name' => "አከራይ ክፍያ", "category" => "administrational", "amount" =>"700"]);
                        $this->payInvoice($invB, 700, $reference . '-EXT2', $receiptNumber, $issueDate);

                    } elseif ($amount == 5500) {
                        // Case 3: 5500 Total -> 2000 Main + 3500 Split (Fee 6: 1500, Fee 7: 2000)

                        $invA = $this->createAuxInvoice($unitId, 6, 1500, 'Fee ID 6 Split', $issueDate, ['name' => "አከራይ ክፍያ", "category" => "administrational", "amount" =>"1500"]);
                        $this->payInvoice($invA, 1500, $reference . '-EXT1', $receiptNumber, $issueDate);

                        $invB = $this->createAuxInvoice($unitId, 7, 2000, 'Fee ID 7 Split', $issueDate, ['name' => "ተከራይ ክፍያ", "category" => "administrational", "amount" =>"2000"]);
                        $this->payInvoice($invB, 2000, $reference . '-EXT2', $receiptNumber, $issueDate);
                    }
                });

                $successCount++;
                $log->info("SUCCESS: $unitName | Amount: $amount");

            } catch (\Exception $e) {
                $log->error("ERROR: Processing $unitName. " . $e->getMessage());
            }
        }

        fclose($handle);
        $this->command->info("Done. Check logs/office_setup_import.log");
    }

    /**
     * Helper to Create a New Invoice on the fly
     */
    private function createAuxInvoice($unitId, $feeId, $amount, $note, $issueDate, $fee)
    {
        $prefix = 'INV/' . Carbon::parse($issueDate)->format('ym') . '/';
        $lastInvoiceNumber = Invoice::withTrashed()
            ->where('invoice_number', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderBy('invoice_number', 'desc')
            ->value('invoice_number');

        $next = $lastInvoiceNumber
            ? ((int) Str::afterLast($lastInvoiceNumber, '/')) + 1
            : 1;

        $invNum = $prefix . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
        $legacyTimestamp = Carbon::parse($issueDate)->startOfDay();

        return Invoice::create([
            'invoice_number' => $invNum,
            'user_id'        => null, 
            'unit_id'        => $unitId,
            'issue_date'     => $issueDate,
            'due_date'       => $issueDate,
            'total_amount'   => $amount,
            'amount_paid'    => 0,
            'status'         => 'issued',
            'source_type'    => \App\Models\Fee::class, 
            'source_id'      => $feeId,
            'penalty_amount' => 0,
            'metadata'       => json_encode([
                'legacy'       => true,
                'legacy_batch' => 'legacy-2024-04-19',
                'legacy_key'   => "legacy-2024-04-19|unit:{$unitId}|fee:{$feeId}",
                'fee_snapshot' => [
                    'id'       => $feeId,
                    'name'     => $fee['name'],
                    'category' => $fee['category'],
                    'amount'   => (float) $fee['amount'],
                ], 
                'note' => $note
            ]),
            'created_at'     => $legacyTimestamp,
            'updated_at'     => $legacyTimestamp,
        ]);
    }

    /**
     * Helper to Pay an Invoice
     */
    private function payInvoice(Invoice $invoice, $amount, $ref, $receipt, $issueDate)
    {
        // Update Invoice
        $invoice->amount_paid += $amount;
        if ($invoice->amount_paid >= $invoice->total_amount) {
            $invoice->status = 'paid';
        } else {
            $invoice->status = 'partial';
        }
        $invoice->save();

        // Create Payment
        Payment::create([
            'invoice_id'     => $invoice->id,
            'amount'         => $amount,
            'method'         => 'bank_transfer',
            'reference'      => $ref,
            'status'         => 'confirmed',
            'type'           => 'web',
            'processed_by'   => 'system',
            'processed_at'   => $issueDate,
            'receipt_number' => $receipt,
        ]);
    }
}