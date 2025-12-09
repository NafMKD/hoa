<?php

namespace App\Http\Controllers;

use App\Imports\BuildingsSheetImport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\HoaBootstrapImport;
use App\Imports\UnitsSheetImport;
use App\Imports\UsersSheetImport;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ImportController extends Controller
{
    /**
     * Handle the import of users from an uploaded file.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function importUsers(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv',
        ]);
    
        $actorId = Auth::id();
    
        $import = new UsersSheetImport($actorId);
        Excel::import($import, $request->file('file'));
    
        return response()->json([
            'message' => 'Users import completed.',
            'failed' => $import->failedPhones ?? [],
        ]);
    }

    /**
     * Handle the import of buildings from an uploaded file.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function importBuildings(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv',
        ]);

        $actorId = Auth::id();

        $import = new BuildingsSheetImport($actorId);
        Excel::import($import, $request->file('file'));

        return response()->json([
            'message' => 'Buildings import completed.',
            'failed' => $import->failedBuildings ?? [],
        ]);
    }

    /**
     * Handle the import of units from an uploaded file.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function importUnits(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv',
        ]);

        $actorId = Auth::id();

        $import = new UnitsSheetImport($actorId);
        Excel::import($import, $request->file('file'));

        return response()->json([
            'message' => 'Units import completed.',
            'failed' => $import->failedItems ?? [],
        ]);
    }

}
