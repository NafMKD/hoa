<?php

namespace App\Policies\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Invoice;

class InvoicePolicy
{
    /**
     * Only admin can view all invoices.
     */
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Admin and the creator can view a specific invoice.
     */
    public function view(User $authUser, Invoice $invoice): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $invoice->user_id === $authUser->id;
    }

    /**
     * Only admin can create invoices.
     */
    public function create(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Admin and the creator can update an invoice.
     */
    public function update(User $authUser, Invoice $invoice): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin can delete invoices.
     */
    public function delete(User $authUser, Invoice $invoice): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin can finalize or approve invoices (custom action example).
     */
    public function finalize(User $authUser, Invoice $invoice): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Admin and creator can apply payments or adjustments (custom action example).
     */
    public function applyPayment(User $authUser, Invoice $invoice): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $authUser->hasRole(Controller::_ROLES[1]) || $authUser->hasRole(Controller::_ROLES[2]) || $invoice->user_id === $authUser->id;
    }
}
