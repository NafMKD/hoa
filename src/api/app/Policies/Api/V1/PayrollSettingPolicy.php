<?php

namespace App\Policies\Api\V1;

use App\Models\PayrollSetting;
use App\Models\User;

class PayrollSettingPolicy
{
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasRole('admin');
    }

    public function view(User $authUser, PayrollSetting $setting): bool
    {
        return $authUser->hasRole('admin');
    }

    public function create(User $authUser): bool
    {
        return $authUser->hasRole('admin');
    }

    public function update(User $authUser, PayrollSetting $setting): bool
    {
        return $authUser->hasRole('admin');
    }
}
