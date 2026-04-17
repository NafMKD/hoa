<?php

namespace App\Policies\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StickerIssue;
use App\Models\User;

class StickerIssuePolicy
{
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    public function view(User $authUser, StickerIssue $stickerIssue): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    public function create(User $authUser): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    public function revoke(User $authUser, StickerIssue $stickerIssue): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    public function markLost(User $authUser, StickerIssue $stickerIssue): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }

    public function markReturned(User $authUser, StickerIssue $stickerIssue): bool
    {
        return $authUser->hasRole(Controller::_ROLES[0]);
    }
}
