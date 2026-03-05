<?php

namespace App\Policies\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BankStatementBatch;
use App\Models\User;

class BankStatementBatchPolicy
{
    /**
     * Admin and accountant can view batches.
     */
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $authUser->hasRole(Controller::_ROLES[1]);
    }

    /**
     * Admin and accountant can view a batch.
     */
    public function view(User $authUser, BankStatementBatch $batch): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $authUser->hasRole(Controller::_ROLES[1]);
    }

    /**
     * Admin and accountant can upload bank statements.
     */
    public function create(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $authUser->hasRole(Controller::_ROLES[1]);
    }
}
