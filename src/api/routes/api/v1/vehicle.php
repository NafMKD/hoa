<?php

use App\Http\Controllers\Api\V1\VehicleController;
use Illuminate\Support\Facades\Route;

Route::get('/', [VehicleController::class,  'index'])->name('index');
Route::post('/', [VehicleController::class,  'store'])->name('store');

Route::get('/{fee}', [VehicleController::class,  'show'])->name('show');
Route::put('/{fee}', [VehicleController::class,  'update'])->name('update');
Route::delete('/{fee}', [VehicleController::class,  'destroy'])->name('destroy');