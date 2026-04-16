<?php

namespace App\Policies\Api\V1;

use App\Models\User;
use App\Models\Vendor;

class VendorPolicy
{
    private const STAFF_ROLES = ['admin', 'accountant', 'secretary'];

    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(self::STAFF_ROLES);
    }

    public function view(User $authUser, Vendor $vendor): bool
    {
        return $authUser->hasRole(self::STAFF_ROLES);
    }

    public function create(User $authUser): bool
    {
        return $authUser->hasRole(['admin', 'accountant']);
    }

    public function update(User $authUser, Vendor $vendor): bool
    {
        return $authUser->hasRole(['admin', 'accountant']);
    }

    public function delete(User $authUser, Vendor $vendor): bool
    {
        return $authUser->hasRole('admin');
    }
}
