<?php

namespace App\Policies\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ReconciliationEscalation;
use App\Models\User;

class ReconciliationEscalationPolicy
{
    /**
     * Admin and accountant can view escalations.
     */
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $authUser->hasRole(Controller::_ROLES[1]);
    }

    /**
     * Admin and accountant can view an escalation.
     */
    public function view(User $authUser, ReconciliationEscalation $escalation): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $authUser->hasRole(Controller::_ROLES[1]);
    }

    /**
     * Admin and accountant can resolve escalations.
     */
    public function update(User $authUser, ReconciliationEscalation $escalation): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $authUser->hasRole(Controller::_ROLES[1]);
    }
}
