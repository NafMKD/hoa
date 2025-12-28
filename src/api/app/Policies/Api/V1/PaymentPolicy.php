<?php

namespace App\Policies\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Payment;

class PaymentPolicy
{
    /**
     * Only admin can view all payments.
     */
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Admin and the creator can view a specific payment.
     */
    public function view(User $authUser, Payment $payment): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $payment->invoice->user_id === $authUser->id;
    }

    /**
     * Only admin can create payments.
     */
    public function create(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Admin and the creator can update a payment.
     */
    public function update(User $authUser, Payment $payment): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin can delete payments.
     */
    public function delete(User $authUser, Payment $payment): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin can reconcile payments.
     */
    public function reconcile(User $authUser, Payment $payment): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin and accountant can mark a payment as failed.
     */
    public function markFailed(User $authUser, Payment $payment): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $authUser->hasRole(Controller::_ROLES[1]);
    }

    /**
     * Only admin can refund a payment.
     */
    public function markRefund(User $authUser, Payment $payment): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    /**
     * Only admin and accountant can confirm a payment.
     */
    public function markConfirm(User $authUser, Payment $payment): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $authUser->hasRole(Controller::_ROLES[1]);
    }

    /**
     * Only admin and accountant can add a receipt number.
     */
    public function addReceiptNumber(User $authUser, Payment $payment): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]) || $authUser->hasRole(Controller::_ROLES[1]);
    }
}
