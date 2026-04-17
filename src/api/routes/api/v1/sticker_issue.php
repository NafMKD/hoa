<?php

use App\Http\Controllers\Api\V1\StickerIssueController;
use Illuminate\Support\Facades\Route;

Route::get('/verify/{token}', [StickerIssueController::class, 'verify'])->name('verify');
Route::post('/{stickerIssue}/mark-lost', [StickerIssueController::class, 'markLost'])->name('mark-lost');
Route::post('/{stickerIssue}/mark-returned', [StickerIssueController::class, 'markReturned'])->name('mark-returned');
Route::post('/{stickerIssue}/revoke', [StickerIssueController::class, 'revoke'])->name('revoke');
Route::get('/{stickerIssue}/print-data', [StickerIssueController::class, 'printData'])->name('print-data');
