<?php

namespace App\Policies\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Unit;

class UnitPolicy
{
    /**
     * Only admin can view any units.
     */
    public function viewAny(User $authUser): bool
    {
        $roles  = array_slice(Controller::_ROLES, 0, 3);
        return $authUser->hasRole($roles);
    }

    /**
     * Only admin can view a unit.
     */
    public function view(User $authUser): bool
    {
        $roles  = array_slice(Controller::_ROLES, 0, 3);
        return $authUser->hasRole($roles);
    }

    /**
     * Only admin can create units.
     */
    public function create(User $authUser): bool
    {
        $roles  = array_slice(Controller::_ROLES, 0, 3);
        return $authUser->hasRole($roles);
    }

    /**
     * Only admin can update units.
     */
    public function update(User $authUser): bool
    {
        $roles  = array_slice(Controller::_ROLES, 0, 3);
        return $authUser->hasRole($roles);
    }

    /**
     * Only admin can delete units.
     */
    public function delete(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }
}
