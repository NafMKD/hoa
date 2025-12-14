<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Models\Fee;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class FeeRepository
{
    /**
     * Get all fees with optional pagination.
     * 
     * @param int|null $perPage
     * @param array $filters
     * @return Collection|LengthAwarePaginator
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = Fee::query();

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('amount', 'like', "%{$search}%");
            });
        }

        $query->orderBy('created_at', 'desc');

        return $perPage ? $query->paginate($perPage) : $query->get();;
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
                $data['next_recurring_date'] = now()->addMonths((int) $data['recurring_period_months']);
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
                    $data['next_recurring_date'] = now()->addMonths((int) $data['recurring_period_months']);
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
     * @return Collection
     * @throws RepositoryException
     */
    public function processRecurringFees(): Collection
    {
        try {
            $now = now();
            $dueFees = Fee::where('is_recurring', true)
                ->whereNotNull('next_recurring_date')
                ->where('next_recurring_date', '<=', $now)
                ->get();

            return $dueFees;
        } catch (\Throwable $e) {
            throw new RepositoryException('Failed to process recurring fees: ' . $e->getMessage());
        }
    }
}
