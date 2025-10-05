<?php

use App\Http\Controllers\Api\V1\InvoiceController;
use Illuminate\Support\Facades\Route;


Route::get('/', [InvoiceController::class,  'index'])->name(name: 'index');
Route::post('/', [InvoiceController::class,  'store'])->name('store');
Route::get('/{invoice}', [InvoiceController::class,  'show'])->name('show');
Route::delete('/{invoice}', [InvoiceController::class,  'destroy'])->name('destroy');