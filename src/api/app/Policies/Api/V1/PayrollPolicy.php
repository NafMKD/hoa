<?php

namespace App\Policies\Api\V1;

use App\Models\Payroll;
use App\Models\User;

class PayrollPolicy
{
    private const STAFF = ['admin', 'accountant', 'secretary'];

    private const PAYROLL_EDITORS = ['admin', 'accountant'];

    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(self::STAFF);
    }

    public function view(User $authUser, Payroll $payroll): bool
    {
        return $authUser->hasRole(self::STAFF);
    }

    public function create(User $authUser): bool
    {
        return $authUser->hasRole(self::PAYROLL_EDITORS);
    }

    public function generate(User $authUser): bool
    {
        return $authUser->hasRole(self::PAYROLL_EDITORS);
    }

    public function update(User $authUser, Payroll $payroll): bool
    {
        if (! $authUser->hasRole(self::PAYROLL_EDITORS)) {
            return false;
        }

        return in_array($payroll->status, ['draft', 'pending'], true);
    }

    public function delete(User $authUser, Payroll $payroll): bool
    {
        return $authUser->hasRole(self::PAYROLL_EDITORS) && $payroll->status === 'draft';
    }

    public function submitForReview(User $authUser, Payroll $payroll): bool
    {
        return $authUser->hasRole(self::PAYROLL_EDITORS) && $payroll->status === 'draft';
    }

    public function approve(User $authUser, Payroll $payroll): bool
    {
        return $authUser->hasRole('admin');
    }

    public function markPaid(User $authUser, Payroll $payroll): bool
    {
        return $authUser->hasRole(self::PAYROLL_EDITORS) && $payroll->status === 'approved';
    }
}
