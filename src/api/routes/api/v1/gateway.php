<?php 

use Illuminate\Support\Facades\Route;

Route::prefix('auth')->name('api.v1.auth.')->group(function () { 
    require __DIR__.'/auth.php';
});