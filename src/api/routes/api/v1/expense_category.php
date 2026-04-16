<?php

use App\Http\Controllers\Api\V1\ExpenseCategoryController;
use Illuminate\Support\Facades\Route;

Route::get('/', [ExpenseCategoryController::class, 'index'])->name('index');
Route::get('/all', [ExpenseCategoryController::class, 'getAll'])->name('getAll');
Route::post('/', [ExpenseCategoryController::class, 'store'])->name('store');
Route::get('/{expense_category}', [ExpenseCategoryController::class, 'show'])->name('show');
Route::put('/{expense_category}', [ExpenseCategoryController::class, 'update'])->name('update');
Route::delete('/{expense_category}', [ExpenseCategoryController::class, 'destroy'])->name('destroy');
