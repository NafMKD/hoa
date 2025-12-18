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
Route::prefix('payments')->middleware('auth:sanctum')->name('api.v1.payments.')->group(function () { 
    require __DIR__.'/payment.php';
});
Route::prefix('import')->middleware('auth:sanctum')->name('api.v1.import.')->group(function () { 
    Route::post('/users', [ImportController::class, 'importUsers'])->name('users');
    Route::post('/buildings', [ImportController::class, 'importBuildings'])->name('buildings');
    Route::post('/units', [ImportController::class, 'importUnits'])->name('units');;
});