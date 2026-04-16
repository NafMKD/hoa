<?php 

use App\Http\Controllers\Api\V1\Telegram\TelegramWebhookController;
use App\Http\Controllers\ImportController;
use Illuminate\Support\Facades\Route;

Route::post('telegram/webhook', TelegramWebhookController::class)->name('api.v1.telegram.webhook');

Route::prefix('auth')->name('api.v1.auth.')->group(function () { 
    require __DIR__.'/auth.php';
});
Route::prefix('users')->middleware('auth:sanctum')->name('api.v1.users.')->group(function () { 
    require __DIR__.'/user.php';
});
Route::prefix('buildings')->middleware('auth:sanctum')->name('api.v1.buildings.')->group(function () { 
    require __DIR__.'/building.php';
});
Route::prefix('units')->middleware('auth:sanctum')->name('api.v1.units.')->group(function () { 
    require __DIR__.'/unit.php';
});
Route::prefix('document-templates')->middleware('auth:sanctum')->name('api.v1.document_templates.')->group(function () { 
    require __DIR__.'/document_template.php';
});
Route::prefix('fees')->middleware('auth:sanctum')->name('api.v1.fees.')->group(function () { 
    require __DIR__.'/fee.php';
});
Route::prefix('invoices')->middleware('auth:sanctum')->name('api.v1.invoices.')->group(function () { 
    require __DIR__.'/invoice.php';
});
Route::prefix('payments')->middleware('auth:sanctum')->name('api.v1.payments.')->group(function () { 
    require __DIR__.'/payment.php';
});
Route::prefix('vehicles')->middleware('auth:sanctum')->name('api.v1.vehicles.')->group(function () { 
    require __DIR__.'/vehicle.php';
});
Route::prefix('import')->middleware('auth:sanctum')->name('api.v1.import.')->group(function () { 
    Route::post('/users', [ImportController::class, 'importUsers'])->name('users');
    Route::post('/buildings', [ImportController::class, 'importBuildings'])->name('buildings');
    Route::post('/units', [ImportController::class, 'importUnits'])->name('units');;
});
Route::prefix('reconciliation')->middleware('auth:sanctum')->name('api.v1.reconciliation.')->group(function () { 
    require __DIR__.'/reconciliation.php';
});
Route::prefix('expense-categories')->middleware('auth:sanctum')->name('api.v1.expense_categories.')->group(function () { 
    require __DIR__.'/expense_category.php';
});
Route::prefix('vendors')->middleware('auth:sanctum')->name('api.v1.vendors.')->group(function () { 
    require __DIR__.'/vendor.php';
});
Route::prefix('expenses')->middleware('auth:sanctum')->name('api.v1.expenses.')->group(function () { 
    require __DIR__.'/expense.php';
});
Route::prefix('employees')->middleware('auth:sanctum')->name('api.v1.employees.')->group(function () { 
    require __DIR__.'/employee.php';
});
Route::prefix('payrolls')->middleware('auth:sanctum')->name('api.v1.payrolls.')->group(function () { 
    require __DIR__.'/payroll.php';
});
Route::prefix('agencies')->middleware('auth:sanctum')->name('api.v1.agencies.')->group(function () { 
    require __DIR__.'/agency.php';
});
Route::prefix('agency-monthly-payments')->middleware('auth:sanctum')->name('api.v1.agency_monthly_payments.')->group(function () {
    require __DIR__.'/agency_monthly_payment.php';
});
Route::prefix('payroll-tax-brackets')->middleware('auth:sanctum')->name('api.v1.payroll_tax_brackets.')->group(function () {
    require __DIR__.'/payroll_tax_bracket.php';
});
Route::prefix('payroll-settings')->middleware('auth:sanctum')->name('api.v1.payroll_settings.')->group(function () {
    require __DIR__.'/payroll_settings.php';
});
Route::prefix('financial-reports')->middleware('auth:sanctum')->name('api.v1.financial_reports.')->group(function () {
    require __DIR__.'/financial_report.php';
});