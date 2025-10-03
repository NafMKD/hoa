<?php

use App\Http\Controllers\Api\V1\UnitController;
use Illuminate\Support\Facades\Route;


Route::get('/', [UnitController::class,  'index'])->name('index');
Route::post('/', [UnitController::class,  'store'])->name('store');
Route::get('/{unit}', [UnitController::class,  'show'])->name('show');
Route::put('/{unit}', [UnitController::class,  'update'])->name('update');
Route::delete('/{unit}', [UnitController::class,  'destroy'])->name('destroy');