<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseCategory;
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

    /**
     * Creates a paid expense under the system Payroll category (Phase 2 payroll ↔ ledger link).
     *
     * @throws RepositoryException
     */
    public function createPayrollLinkedExpense(
        string $description,
        float $amount,
        string $expenseDateYmd,
        int $createdByUserId
    ): Expense {
        $category = ExpenseCategory::query()
            ->where('code', Controller::_EXPENSE_CATEGORY_CODE_PAYROLL)
            ->first();

        if (! $category) {
            throw new RepositoryException('Payroll expense category is not configured.');
        }

        return $this->create([
            'expense_category_id' => $category->id,
            'vendor_id' => null,
            'description' => $description,
            'amount' => $amount,
            'invoice_number' => null,
            'status' => 'paid',
            'expense_date' => $expenseDateYmd,
            'created_by' => $createdByUserId,
        ]);
    }
}
