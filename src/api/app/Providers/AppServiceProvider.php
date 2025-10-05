<?php

namespace App\Providers;

use App\Models\Building;
use App\Models\DocumentTemplate;
use App\Models\TenantLease;
use App\Models\Unit;
use App\Models\User;
use App\Policies\Api\V1\BuildingPolicy;
use App\Policies\Api\V1\DocumentTemplatePolicy;
use App\Policies\Api\V1\TenantLeasePolicy;
use App\Policies\Api\V1\UnitPolicy;
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
        Gate::policy(Unit::class, UnitPolicy::class);
        Gate::policy(DocumentTemplate::class, DocumentTemplatePolicy::class);
        Gate::policy(TenantLease::class, TenantLeasePolicy::class);
    }
}
