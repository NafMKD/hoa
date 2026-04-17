<?php

use App\Http\Controllers\Api\V1\PollController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PollController::class, 'index'])->name('index');
Route::post('/', [PollController::class, 'store'])->name('store');
Route::get('/{poll}', [PollController::class, 'show'])->name('show');
Route::put('/{poll}', [PollController::class, 'update'])->name('update');
Route::delete('/{poll}', [PollController::class, 'destroy'])->name('destroy');
Route::post('/{poll}/open', [PollController::class, 'open'])->name('open');
Route::post('/{poll}/close', [PollController::class, 'close'])->name('close');
Route::get('/{poll}/results', [PollController::class, 'results'])->name('results');
Route::post('/{poll}/votes', [PollController::class, 'vote'])->name('votes.store');
