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
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Determine whether the authenticated user can view users by role.
     */
    public function viewByRole(User $authUser, string $role ): bool
    {
        // Accountant can view only 'homeowner' and 'tenant' roles
        if ($authUser->hasRole(Controller::_ROLES[1]) || $authUser->hasRole(Controller::_ROLES[2])) {
            return in_array($role, Controller::_ROLES.slice(-3), true);
        }
        
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Determine whether the authenticated user can view the model.
     */
    public function view(User $authUser, User $user): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $authUser->id === $user->id;
    }

    /**
     * Determine whether the authenticated user can create models.
     */
    public function create(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Determine whether the authenticated user can update the model.
     */
    public function update(User $authUser, User $user): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $authUser->id === $user->id;
    }

    /**
     * Determine whether the authenticated user can delete the model.
     */
    public function delete(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }
}