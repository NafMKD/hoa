<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Fee;
use App\Models\Invoice;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class InvoiceRepository 
{
    /**
     * Generate next invoice number
     * Example: INV/2311/000042 -> Year 2023, November, 42nd invoice
     * 
     * @return string
     */
    public function generateNextInvoiceNumber(): string
    {
        return DB::transaction(function () {
            $currentMonth = date('m');
            $currentYear = date('y');
            $prefix = "INV/{$currentYear}{$currentMonth}/";
            
            // Use database locking to prevent race conditions
            $lastInvoice = Invoice::where('invoice_number', 'LIKE', $prefix . '%')
                ->lockForUpdate()
                ->orderBy('created_at', 'desc')
                ->first();
            
            if ($lastInvoice) {
                $parts = explode('/', $lastInvoice->invoice_number);
                $lastIncrement = (int) end($parts);
                $nextIncrement = $lastIncrement + 1;
            } else {
                $nextIncrement = 1;
            }
            
            return sprintf('%s%06d', $prefix, $nextIncrement);
        });
    }

    /**
     * Generate an invoice for a given fee.
     * 
     * @param Collection $units
     * @param Fee $fee
     * @return bool
     * @throws RepositoryException
     */
    public function generateInvoiceForFee(Collection $units, Fee $fee): bool
    {
        // Check if the category is valid for `administrational' invoicing 
        if ($fee->category !== Controller::_FEE_CATEGORIES[0]) {
            throw new RepositoryException('Fee category not valid for invoicing.');
        }

        

        DB::beginTransaction();
        
        try {

            // Loop through units to create invoices
            foreach ($units as $unit) {
                $data = $this->createInvoiceForUnit($unit, $fee);

                if ($data === null) {
                    continue; // Skip invoice generation for this unit
                }

                Invoice::create($data);
            }

            DB::commit();
            return true;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to generate invoice: ' . $e->getMessage());
        }
    }

    /**
     * Create an invoice for a specific unit based on its status.
     * 
     * @param Unit $unit 
     * @return array|null
     * @throws RepositoryException
     */
    public function createInvoiceForUnit(Unit $unit, Fee $fee): array|null
    {
        $generable = true;

        $data = [
            'invoice_number' => $this->generateNextInvoiceNumber(),
            'unit_id' => $unit->id,
            'issue_date' => now(),
            'due_date' => now()->addDays(Controller::_DEFAULT_DUE_DAYS), 
            'total_amount' => $fee->amount,
            'amount_paid' => 0.00,
            'status' => Controller::_INVOICE_STATUSES[0], // issued
            'source_type' => 'fee',
            'source_id' => $fee->id,
            'penalty_amount' => 0.00,
            'metadata' => ['generated_by' => 'system']
        ];

        switch ($unit->status) {
            case Controller::_UNIT_STATUSES[0]: // rented
                if ($unit->tenant->id === null) {
                    throw new RepositoryException('Rented unit has no active tenant.');
                }
                $data['user_id'] = $unit->tenant->id;
                break;
            case Controller::_UNIT_STATUSES[1]: // owner_ocupied
                $data['user_id'] = $unit->owner_id;
                break;
            case Controller::_UNIT_STATUSES[2]: // vacant
                $data['user_id'] = null; 
                $generable = false; // Skip invoice generation for vacant units
                break;
            default:
                throw new RepositoryException('Invalid unit status for invoicing.');
        }

        if ($generable) {
            return $data;
        } 

        return null;
    }
}