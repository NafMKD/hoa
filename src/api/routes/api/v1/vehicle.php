<?php

use App\Http\Controllers\Api\V1\StickerIssueController;
use App\Http\Controllers\Api\V1\VehicleController;
use Illuminate\Support\Facades\Route;

Route::get('/', [VehicleController::class,  'index'])->name('index');
Route::post('/', [VehicleController::class,  'store'])->name('store');

Route::get('/{vehicle}/sticker-issues/pending-replacements', [StickerIssueController::class, 'pendingReplacements'])->name('sticker-issues.pending-replacements');
Route::get('/{vehicle}/sticker-issues', [StickerIssueController::class, 'index'])->name('sticker-issues.index');
Route::post('/{vehicle}/sticker-issues', [StickerIssueController::class, 'store'])->name('sticker-issues.store');

Route::get('/{vehicle}', [VehicleController::class,  'show'])->name('show');
Route::put('/{vehicle}', [VehicleController::class,  'update'])->name('update');
Route::delete('/{vehicle}', [VehicleController::class,  'destroy'])->name('destroy');