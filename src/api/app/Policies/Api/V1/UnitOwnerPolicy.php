<?php

namespace App\Policies\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\UnitOwner;
use App\Models\User;

class UnitOwnerPolicy
{
    /**
     * Only admin can view all ownership.
     */
    public function viewAny(User $authUser): bool
    {
        $roles  = array_slice(Controller::_ROLES, 0, 3);
        return $authUser->hasRole($roles);
    }

    /**
     * Creator can view their own ownership.
     */
    public function viewOwnLeases(User $authUser, UnitOwner $lease): bool
    {
        return $lease->created_by === $authUser->id;
    }

    /**
     * Admin and the creator can view a specific ownership.
     */
    public function view(User $authUser, UnitOwner $lease): bool
    {
        $roles  = array_slice(Controller::_ROLES, 0, 3);
        return $authUser->hasRole($roles);
    }

    /**
     * Only admin can create ownership.
     */
    public function create(User $authUser): bool
    {
        $roles  = array_slice(Controller::_ROLES, 0, 3);
        return $authUser->hasRole($roles);
    }

    /**
     * Admin and the creator can update a lease.
     */
    public function update(User $authUser, UnitOwner $lease): bool
    {
        $roles  = array_slice(Controller::_ROLES, 0, 3);
        return $authUser->hasRole($roles);
    }

    /**
     * Only admin can delete ownership.
     */
    public function delete(User $authUser, UnitOwner $lease): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin can approve or finalize ownership (custom action example).
     */
    public function finalize(User $authUser, UnitOwner $lease): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin and creator can deactivate ownership (custom action example).
     */
    public function deactivate(User $authUser, UnitOwner $lease): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $lease->created_by === $authUser->id;
    }
}
