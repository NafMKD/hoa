<?php

namespace App\Providers;

use App\Models\Building;
use App\Models\User;
use App\Policies\Api\V1\BuildingPolicy;
use App\Policies\Api\V1\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Building::class, BuildingPolicy::class);
    }
}
