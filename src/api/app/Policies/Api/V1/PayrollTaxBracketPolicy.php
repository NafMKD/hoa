<?php

namespace App\Policies\Api\V1;

use App\Models\PayrollTaxBracket;
use App\Models\User;

class PayrollTaxBracketPolicy
{
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole('admin');
    }

    public function view(User $authUser, PayrollTaxBracket $bracket): bool
    {
        return $authUser->hasRole('admin');
    }

    public function create(User $authUser): bool
    {
        return $authUser->hasRole('admin');
    }

    public function update(User $authUser, PayrollTaxBracket $bracket): bool
    {
        return $authUser->hasRole('admin');
    }

    public function delete(User $authUser, PayrollTaxBracket $bracket): bool
    {
        return $authUser->hasRole('admin');
    }
}
