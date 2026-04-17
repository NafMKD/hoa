<?php

namespace App\Providers;

use App\Models\BankStatementBatch;
use App\Models\BankTransaction;
use App\Models\Building;
use App\Models\DocumentTemplate;
use App\Models\Agency;
use App\Models\AgencyMonthlyPayment;
use App\Models\AgencyPlacement;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Fee;
use App\Models\Poll;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Payroll;
use App\Models\PayrollSetting;
use App\Models\PayrollTaxBracket;
use App\Models\StickerIssue;
use App\Models\UnitLease;
use App\Models\Unit;
use App\Models\UnitOwner;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Vehicle;
use App\Observers\AuditLogObserver;
use App\Models\ReconciliationEscalation;
use App\Policies\Api\V1\BankStatementBatchPolicy;
use App\Policies\Api\V1\BuildingPolicy;
use App\Policies\Api\V1\DocumentTemplatePolicy;
use App\Policies\Api\V1\AgencyMonthlyPaymentPolicy;
use App\Policies\Api\V1\AgencyPlacementPolicy;
use App\Policies\Api\V1\AgencyPolicy;
use App\Policies\Api\V1\EmployeePolicy;
use App\Policies\Api\V1\ExpenseCategoryPolicy;
use App\Policies\Api\V1\ExpensePolicy;
use App\Policies\Api\V1\FeePolicy;
use App\Policies\Api\V1\PayrollPolicy;
use App\Policies\Api\V1\PayrollSettingPolicy;
use App\Policies\Api\V1\PayrollTaxBracketPolicy;
use App\Policies\Api\V1\InvoicePolicy;
use App\Policies\Api\V1\ReconciliationEscalationPolicy;
use App\Policies\Api\V1\PaymentPolicy;
use App\Policies\Api\V1\PollPolicy;
use App\Policies\Api\V1\StickerIssuePolicy;
use App\Policies\Api\V1\UnitLeasePolicy;
use App\Policies\Api\V1\UnitPolicy;
use App\Policies\Api\V1\UserPolicy;
use App\Policies\Api\V1\UnitOwnerPolicy;
use App\Policies\Api\V1\VendorPolicy;
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
        Gate::policy(BankStatementBatch::class, BankStatementBatchPolicy::class);
        Gate::policy(ReconciliationEscalation::class, ReconciliationEscalationPolicy::class);
        Gate::policy(Building::class, BuildingPolicy::class);
        Gate::policy(Unit::class, UnitPolicy::class);
        Gate::policy(DocumentTemplate::class, DocumentTemplatePolicy::class);
        Gate::policy(UnitLease::class, UnitLeasePolicy::class);
        Gate::policy(StickerIssue::class, StickerIssuePolicy::class);
        Gate::policy(Fee::class, FeePolicy::class);
        Gate::policy(ExpenseCategory::class, ExpenseCategoryPolicy::class);
        Gate::policy(Vendor::class, VendorPolicy::class);
        Gate::policy(Expense::class, ExpensePolicy::class);
        Gate::policy(Employee::class, EmployeePolicy::class);
        Gate::policy(Payroll::class, PayrollPolicy::class);
        Gate::policy(PayrollTaxBracket::class, PayrollTaxBracketPolicy::class);
        Gate::policy(PayrollSetting::class, PayrollSettingPolicy::class);
        Gate::policy(Agency::class, AgencyPolicy::class);
        Gate::policy(AgencyPlacement::class, AgencyPlacementPolicy::class);
        Gate::policy(AgencyMonthlyPayment::class, AgencyMonthlyPaymentPolicy::class);
        Gate::policy(Invoice::class, InvoicePolicy::class);
        Gate::policy(UnitOwner::class, UnitOwnerPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
        Gate::policy(Vehicle::class, VehiclePolicy::class);
        Gate::policy(Poll::class, PollPolicy::class);

        Gate::define('viewFinancialReports', function (User $user): bool {
            return $user->hasRole(['admin', 'accountant', 'secretary', 'representative']);
        });

        // Observers
        User::observe(AuditLogObserver::class);
        Building::observe(AuditLogObserver::class);
        Unit::observe(AuditLogObserver::class);
        DocumentTemplate::observe(AuditLogObserver::class);
        UnitLease::observe(AuditLogObserver::class);
        StickerIssue::observe(AuditLogObserver::class);
        Fee::observe(AuditLogObserver::class);
        Invoice::observe(AuditLogObserver::class);
        UnitOwner::observe(AuditLogObserver::class);
        Payment::observe(AuditLogObserver::class);
        BankStatementBatch::observe(AuditLogObserver::class);
        BankTransaction::observe(AuditLogObserver::class);
        ReconciliationEscalation::observe(AuditLogObserver::class);
        ExpenseCategory::observe(AuditLogObserver::class);
        Vendor::observe(AuditLogObserver::class);
        Expense::observe(AuditLogObserver::class);
        Employee::observe(AuditLogObserver::class);
        Payroll::observe(AuditLogObserver::class);
        Agency::observe(AuditLogObserver::class);
        AgencyPlacement::observe(AuditLogObserver::class);
        AgencyMonthlyPayment::observe(AuditLogObserver::class);
        Poll::observe(AuditLogObserver::class);
    }
}
