<?php

use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;


Route::get('/', [UserController::class,  'index'])->name('index');
Route::get('by-role', [UserController::class, 'getUsersByRole'])->name('by-role');
Route::post('/', [UserController::class,  'store'])->name('store');
Route::get('/names/all', [UserController::class,  'allNames'])->name('all-names');
Route::get('/search', [UserController::class,  'search'])->name('search');

Route::get('/{user}', [UserController::class,  'show'])->name('show');
Route::put('/{user}', [UserController::class,  'update'])->name('update');
Route::delete('/{user}', [UserController::class,  'destroy'])->name('destroy');
Route::patch('/{user}/status', [UserController::class,  'changeStatus'])->name('update-status');