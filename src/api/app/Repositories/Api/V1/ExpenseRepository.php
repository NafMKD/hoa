<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Models\Expense;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ExpenseRepository
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = Expense::query()
            ->with(['category', 'vendor', 'creator'])
            ->orderByDesc('expense_date')
            ->orderByDesc('id');

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('invoice_number', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['expense_category_id'])) {
            $query->where('expense_category_id', $filters['expense_category_id']);
        }

        if (! empty($filters['vendor_id'])) {
            $query->where('vendor_id', $filters['vendor_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['created_by'])) {
            $query->where('created_by', $filters['created_by']);
        }

        if (! empty($filters['expense_date_from'])) {
            $query->whereDate('expense_date', '>=', $filters['expense_date_from']);
        }

        if (! empty($filters['expense_date_to'])) {
            $query->whereDate('expense_date', '<=', $filters['expense_date_to']);
        }

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Expense
    {
        DB::beginTransaction();

        try {
            $expense = Expense::create($data);
            DB::commit();

            return $expense->load(['category', 'vendor', 'creator']);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to create expense: '.$e->getMessage());
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Expense $expense, array $data): Expense
    {
        DB::beginTransaction();

        try {
            $expense->update($data);
            DB::commit();

            return $expense->fresh(['category', 'vendor', 'creator']);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to update expense: '.$e->getMessage());
        }
    }

    public function delete(Expense $expense): void
    {
        DB::beginTransaction();

        try {
            $expense->delete();
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to delete expense: '.$e->getMessage());
        }
    }
}
