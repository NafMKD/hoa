<?php

use App\Http\Controllers\Api\V1\PaymentController;
use Illuminate\Support\Facades\Route;


Route::get('/', [PaymentController::class,  'index'])->name(name: 'index');
Route::post('/', [PaymentController::class,  'store'])->name('store');
Route::post('/{payment}/confirm', [PaymentController::class,  'confirmPayment'])->name('show');
Route::post('/{payment}/fail', [PaymentController::class,  'failPayment'])->name('show');
Route::post('/{payment}/refund', [PaymentController::class,  'refundPayment'])->name('show');

Route::get('/{payment}', [PaymentController::class,  'show'])->name('show');
Route::delete('/{payment}', [PaymentController::class,  'destroy'])->name('destroy');