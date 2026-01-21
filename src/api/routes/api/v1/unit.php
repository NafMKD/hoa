<?php

use App\Http\Controllers\Api\V1\UnitController;
use Illuminate\Support\Facades\Route;


Route::get('/', [UnitController::class,  'index'])->name('index');
Route::post('/', [UnitController::class,  'store'])->name('store');
Route::get('/search', [UnitController::class,  'search'])->name('search');
Route::get('/{unit}', [UnitController::class,  'show'])->name('show');
Route::put('/{unit}', [UnitController::class,  'update'])->name('update');
Route::delete('/{unit}', [UnitController::class,  'destroy'])->name('destroy');

// unit status
Route::post('/{unit}/status', [UnitController::class,  'changeUnitStatus'])->name('status');

// Unit lease
Route::post('/{unit}/leases', [UnitController::class,  'storeUnitLease'])->name('leases.store');
Route::get('/{unit}/leases/{lease}', [UnitController::class,  'showUnitLease'])->name('leases.show');
Route::delete('/{unit}/leases/{lease}', [UnitController::class,  'destroyUnitLease'])->name('leases.store');
Route::post('/{unit}/leases/{lease}/activate', [UnitController::class,  'activateUnitLease'])->name('leases.activate');
Route::post('/{unit}/leases/{lease}/terminate', [UnitController::class,  'terminateUnitLease'])->name('leases.terminate');

// unit owner
Route::post('/{unit}/owners', [UnitController::class,  'storeUnitOwner'])->name('owners.store');
Route::delete('/{unit}/owners/{owner}', [UnitController::class,  'destroyUnitOwner'])->name('owners.destroy');
Route::post('/{unit}/owners/{owner}/deactivate', [UnitController::class,  'deactivateUnitOwner'])->name('owners.activate');