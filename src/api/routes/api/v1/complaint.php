<?php

use App\Http\Controllers\Api\V1\ComplaintController;
use Illuminate\Support\Facades\Route;

Route::get('/', [ComplaintController::class, 'index'])->name('index');
Route::post('/', [ComplaintController::class, 'store'])->name('store');
Route::get('/{complaint}', [ComplaintController::class, 'show'])->name('show');
Route::put('/{complaint}', [ComplaintController::class, 'update'])->name('update');
Route::delete('/{complaint}', [ComplaintController::class, 'destroy'])->name('destroy');
