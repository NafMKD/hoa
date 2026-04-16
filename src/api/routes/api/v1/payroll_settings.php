<?php

use App\Http\Controllers\Api\V1\PayrollSettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PayrollSettingsController::class, 'show'])->name('show');
Route::put('/', [PayrollSettingsController::class, 'update'])->name('update');
