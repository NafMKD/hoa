<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Fee;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Unit;
use App\Models\User;
use Carbon\Carbon;
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
     * Get invoices for a specific user (payer), filtered by status.
     * Only returns invoices where user_id equals the given user (no unit-based inclusion).
     * This ensures that when unit owner/tenant changes, the new user does not see previous occupants' invoices.
     *
     * @param  User  $user
     * @param  array  $filters  ['status' => 'pending'|'paid'|'all', 'per_page' => int, 'page' => int]
     * @return Collection|LengthAwarePaginator
     */
    public function forUser(User $user, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = Invoice::query()
            ->where('user_id', $user->id);

        $status = $filters['status'] ?? 'all';
        if ($status === 'pending') {
            $query->whereIn('status', [
                Controller::_INVOICE_STATUSES[0], // issued
                Controller::_INVOICE_STATUSES[1], // partial
                Controller::_INVOICE_STATUSES[3], // overdue
            ]);
        } elseif ($status === 'paid') {
            $query->where('status', Controller::_INVOICE_STATUSES[2]); // paid
        }

        $query->orderBy('created_at', 'desc');

        $perPage = $filters['per_page'] ?? null;
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

            $fee = Fee::find($data['source_id']);
            $unit = Unit::find($data['unit_id']);

            if (!$fee) throw new RepositoryException('Fee not found');
            if (!$unit) throw new RepositoryException('Unit not found');

            $data['user_id'] = $this->resolveBillableUserId($unit);

            // Generate unique invoice number
            $data['invoice_number'] = $this->generateNextInvoiceNumber();
            $data['amount_paid'] = 0.00;
            $data['status'] = Controller::_INVOICE_STATUSES[0]; // issued
            $data['penalty_amount'] = 0.00;
            $data['metadata'] = $data['metadata'] ?? [];
            $data['source_type'] = \App\Models\Fee::class;

            $data['metadata']['fee_snapshot'] = [
                'id'       => $fee->id,
                'name'     => $fee->name,
                'category' => $fee->category,
                'amount'   => (float) $fee->amount,
            ];

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

    /**
     * Apply a penalty to an invoice (multiple).
     * 
     * @param  Invoice  $invoice
     * @param  array  $penalties
     * @return array
     * @throws RepositoryException
     */
    public function applyPenalties(Invoice $invoice, array $penalties): array
    {
        $appliedPenalties = [];
        $totalPenalty = 0.0;
        DB::transaction(function () use ($invoice, $penalties, $totalPenalty): void {
            foreach ($penalties as $penalty) {
                // check if penalty already exists for this invoice on the same date
                $existingPenalty = $invoice->penalties()->where('applied_date', $penalty['applied_date'])->where('reason', $penalty['reason'])->first();
                if ($existingPenalty) continue;

                $appliedPenalties[] = $penalty;
                $invoice->penalties()->create([
                    'amount' => $penalty['amount'],
                    'reason' => $penalty['reason'],
                    'applied_date' => $penalty['applied_date'],
                ]);

                $totalPenalty += $penalty['amount'];
            }

            // Update the invoice with the total penalty amount
            $invoice->update([
                'penalty_amount' => $invoice->penalty_amount + $totalPenalty,
            ]);

        });

        return [$appliedPenalties, $totalPenalty];
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
                ->orderBy('id', 'desc')
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
        // check invoice is legacy 
        $legacy = $invoice->metadata['legacy'] ?? false;

        if ($payment->amount <= 0) {
            throw new RepositoryException('Payment amount must be greater than zero.');
        }

        // check if the invoice is overdue
        if ($invoice->is_overdue && !$legacy) {
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
    | --- Invoice Generation for Recurring Fees ---
    |
    |---------------------------------------------------------------------------------------------
    */

    /**
     * Quarter definitions: quarter key => [start_month, end_month].
     * Months are 1-indexed (1 = January).
     */
    public const QUARTERS = [
        'sep-nov' => [9, 10, 11],
        'dec-feb' => [12, 1, 2],
        'mar-may' => [3, 4, 5],
        'jun-aug' => [6, 7, 8],
    ];

    /**
     * Resolve the three invoice months for a given quarter and year.
     *
     * @param  string $quarter  One of the QUARTERS keys
     * @param  int    $year     The fiscal year the quarter starts in
     * @return array<string>    e.g. ['September/2026','October/2026','November/2026']
     */
    public function resolveQuarterMonths(string $quarter, int $year): array
    {
        $monthNumbers = self::QUARTERS[$quarter];
        $months = [];

        foreach ($monthNumbers as $i => $m) {
            $y = $year;
            // For dec-feb quarter, Jan and Feb roll into the next calendar year
            if ($quarter === 'dec-feb' && $m <= 2) {
                $y = $year + 1;
            }
            $months[] = Carbon::createFromDate($y, $m, 1)->format('F/Y');
        }

        return $months;
    }

    /**
     * Generate exactly one invoice per unit for the selected fee and quarter.
     * Fully atomic: either ALL units get invoices or NONE do.
     *
     * @param  int    $feeId    The fee to invoice (must be active, recurring, monthly)
     * @param  string $quarter  Quarter key (e.g. 'sep-nov')
     * @param  int    $year     Year the quarter starts in
     * @param  string $dueDate  Due date (Y-m-d)
     * @return array{generated: int}
     * @throws RepositoryException
     */
    public function generateInvoicesForQuarter(int $feeId, string $quarter, int $year, string $dueDate): array
    {
        $fee = Fee::find($feeId);

        if ($fee === null) {
            throw new RepositoryException('Fee not found.');
        }

        if ($fee->category !== Controller::_FEE_CATEGORIES[0]) {
            throw new RepositoryException('Only monthly fees can be used for quarterly invoice generation.');
        }

        if ($fee->status !== Controller::_FEE_STATUSES[0]) {
            throw new RepositoryException('Cannot generate invoices for a terminated fee. Please select an active fee.');
        }

        if (!$fee->is_recurring) {
            throw new RepositoryException('Only recurring fees can be used for quarterly invoice generation.');
        }

        $forMonths = $this->resolveQuarterMonths($quarter, $year);

        $units = Unit::all();

        if ($units->isEmpty()) {
            throw new RepositoryException('No units found in the system.');
        }

        $feeSnapshot = [
            'id'       => $fee->id,
            'name'     => $fee->name,
            'category' => $fee->category,
            'amount'   => (float) $fee->amount,
        ];

        return DB::transaction(function () use ($units, $fee, $feeSnapshot, $forMonths, $dueDate) {
            $generated = 0;

            foreach ($units as $unit) {
                $userId = $this->resolveBillableUserId($unit);

                Invoice::create([
                    'invoice_number' => $this->generateNextInvoiceNumber(),
                    'unit_id'        => $unit->id,
                    'user_id'        => $userId,
                    'issue_date'     => now(),
                    'due_date'       => $dueDate,
                    'total_amount'   => $fee->amount,
                    'amount_paid'    => 0.00,
                    'status'         => Controller::_INVOICE_STATUSES[0],
                    'source_type'    => Fee::class,
                    'source_id'      => $fee->id,
                    'penalty_amount' => 0.00,
                    'metadata'       => [
                        'generated_by'     => 'admin',
                        'legacy'           => false,
                        'fee_snapshot'     => $feeSnapshot,
                        'invoice_snapshot' => [
                            'invoice_months' => $forMonths,
                        ],
                    ],
                ]);

                $generated++;
            }

            return ['generated' => $generated];
        });
    }

    /**
     * Resolve the user ID to link to an invoice for a unit.
     * Tenant takes priority over owner; if neither exists, returns null.
     *
     * @param  Unit $unit
     * @return int|null  null when the unit has no tenant and no owner
     */
    private function resolveBillableUserId(Unit $unit): ?int
    {
        if ($unit->currentLease && $unit->currentLease->tenant) {
            return $unit->currentLease->tenant->id;
        }

        if ($unit->currentOwner && $unit->currentOwner->owner) {
            return $unit->currentOwner->owner->id;
        }

        return null;
    }

    /**
     * @deprecated Use generateInvoicesForQuarter() instead. Kept for seeder/legacy compatibility.
     */
    public function generateInvoiceForFee(Collection $units, Fee $fee): bool
    {
        if ($fee->category !== Controller::_FEE_CATEGORIES[0]) {
            return false;
        }
        if ($fee->status !== Controller::_FEE_STATUSES[0]) {
            return false;
        }

        $startDate = Carbon::parse($fee->next_recurring_date);
        $forMonths = [
            $startDate->format('F/Y'),
            $startDate->copy()->addMonth()->format('F/Y'),
            $startDate->copy()->addMonths(2)->format('F/Y'),
        ];

        return DB::transaction(function () use ($units, $fee, $forMonths) {
            foreach ($units as $unit) {
                $userId = $this->resolveBillableUserId($unit);

                Invoice::create([
                    'invoice_number' => $this->generateNextInvoiceNumber(),
                    'unit_id'        => $unit->id,
                    'user_id'        => $userId,
                    'issue_date'     => now(),
                    'due_date'       => now()->addDays(Controller::_DEFAULT_DUE_DAYS),
                    'total_amount'   => $fee->amount,
                    'amount_paid'    => 0.00,
                    'status'         => Controller::_INVOICE_STATUSES[0],
                    'source_type'    => Fee::class,
                    'source_id'      => $fee->id,
                    'penalty_amount' => 0.00,
                    'metadata'       => [
                        'generated_by'     => 'system',
                        'legacy'           => false,
                        'fee_snapshots'    => [[
                            'id'       => $fee->id,
                            'name'     => $fee->name,
                            'category' => $fee->category,
                            'amount'   => (float) $fee->amount,
                        ]],
                        'invoice_snapshot' => [
                            'invoice_months' => $forMonths,
                        ],
                    ],
                ]);
            }

            return true;
        });
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