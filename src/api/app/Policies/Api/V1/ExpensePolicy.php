<?php

namespace App\Policies\Api\V1;

use App\Models\Expense;
use App\Models\User;

class ExpensePolicy
{
    private const STAFF_ROLES = ['admin', 'accountant', 'secretary'];

    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(self::STAFF_ROLES);
    }

    public function view(User $authUser, Expense $expense): bool
    {
        return $authUser->hasRole(self::STAFF_ROLES);
    }

    public function create(User $authUser): bool
    {
        return $authUser->hasRole(self::STAFF_ROLES);
    }

    public function update(User $authUser, Expense $expense): bool
    {
        if ($authUser->hasRole('admin') || $authUser->hasRole('accountant')) {
            return true;
        }

        if ($authUser->hasRole('secretary')) {
            return $expense->created_by === $authUser->id;
        }

        return false;
    }

    public function delete(User $authUser, Expense $expense): bool
    {
        return $authUser->hasRole('admin');
    }
}
