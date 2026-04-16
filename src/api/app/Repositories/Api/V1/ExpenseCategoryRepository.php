<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Models\ExpenseCategory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ExpenseCategoryRepository
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = ExpenseCategory::query()->orderBy('sort_order')->orderBy('name');

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return Collection<int, ExpenseCategory>
     */
    public function getAll(array $filters = []): Collection
    {
        $query = ExpenseCategory::query()->orderBy('sort_order')->orderBy('name');

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null && $filters['is_active'] !== '') {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ExpenseCategory
    {
        $data['is_system'] = false;

        return ExpenseCategory::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ExpenseCategory $expenseCategory, array $data): ExpenseCategory
    {
        if ($expenseCategory->is_system) {
            unset($data['code'], $data['is_system']);
        }

        $expenseCategory->update($data);

        return $expenseCategory->fresh();
    }

    public function delete(ExpenseCategory $expenseCategory): void
    {
        if ($expenseCategory->is_system) {
            throw new RepositoryException('System expense categories cannot be deleted.');
        }

        if ($expenseCategory->expenses()->exists()) {
            throw new RepositoryException('Cannot delete a category that has expenses.');
        }

        DB::beginTransaction();

        try {
            $expenseCategory->delete();
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to delete expense category: '.$e->getMessage());
        }
    }
}
