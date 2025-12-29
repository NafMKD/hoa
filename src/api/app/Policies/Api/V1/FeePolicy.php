<?php

namespace App\Policies\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Fee;

class FeePolicy
{
    /**
     * Only admin can view all fees.
     */
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Admin and creator can view a specific fee.
     */
    public function view(User $authUser, Fee $fee): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $fee->created_by === $authUser->id;
    }

    /**
     * Only admin can create fees.
     */
    public function create(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Admin and creator can update a fee.
     */
    public function update(User $authUser, Fee $fee): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $fee->created_by === $authUser->id;
    }

    /**
     * Only admin can delete fees.
     */
    public function delete(User $authUser, Fee $fee): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin can process recurring fees (custom action).
     */
    public function processRecurring(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin can terminate a fee.
     */
    public function terminate(User $authUser, Fee $fee): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }
}
