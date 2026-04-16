<?php

namespace App\Policies\Api\V1;

use App\Models\Employee;
use App\Models\User;

class EmployeePolicy
{
    private const STAFF = ['admin', 'accountant', 'secretary'];

    private const PAYROLL_EDITORS = ['admin', 'accountant'];

    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(self::STAFF);
    }

    public function view(User $authUser, Employee $employee): bool
    {
        return $authUser->hasRole(self::STAFF);
    }

    public function create(User $authUser): bool
    {
        return $authUser->hasRole(self::PAYROLL_EDITORS);
    }

    public function update(User $authUser, Employee $employee): bool
    {
        return $authUser->hasRole(self::PAYROLL_EDITORS);
    }

    public function delete(User $authUser, Employee $employee): bool
    {
        return $authUser->hasRole(self::PAYROLL_EDITORS);
    }
}
