<?php

use App\Http\Controllers\Api\V1\OutgoingLetterController;
use Illuminate\Support\Facades\Route;

Route::get('/', [OutgoingLetterController::class, 'index'])->name('index');
Route::post('/', [OutgoingLetterController::class, 'store'])->name('store');
Route::get('/{outgoingLetter}', [OutgoingLetterController::class, 'show'])->name('show');
// POST is required for multipart file uploads: PHP does not populate $_FILES on PUT.
Route::match(['put', 'post'], '/{outgoingLetter}', [OutgoingLetterController::class, 'update'])->name('update');
Route::delete('/{outgoingLetter}', [OutgoingLetterController::class, 'destroy'])->name('destroy');
