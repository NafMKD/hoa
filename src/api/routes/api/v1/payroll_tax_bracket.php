<?php

use App\Http\Controllers\Api\V1\PayrollTaxBracketController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PayrollTaxBracketController::class, 'index'])->name('index');
Route::post('/', [PayrollTaxBracketController::class, 'store'])->name('store');
Route::put('/{payroll_tax_bracket}', [PayrollTaxBracketController::class, 'update'])->name('update');
Route::delete('/{payroll_tax_bracket}', [PayrollTaxBracketController::class, 'destroy'])->name('destroy');
