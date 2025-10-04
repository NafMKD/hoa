<?php 

use Illuminate\Support\Facades\Route;

Route::prefix('auth')->name('api.v1.auth.')->group(function () { 
    require __DIR__.'/auth.php';
});
Route::prefix('users')->middleware('auth:sanctum')->name('api.v1.users.')->group(function () { 
    require __DIR__.'/user.php';
});
Route::prefix('buildings')->middleware('auth:sanctum')->name('api.v1.buildings.')->group(function () { 
    require __DIR__.'/building.php';
});
Route::prefix('units')->middleware('auth:sanctum')->name('api.v1.units.')->group(function () { 
    require __DIR__.'/unit.php';
});
Route::prefix('document-templates')->middleware('auth:sanctum')->name('api.v1.document_templates.')->group(function () { 
    require __DIR__.'/document_template.php';
});