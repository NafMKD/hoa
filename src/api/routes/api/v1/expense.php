<?php

use App\Http\Controllers\Api\V1\ExpenseController;
use Illuminate\Support\Facades\Route;

Route::get('/', [ExpenseController::class, 'index'])->name('index');
Route::post('/', [ExpenseController::class, 'store'])->name('store');
Route::get('/{expense}', [ExpenseController::class, 'show'])->name('show');
Route::put('/{expense}', [ExpenseController::class, 'update'])->name('update');
Route::delete('/{expense}', [ExpenseController::class, 'destroy'])->name('destroy');
