<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Models\Fee;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FeeRepository
{
    /**
     * Get all fees with optional pagination.
     * 
     * @param int|null $perPage
     * @return Collection|LengthAwarePaginator
     */
    public function all(?int $perPage = null): Collection|LengthAwarePaginator
    {
        if ($perPage) {
            return Fee::paginate($perPage);
        }

        return Fee::all();
    }

    /**
     * Create a new fee record.
     * 
     * @param array<string, mixed> $data
     * @return Fee
     * @throws RepositoryException
     */
    public function create(array $data): Fee
    {
        DB::beginTransaction();

        try {
            // Automatically calculate next recurring date if recurring
            if (!empty($data['is_recurring']) && !empty($data['recurring_period_months'])) {
                $data['last_recurring_date'] = now();
                $data['next_recurring_date'] = now()->addMonths($data['recurring_period_months']);
            }

            $fee = Fee::create($data);

            DB::commit();
            return $fee;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to create fee: ' . $e->getMessage());
        }
    }

    /**
     * Update an existing fee.
     * 
     * @param Fee $fee
     * @param array<string, mixed> $data
     * @return Fee
     * @throws RepositoryException
     */
    public function update(Fee $fee, array $data): Fee
    {
        DB::beginTransaction();

        try {
            // Recalculate recurring dates if recurrence settings changed
            if (isset($data['is_recurring']) && $data['is_recurring']) {
                if (!empty($data['recurring_period_months'])) {
                    $data['next_recurring_date'] = now()->addMonths($data['recurring_period_months']);
                }
            } 

            $fee->update($data);

            DB::commit();
            return $fee;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to update fee: ' . $e->getMessage());
        }
    }

    /**
     * Soft delete a fee.
     * 
     * @param Fee $fee
     * @return bool|null
     */
    public function delete(Fee $fee): ?bool
    {
        return DB::transaction(function ($fee) {
            // TODO: Handle related data (e.g. invoices) 
            $fee->delete();
        });
    }

    /**
     * Generate recurring fees for the current date.
     * 
     * @return int Number of fees updated
     * @throws RepositoryException
     */
    public function processRecurringFees(): int
    {
        try {
            $now = now();
            $dueFees = Fee::where('is_recurring', true)
                ->whereNotNull('next_recurring_date')
                ->where('next_recurring_date', '<=', $now)
                ->get();

            foreach ($dueFees as $fee) {
                // Update recurring cycle
                $fee->last_recurring_date = $now;
                $fee->next_recurring_date = Carbon::parse($now)->addMonths($fee->recurring_period_months);
                $fee->save();

                // Generate invoices for the recurring fee
                $this->generateInvoiceForFee($fee);
            }

            return $dueFees->count();
        } catch (\Throwable $e) {
            throw new RepositoryException('Failed to process recurring fees: ' . $e->getMessage());
        }
    }

    /**
     * Generate an invoice for a specific fee.
     * 
     * @param Fee $fee
     * @return void
     */
    private function generateInvoiceForFee(Fee $fee): void
    {
        if (method_exists($fee, 'invoices')) {
            $fee->invoices()->create([
                'source_type' => 'fee',
                'source_id'   => $fee->id,
                'amount'      => $fee->amount,
                'status'      => 'unpaid',
                'issued_at'   => now(),
            ]);
        }
    }
}
