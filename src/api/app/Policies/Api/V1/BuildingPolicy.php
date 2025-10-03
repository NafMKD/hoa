<?php

namespace App\Policies\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Building;

class BuildingPolicy
{
    /**
     * Determine whether the authenticated user can view any buildings.
     */
    public function viewAny(User $authUser): bool
    {
        // Only admin can view all buildings
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Determine whether the authenticated user can view the building.
     */
    public function view(User $authUser): bool
    {
        // Admin can view any building
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Determine whether the authenticated user can create buildings.
     */
    public function create(User $authUser): bool
    {
        // Only admin can create new buildings
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Determine whether the authenticated user can update the building.
     */
    public function update(User $authUser): bool
    {
        // Only admin can update building details
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Determine whether the authenticated user can delete the building.
     */
    public function delete(User $authUser): bool
    {
        // Only admin can delete
        return $authUser->hasRole(Controller::_ROLES[0]);
    }
}
