<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Fee;
use App\Models\Invoice;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class InvoiceRepository 
{
    /**
     * Get all invoices with optional pagination.
     * 
     * @param  int|null  $perPage
     * @return Collection|LengthAwarePaginator
     */
    public function all(?int $perPage = null): Collection|LengthAwarePaginator
    {
        if ($perPage) {
            return Invoice::paginate($perPage);
        }

        return Invoice::all();
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
     * Set an invoice as paid|partial.
     * 
     * @param  Invoice  $invoice
     * @param  float  $amountPaid
     * @return Invoice
     * @throws RepositoryException
     */
    public function setAsPaid(Invoice $invoice, float $amountPaid): Invoice
    {
        if ($amountPaid <= 0) {
            throw new RepositoryException('Payment amount must be greater than zero.');
        }
        return DB::transaction(function () use ($invoice, $amountPaid) {
            
            $newAmountPaid = $invoice->amount_paid + $amountPaid;

            if ($newAmountPaid > $invoice->total_amount + $invoice->penalty_amount) {
                throw new RepositoryException('Payment exceeds total amount due.');
            }

            // check if the invoice is already paid
            if ($invoice->status === Controller::_INVOICE_STATUSES[2]) { // paid
                throw new RepositoryException('Invoice is already fully paid.');
            }

            // check if the invoice is overdue
            if ($invoice->isOverdue()) { 
                // check if penalizable
                if ($invoice->isPenalizable()) {
                    $this->markInvoiceAsOverdue($invoice);
                    if ($newAmountPaid >= $invoice->total_amount + $invoice->penalty_amount) {
                        $invoice->status = Controller::_INVOICE_STATUSES[2]; // paid
                    } 
                } else {
                    if ($newAmountPaid >= $invoice->total_amount) {
                        $invoice->status = Controller::_INVOICE_STATUSES[2]; // paid
                    } 
                }
                
            } else {
                if ($newAmountPaid >= $invoice->total_amount) {
                    $invoice->status = Controller::_INVOICE_STATUSES[2]; // paid
                } else {
                    $invoice->status = Controller::_INVOICE_STATUSES[1]; // partial
                }
            }

            $invoice->amount_paid = $newAmountPaid;
            $invoice->save();

            // TODO: Register payment in payment table

            return $invoice;
        });
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
                ->whereIn('status', [Controller::_INVOICE_STATUSES[0], Controller::_INVOICE_STATUSES[1]]) // issued or partial
                ->get();
        } catch (\Throwable $e) {
            throw new RepositoryException('Failed to retrieve overdue invoices: ' . $e->getMessage());
        }
    }

    /**
     * Set overdue invoices' status to 'overdue'.
     * 
     * @return int Number of invoices updated
     */
    public function markOverdueInvoices(): int
    {
        return DB::transaction(function () {
            $overdueInvoices = $this->getOverdueInvoices();
            $count = 0;

            foreach ($overdueInvoices as $invoice) {
                $this->markInvoiceAsOverdue($invoice);
                $count++;
            }

            return $count;
        });
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

        return DB::transaction(function () use ($invoice) {
            $invoice->status = Controller::_INVOICE_STATUSES[3]; // overdue
            // set penalty if applicable
            if ($invoice->isPenalizable()) {
                $invoice->penalty_amount = Controller::_FEE_FIXED_PENALTY;
            }
            $invoice->save();
            return $invoice;
        });
    }

    /**
     * Calculate total outstanding amount across all invoices for a user.
     * 
     * @param User $user
     * @return float
     * @throws RepositoryException
     */
    public function getTotalOutstandingForUser(User $user): float
    {
        try {
            return Invoice::where('user_id', $user->id)
                ->whereIn('status', [Controller::_INVOICE_STATUSES[0], Controller::_INVOICE_STATUSES[1]]) // issued or partial
                ->sum(DB::raw('total_amount - amount_paid'));
        } catch (\Throwable $e) {
            throw new RepositoryException('Failed to calculate total outstanding: ' . $e->getMessage());
        }
    }
}