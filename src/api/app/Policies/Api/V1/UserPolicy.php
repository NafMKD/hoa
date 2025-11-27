<?php

namespace App\Policies\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the authenticated user can view any users.
     */
    public function viewAny(User $authUser): bool
    {
        $roles  = array_slice(Controller::_ROLES, 0, 3);
        return $authUser->hasRole($roles);
    }

    /**
     * Determine whether the authenticated user can view the model.
     */
    public function view(User $authUser, User $user): bool
    {
        $roles  = array_slice(Controller::_ROLES, 0, 3);
        return $authUser->hasRole($roles);
    }

    /**
     * Determine whether the authenticated user can create models.
     */
    public function create(User $authUser): bool
    {
        $roles  = array_slice(Controller::_ROLES, 0, 3);
        return $authUser->hasRole($roles);
    }

    /**
     * Determine whether the authenticated user can update the model.
     */
    public function update(User $authUser, User $user): bool
    {
        $roles  = array_slice(Controller::_ROLES, 0, 3);
        return $authUser->hasRole($roles);
    }

    /**
     * Determine whether the authenticated user can delete the model.
     */
    public function delete(User $authUser): bool
    {
        // Only admin can delete
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Determine whether the authenticated user can change the status of the model.
     */
    public function changeStatus(User $authUser): bool
    {
        $roles  = array_slice(Controller::_ROLES, 0, 3);
        return $authUser->hasRole($roles);
    }
}