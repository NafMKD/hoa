<?php

use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;


Route::get('/', [UserController::class,  'index'])->name('index');
Route::get('by-role', [UserController::class, 'getUsersByRole'])->name('by-role');
Route::post('/', [UserController::class,  'store'])->name('store');
Route::get('/{user}', [UserController::class,  'show'])->name('show');
Route::put('/{user}', [UserController::class,  'update'])->name('update');
Route::delete('/{user}', [UserController::class,  'destroy'])->name('destroy');