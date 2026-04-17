<?php

namespace App\Policies\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Poll;
use App\Models\User;

class PollPolicy
{
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole([Controller::_ROLES[0], Controller::_ROLES[2]]);
    }

    public function view(User $authUser, Poll $poll): bool
    {
        return $authUser->hasRole([Controller::_ROLES[0], Controller::_ROLES[2]]);
    }

    public function create(User $authUser): bool
    {
        return $authUser->hasRole([Controller::_ROLES[0], Controller::_ROLES[2]]);
    }

    public function update(User $authUser, Poll $poll): bool
    {
        return $authUser->hasRole([Controller::_ROLES[0], Controller::_ROLES[2]]);
    }

    public function delete(User $authUser, Poll $poll): bool
    {
        return $authUser->hasRole([Controller::_ROLES[0], Controller::_ROLES[2]]);
    }

    public function open(User $authUser, Poll $poll): bool
    {
        return $authUser->hasRole([Controller::_ROLES[0], Controller::_ROLES[2]]);
    }

    public function close(User $authUser, Poll $poll): bool
    {
        return $authUser->hasRole([Controller::_ROLES[0], Controller::_ROLES[2]]);
    }

    /** Tallies for staff (admin, accountant, secretary). */
    public function viewResults(User $authUser, Poll $poll): bool
    {
        return $authUser->hasRole([Controller::_ROLES[0], Controller::_ROLES[1], Controller::_ROLES[2]]);
    }

    /** Active users may cast one vote per eligible unit they represent. */
    public function vote(User $authUser, Poll $poll): bool
    {
        return $authUser->status === Controller::_USER_STATUSES[0];
    }
}
