<?php

use App\Http\Controllers\Api\V1\ReconciliationController;
use Illuminate\Support\Facades\Route;

Route::get('/batches', [ReconciliationController::class, 'batches'])->name('batches');
Route::post('/bank-statements', [ReconciliationController::class, 'uploadBankStatement'])->name('upload');
Route::get('/batches/{batch}', [ReconciliationController::class, 'showBatch'])->name('batches.show');
Route::get('/escalations', [ReconciliationController::class, 'escalations'])->name('escalations');
Route::post('/escalations/{escalation}/resolve', [ReconciliationController::class, 'resolveEscalation'])->name('escalations.resolve');
