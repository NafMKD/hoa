<?php

use App\Http\Controllers\Api\V1\TenantLeaseController;
use Illuminate\Support\Facades\Route;


Route::get('/', [TenantLeaseController::class,  'index'])->name('index');
Route::post('/', [TenantLeaseController::class,  'store'])->name('store');
Route::get('/{lease}', [TenantLeaseController::class,  'show'])->name('show');
// Route::put('/{lease}', [TenantLeaseController::class,  'update'])->name('update'); // Update not supported
Route::delete('/{lease}', [TenantLeaseController::class,  'destroy'])->name('destroy');
Route::post('/{lease}/terminate', [TenantLeaseController::class,  'terminate'])->name('terminate');