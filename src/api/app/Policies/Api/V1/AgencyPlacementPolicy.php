<?php

namespace App\Policies\Api\V1;

use App\Models\AgencyPlacement;
use App\Models\User;

class AgencyPlacementPolicy
{
    private const STAFF = ['admin', 'accountant', 'secretary'];

    private const PAYROLL_EDITORS = ['admin', 'accountant'];

    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(self::STAFF);
    }

    public function view(User $authUser, AgencyPlacement $placement): bool
    {
        return $authUser->hasRole(self::STAFF);
    }

    public function create(User $authUser): bool
    {
        return $authUser->hasRole(self::PAYROLL_EDITORS);
    }

    public function update(User $authUser, AgencyPlacement $placement): bool
    {
        return $authUser->hasRole(self::PAYROLL_EDITORS);
    }

    public function delete(User $authUser, AgencyPlacement $placement): bool
    {
        return $authUser->hasRole(self::PAYROLL_EDITORS);
    }
}
