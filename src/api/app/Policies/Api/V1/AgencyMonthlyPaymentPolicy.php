<?php

namespace App\Policies\Api\V1;

use App\Models\AgencyMonthlyPayment;
use App\Models\User;

class AgencyMonthlyPaymentPolicy
{
    private const STAFF = ['admin', 'accountant', 'secretary'];

    private const PAYROLL_EDITORS = ['admin', 'accountant'];

    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(self::STAFF);
    }

    public function view(User $authUser, AgencyMonthlyPayment $payment): bool
    {
        return $authUser->hasRole(self::STAFF);
    }

    public function viewSuggestions(User $authUser): bool
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

    public function update(User $authUser, AgencyMonthlyPayment $payment): bool
    {
        if (! $authUser->hasRole(self::PAYROLL_EDITORS)) {
            return false;
        }

        return in_array($payment->status, ['draft', 'pending'], true);
    }

    public function delete(User $authUser, AgencyMonthlyPayment $payment): bool
    {
        return $authUser->hasRole(self::PAYROLL_EDITORS) && $payment->status === 'draft';
    }

    public function submitForReview(User $authUser, AgencyMonthlyPayment $payment): bool
    {
        return $authUser->hasRole(self::PAYROLL_EDITORS) && $payment->status === 'draft';
    }

    public function approve(User $authUser, AgencyMonthlyPayment $payment): bool
    {
        return $authUser->hasRole('admin');
    }

    public function markPaid(User $authUser, AgencyMonthlyPayment $payment): bool
    {
        return $authUser->hasRole(self::PAYROLL_EDITORS) && $payment->status === 'approved';
    }
}
