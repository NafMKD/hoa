<?php

namespace App\Policies\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vehicle;

class VehiclePolicy
{
    /**
     * Only admin can view all vehicles.
     */
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Admin and owner can view a specific vehicle.
     */
    public function view(User $authUser, Vehicle $vehicle): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0])
            || $vehicle->user_id === $authUser->id;
    }

    /**
     * Only admin can create vehicles.
     */
    public function create(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Admin and owner can update a vehicle.
     */
    public function update(User $authUser, Vehicle $vehicle): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0])
            || $vehicle->user_id === $authUser->id;
    }

    /**
     * Only admin can delete vehicles.
     */
    public function delete(User $authUser, Vehicle $vehicle): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }
}
