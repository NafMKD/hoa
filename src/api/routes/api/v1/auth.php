<?php

use Illuminate\Support\Facades\Route;

// login routes
Route::post('login', [\App\Http\Controllers\Api\V1\Auth\AuthController::class, 'login'])->name('login');
Route::post('logout', [\App\Http\Controllers\Api\V1\Auth\AuthController::class, 'logout'])->middleware('auth:sanctum')->name('logout');
Route::get('me', [\App\Http\Controllers\Api\V1\Auth\AuthController::class, 'me'])->middleware('auth:sanctum')->name('me');