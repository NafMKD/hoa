<?php

use App\Http\Controllers\Api\V1\EmployeeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [EmployeeController::class, 'index'])->name('index');
Route::get('/all', [EmployeeController::class, 'getAll'])->name('getAll');
Route::post('/', [EmployeeController::class, 'store'])->name('store');
Route::get('/{employee}', [EmployeeController::class, 'show'])->name('show');
Route::put('/{employee}', [EmployeeController::class, 'update'])->name('update');
Route::delete('/{employee}', [EmployeeController::class, 'destroy'])->name('destroy');
