<?php

use App\Http\Controllers\Api\V1\DocumentTemplateController;
use Illuminate\Support\Facades\Route;


Route::get('/', [DocumentTemplateController::class,  'index'])->name('index');
Route::post('/', [DocumentTemplateController::class,  'store'])->name('store');
Route::get('/{template}', [DocumentTemplateController::class,  'show'])->name('show');
// Route::put('/{template}', [DocumentTemplateController::class,  'update'])->name('update'); // Update not supported
Route::delete('/{template}', [DocumentTemplateController::class,  'destroy'])->name('destroy');
Route::get('/{template}/placeholders', [DocumentTemplateController::class,  'placeholders'])->name('placeholders');