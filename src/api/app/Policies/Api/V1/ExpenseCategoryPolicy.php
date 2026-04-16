<?php

namespace App\Policies\Api\V1;

use App\Models\ExpenseCategory;
use App\Models\User;

class ExpenseCategoryPolicy
{
    private const STAFF_ROLES = ['admin', 'accountant', 'secretary'];

    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(self::STAFF_ROLES);
    }

    public function view(User $authUser, ExpenseCategory $expenseCategory): bool
    {
        return $authUser->hasRole(self::STAFF_ROLES);
    }

    public function create(User $authUser): bool
    {
        return $authUser->hasRole('admin');
    }

    public function update(User $authUser, ExpenseCategory $expenseCategory): bool
    {
        return $authUser->hasRole('admin');
    }

    public function delete(User $authUser, ExpenseCategory $expenseCategory): bool
    {
        return $authUser->hasRole('admin');
    }
}
