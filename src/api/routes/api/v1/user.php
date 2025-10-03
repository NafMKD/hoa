<?php

use Illuminate\Support\Facades\Route;


Route::get('/', [\App\Http\Controllers\Api\V1\UserController::class,  'index'])->name('index');
Route::get('by-role', [\App\Http\Controllers\Api\V1\UserController::class, 'getUsersByRole'])->name('by-role');
Route::post('/', [\App\Http\Controllers\Api\V1\UserController::class,  'store'])->name('store');
Route::get('/{user}', [\App\Http\Controllers\Api\V1\UserController::class,  'show'])->name('show');
Route::put('/{user}', [\App\Http\Controllers\Api\V1\UserController::class,  'update'])->name('update');
Route::delete('/{user}', [\App\Http\Controllers\Api\V1\UserController::class,  'destroy'])->name('destroy');