<?php

use App\Http\Controllers\Api\V1\AgencyMonthlyPaymentController;
use Illuminate\Support\Facades\Route;

Route::get('/suggestions', [AgencyMonthlyPaymentController::class, 'suggestions'])->name('suggestions');
Route::post('/generate', [AgencyMonthlyPaymentController::class, 'generate'])->name('generate');
Route::get('/', [AgencyMonthlyPaymentController::class, 'index'])->name('index');
Route::post('/', [AgencyMonthlyPaymentController::class, 'store'])->name('store');
Route::post('/{agency_monthly_payment}/submit-review', [AgencyMonthlyPaymentController::class, 'submitReview'])->name('submitReview');
Route::post('/{agency_monthly_payment}/approve', [AgencyMonthlyPaymentController::class, 'approve'])->name('approve');
Route::post('/{agency_monthly_payment}/mark-paid', [AgencyMonthlyPaymentController::class, 'markPaid'])->name('markPaid');
Route::get('/{agency_monthly_payment}', [AgencyMonthlyPaymentController::class, 'show'])->name('show');
Route::put('/{agency_monthly_payment}', [AgencyMonthlyPaymentController::class, 'update'])->name('update');
Route::delete('/{agency_monthly_payment}', [AgencyMonthlyPaymentController::class, 'destroy'])->name('destroy');
