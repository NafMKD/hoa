<?php

use App\Http\Controllers\Api\V1\PayrollController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PayrollController::class, 'index'])->name('index');
Route::post('/generate-direct', [PayrollController::class, 'generateDirect'])->name('generateDirect');
Route::post('/', [PayrollController::class, 'store'])->name('store');
Route::post('/{payroll}/submit-review', [PayrollController::class, 'submitReview'])->name('submitReview');
Route::post('/{payroll}/approve', [PayrollController::class, 'approve'])->name('approve');
Route::post('/{payroll}/mark-paid', [PayrollController::class, 'markPaid'])->name('markPaid');
Route::get('/{payroll}', [PayrollController::class, 'show'])->name('show');
Route::put('/{payroll}', [PayrollController::class, 'update'])->name('update');
Route::delete('/{payroll}', [PayrollController::class, 'destroy'])->name('destroy');
