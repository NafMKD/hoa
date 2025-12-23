<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Fee;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InvoiceRepository 
{
    /**
     * Get all invoices with optional pagination.
     * 
     * @param  int|null  $perPage
     * @param  array  $filters
     * @return Collection|LengthAwarePaginator
     */
    public function all(?int $perPage = null, array $filters): Collection|LengthAwarePaginator
    {        
        $query = Invoice::query();

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('total_amount', 'like', "%{$search}%");
            });
        }

        $query->orderBy('created_at', 'desc');

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * Search users by invoice name or phone.
     * Additional filters can be added.
     * ['role', 'status']
     * 
     * @param  string  $term
     * @param  array  $filers
     * @return Collection
     */
    public function search(string $term, array $filers = []): Collection
    {   
        $query = Invoice::query()
            ->where(function ($q) use ($term) {
                $q->where('invoice_number', 'like', "%{$term}%")
                  ->orWhere('total_amount', 'like', "%{$term}%");
            });

        if (!empty($filers['status'])) {
            $query->whereIn('status', $filers['status']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Create a new invoice.
     * 
     * @param array<string, mixed> $data
     * @return Invoice
     * @throws RepositoryException
     */
    public function create(array $data): Invoice
    {
        DB::beginTransaction();

        try {
            // Generate unique invoice number
            $data['invoice_number'] = $this->generateNextInvoiceNumber();
            $data['amount_paid'] = 0.00;
            $data['status'] = Controller::_INVOICE_STATUSES[0]; // issued
            $data['penalty_amount'] = 0.00;
            $data['metadata'] = $data['metadata'] ?? [];

            $invoice = Invoice::create($data);
            DB::commit();
            return $invoice;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to create invoice: ' . $e->getMessage());
        }
    }

    /**
     * Soft delete a invoice.
     * 
     * @param  Invoice  $invoice
     * @return bool
     * @throws RepositoryException
     */
    public function delete(Invoice $invoice): bool
    {
        return DB::transaction(function () use ($invoice) {
            
            // TODO: Add any pre-deletion checks here
            return $invoice->delete();
        });
    }

    /*
    |--------------------------------------------------------------------------------------------
    |
    | --- Helper Methods ---
    |
    |---------------------------------------------------------------------------------------------
    */

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
     * Set an invoice as paid|partial.
     * 
     * @param  Invoice  $invoice
     * @param  Payment  $payment
     * @return Invoice
     * @throws RepositoryException
     */
    public function setAsPaid(Invoice $invoice, Payment  $payment): Invoice
    {
        if ($payment->amount <= 0) {
            throw new RepositoryException('Payment amount must be greater than zero.');
        }

        // check if the invoice is overdue
        if ($invoice->is_overdue) {
            if ($invoice->status !== Controller::_INVOICE_STATUSES[3]) {
                // mark as overdue if not already marked
                $invoice = $this->markInvoiceAsOverdue($invoice);
            }
        }

        if ($payment->amount > $invoice->out_standing_amount) {
            throw new RepositoryException('Payment exceeds total amount due.');
        }

        // check if the invoice is already paid
        if ($invoice->status === Controller::_INVOICE_STATUSES[2]) { // paid
            throw new RepositoryException('Invoice is already fully paid.');
        }

        return DB::transaction(function () use ($invoice, $payment) { 

            if ($payment->amount >= $invoice->out_standing_amount) {
                $invoice->status = Controller::_INVOICE_STATUSES[2]; // paid
            } else {
                $invoice->status = Controller::_INVOICE_STATUSES[1]; // partial
            }

            $invoice->update([
                'amount_paid' => $payment->amount + $invoice->amount_paid,
            ]);

            $payment->update([
                'status' => Controller::_PAYMENT_STATUSES[1], // confirmed
                'processed_by' => Controller::_PAYMENT_PROCESSED_BY[1],
                'processed_at' => now()
            ]);

            return $invoice->refresh();
        });
    }

    /**
     * Set an invoice as refunded.
     * 
     * @param  Invoice  $invoice
     * @param  Payment  $payment
     * @return Invoice
     */
    public function setAsRefunded(Invoice $invoice, Payment  $payment): Invoice 
    {
        return DB::transaction(function () use ($invoice, $payment) {
            // Adjust the amount paid on the invoice
            $newAmountPaid = max(0, $invoice->amount_paid - $payment->amount);

            // Determine new status
            if ($newAmountPaid == 0) {
                $newStatus = Controller::_INVOICE_STATUSES[0]; // issued
            } elseif ($newAmountPaid < $invoice->total_amount + $invoice->penalty_amount) {
                $newStatus = Controller::_INVOICE_STATUSES[1]; // partial
            } else {
                $newStatus = Controller::_INVOICE_STATUSES[2]; // paid
            }

            // Update invoice
            $invoice->update([
                'amount_paid' => $newAmountPaid,
                'status' => $newStatus
            ]);

            // Update payment
            $payment->update([
                'status' => Controller::_PAYMENT_STATUSES[3], // refunded
                'processed_by' => Controller::_PAYMENT_PROCESSED_BY[1],
                'processed_at' => now()
            ]);

            return $invoice->refresh();
        });
    }

    /*
    |--------------------------------------------------------------------------------------------
    |
    | --- Automatic Invoice Generation for Recurring Fees ---
    |
    |---------------------------------------------------------------------------------------------
    */

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
            'source_type' => 'App\\Models\\Fee',
            'source_id' => $fee->id,
            'penalty_amount' => 0.00,
            'metadata' => ['generated_by' => 'system']
        ];

        // check the unit status
        if ($unit->currentLease) {
            if ($unit->currentLease->tenant->id === null) {
                throw new RepositoryException('Rented unit has no active tenant.');
            }
            $data['user_id'] = $unit->currentLease->tenant->id;
        } else {
            if ($unit->currentOwner) {
                $data['user_id'] = $unit->currentOwner->owner->id;
            } else {
                $data['user_id'] = null; 
                $generable = false; // Skip invoice generation for vacant units
            }
        }

        if ($generable) {
            return $data;
        } 

        return null;
    }


    /*
    |--------------------------------------------------------------------------------------------
    |
    | --- Automatic marking of Overdue Invoices ---
    |
    |---------------------------------------------------------------------------------------------
    */

    /**
     * Get invoices that are overdue.
     * 
     * @return Collection
     * @throws RepositoryException
     */
    public function getOverdueInvoices(): Collection
    {
        try {
            return Invoice::where('due_date', '<', now())
                ->whereIn('status', [Controller::_INVOICE_STATUSES[0], Controller::_INVOICE_STATUSES[1], Controller::_INVOICE_STATUSES[3]]) // issued or partial or overdue
                ->get();
        } catch (\Throwable $e) {
            throw new RepositoryException('Failed to retrieve overdue invoices: ' . $e->getMessage());
        }
    }

    /**
     * Set overdue for a specific invoice.
     * 
     * @param Invoice $invoice
     * @return Invoice
     * @throws RepositoryException
     */
    public function markInvoiceAsOverdue(Invoice $invoice): Invoice
    {
        if ($invoice->status === Controller::_INVOICE_STATUSES[2]) { // paid
            throw new RepositoryException('Cannot mark a paid invoice as overdue.');
        }

        if ($invoice->due_date >= now()) {
            throw new RepositoryException('Invoice is not yet overdue.');
        }

        // set penalty if applicable
        if ($invoice->is_penalizable) {
            $invoice->applyPenalty();
        } else {
            $invoice->update([
                'status' => Controller::_INVOICE_STATUSES[3], // overdue
            ]);
        }

        return $invoice;
    }

}