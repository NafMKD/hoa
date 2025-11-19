<?php

namespace App\Policies\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UnitLease;

class UnitLeasePolicy
{
    /**
     * Only admin can view all leases.
     */
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Creator can view their own leases.
     */
    public function viewOwnLeases(User $authUser, UnitLease $lease): bool
    {
        return $lease->created_by === $authUser->id;
    }

    /**
     * Admin and the creator can view a specific lease.
     */
    public function view(User $authUser, UnitLease $lease): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $lease->created_by === $authUser->id;
    }

    /**
     * Only admin can create leases.
     */
    public function create(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Admin and the creator can update a lease.
     */
    public function update(User $authUser, UnitLease $lease): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $lease->created_by === $authUser->id;
    }

    /**
     * Only admin can delete leases.
     */
    public function delete(User $authUser, UnitLease $lease): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin can approve or finalize leases (custom action example).
     */
    public function finalize(User $authUser, UnitLease $lease): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin and creator can terminate leases (custom action example).
     */
    public function terminate(User $authUser, UnitLease $lease): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $lease->created_by === $authUser->id;
    }
    
    /**
     * Only admin and creator can activate leases (custom action example).
     */
    public function activate(User $authUser, UnitLease $lease): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $lease->created_by === $authUser->id;
    }
}
