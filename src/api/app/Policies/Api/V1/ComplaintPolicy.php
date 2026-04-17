<?php

namespace App\Policies\Api\V1;

use App\Models\Complaint;
use App\Models\User;

class ComplaintPolicy
{
    private const STAFF_ROLES = ['admin', 'accountant', 'secretary'];

    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(self::STAFF_ROLES);
    }

    public function view(User $authUser, Complaint $complaint): bool
    {
        return $authUser->hasRole(self::STAFF_ROLES);
    }

    public function create(User $authUser): bool
    {
        return $authUser->hasRole(self::STAFF_ROLES);
    }

    public function update(User $authUser, Complaint $complaint): bool
    {
        return $authUser->hasRole(self::STAFF_ROLES);
    }

    public function delete(User $authUser, Complaint $complaint): bool
    {
        return $authUser->hasRole('admin');
    }
}
