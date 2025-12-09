<?php 

use App\Http\Controllers\ImportController;
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
Route::prefix('fees')->middleware('auth:sanctum')->name('api.v1.fees.')->group(function () { 
    require __DIR__.'/fee.php';
});
Route::prefix('invoices')->middleware('auth:sanctum')->name('api.v1.invoices.')->group(function () { 
    require __DIR__.'/invoice.php';
});
Route::post('/import/users', [ImportController::class, 'importUsers'])->middleware('auth:sanctum')->name('api.v1.import.users');
Route::post('/import/buildings', [ImportController::class, 'importBuildings'])->middleware('auth:sanctum')->name('api.v1.import.buildings');
Route::post('/import/units', [ImportController::class, 'importUnits'])->middleware('auth:sanctum');