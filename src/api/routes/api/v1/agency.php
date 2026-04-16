<?php

use App\Http\Controllers\Api\V1\AgencyController;
use App\Http\Controllers\Api\V1\AgencyPlacementController;
use Illuminate\Support\Facades\Route;

Route::get('/', [AgencyController::class, 'index'])->name('index');
Route::get('/all', [AgencyController::class, 'getAll'])->name('getAll');
Route::post('/', [AgencyController::class, 'store'])->name('store');

Route::get('/{agency}/placements', [AgencyPlacementController::class, 'index'])->name('placements.index');
Route::post('/{agency}/placements', [AgencyPlacementController::class, 'store'])->name('placements.store');
Route::get('/{agency}/placements/{placement}', [AgencyPlacementController::class, 'show'])->name('placements.show');
Route::put('/{agency}/placements/{placement}', [AgencyPlacementController::class, 'update'])->name('placements.update');
Route::delete('/{agency}/placements/{placement}', [AgencyPlacementController::class, 'destroy'])->name('placements.destroy');

Route::get('/{agency}', [AgencyController::class, 'show'])->name('show');
Route::put('/{agency}', [AgencyController::class, 'update'])->name('update');
Route::delete('/{agency}', [AgencyController::class, 'destroy'])->name('destroy');
