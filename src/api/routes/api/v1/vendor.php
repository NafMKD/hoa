<?php

use App\Http\Controllers\Api\V1\VendorController;
use Illuminate\Support\Facades\Route;

Route::get('/', [VendorController::class, 'index'])->name('index');
Route::get('/all', [VendorController::class, 'getAll'])->name('getAll');
Route::post('/', [VendorController::class, 'store'])->name('store');
Route::get('/{vendor}', [VendorController::class, 'show'])->name('show');
Route::put('/{vendor}', [VendorController::class, 'update'])->name('update');
Route::delete('/{vendor}', [VendorController::class, 'destroy'])->name('destroy');
