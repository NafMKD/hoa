<?php 

use Illuminate\Support\Facades\Route;

Route::prefix('auth')->name('api.v1.auth.')->group(function () { 
    require __DIR__.'/auth.php';
});
Route::prefix('users')->middleware('auth:sanctum')->name('api.v1.users.')->group(function () { 
    require __DIR__.'/user.php';
});