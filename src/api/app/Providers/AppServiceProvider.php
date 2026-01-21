<?php

namespace App\Providers;

use App\Models\Building;
use App\Models\DocumentTemplate;
use App\Models\Fee;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\UnitLease;
use App\Models\Unit;
use App\Models\UnitOwner;
use App\Models\User;
use App\Models\Vehicle;
use App\Observers\AuditLogObserver;
use App\Policies\Api\V1\BuildingPolicy;
use App\Policies\Api\V1\DocumentTemplatePolicy;
use App\Policies\Api\V1\FeePolicy;
use App\Policies\Api\V1\InvoicePolicy;
use App\Policies\Api\V1\PaymentPolicy;
use App\Policies\Api\V1\UnitLeasePolicy;
use App\Policies\Api\V1\UnitPolicy;
use App\Policies\Api\V1\UserPolicy;
use App\Policies\Api\V1\UnitOwnerPolicy;
use App\Policies\Api\V1\VehiclePolicy;
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
        // Policies
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Building::class, BuildingPolicy::class);
        Gate::policy(Unit::class, UnitPolicy::class);
        Gate::policy(DocumentTemplate::class, DocumentTemplatePolicy::class);
        Gate::policy(UnitLease::class, UnitLeasePolicy::class);
        Gate::policy(Fee::class, FeePolicy::class);
        Gate::policy(Invoice::class, InvoicePolicy::class);
        Gate::policy(UnitOwner::class, UnitOwnerPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
        Gate::policy(Vehicle::class, VehiclePolicy::class);

        // Observers
        User::observe(AuditLogObserver::class);
        Building::observe(AuditLogObserver::class);
        Unit::observe(AuditLogObserver::class);
        DocumentTemplate::observe(AuditLogObserver::class);
        UnitLease::observe(AuditLogObserver::class);
        Fee::observe(AuditLogObserver::class);
        Invoice::observe(AuditLogObserver::class);
        UnitOwner::observe(AuditLogObserver::class);
    }
}
