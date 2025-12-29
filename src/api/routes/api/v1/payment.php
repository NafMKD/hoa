<?php

use App\Http\Controllers\Api\V1\PaymentController;
use Illuminate\Support\Facades\Route;


Route::get('/', [PaymentController::class,  'index'])->name(name: 'index');
Route::post('/', [PaymentController::class,  'store'])->name('store');
Route::post('/{payment}/confirm', [PaymentController::class,  'confirmPayment'])->name('confirm-payment');
Route::post('/{payment}/fail', [PaymentController::class,  'failPayment'])->name('fail-payment');
Route::post('/{payment}/refund', [PaymentController::class,  'refundPayment'])->name('refund-payment');
Route::post('/{payment}/add_receipt_number', [PaymentController::class,  'addReceiptNumber'])->name('add-receipt-number');

Route::get('/{payment}', [PaymentController::class,  'show'])->name('show');
Route::delete('/{payment}', [PaymentController::class,  'destroy'])->name('destroy');