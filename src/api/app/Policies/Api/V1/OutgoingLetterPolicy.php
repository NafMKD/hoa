<?php

namespace App\Policies\Api\V1;

use App\Models\OutgoingLetter;
use App\Models\User;

class OutgoingLetterPolicy
{
    private const STAFF_ROLES = ['admin', 'accountant', 'secretary'];

    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(self::STAFF_ROLES);
    }

    public function view(User $authUser, OutgoingLetter $outgoingLetter): bool
    {
        return $authUser->hasRole(self::STAFF_ROLES);
    }

    public function create(User $authUser): bool
    {
        return $authUser->hasRole(self::STAFF_ROLES);
    }

    public function update(User $authUser, OutgoingLetter $outgoingLetter): bool
    {
        return $authUser->hasRole(self::STAFF_ROLES);
    }

    public function delete(User $authUser, OutgoingLetter $outgoingLetter): bool
    {
        return $authUser->hasRole('admin');
    }
}
