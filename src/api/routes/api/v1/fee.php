<?php

use App\Http\Controllers\Api\V1\FeeController;
use Illuminate\Support\Facades\Route;


Route::get('/', [FeeController::class,  'index'])->name('index');
Route::post('/', [FeeController::class,  'store'])->name('store');
Route::get('/all', [FeeController::class,  'getAll'])->name('getAll');
Route::post('/{fee}/terminate', [FeeController::class,  'terminate'])->name('terminate');

Route::get('/{fee}', [FeeController::class,  'show'])->name('show');
Route::put('/{fee}', [FeeController::class,  'update'])->name('update');
Route::delete('/{fee}', [FeeController::class,  'destroy'])->name('destroy');