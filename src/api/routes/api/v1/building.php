<?php

use App\Http\Controllers\Api\V1\BuildingController;
use Illuminate\Support\Facades\Route;


Route::get('/', [BuildingController::class,  'index'])->name('index');
Route::post('/', [BuildingController::class,  'store'])->name('store');
Route::get('/{building}', [BuildingController::class,  'show'])->name('show');
Route::get('/names/all', [BuildingController::class,  'allNames'])->name('all-names');
Route::put('/{building}', [BuildingController::class,  'update'])->name('update');
Route::delete('/{building}', [BuildingController::class,  'destroy'])->name('destroy');