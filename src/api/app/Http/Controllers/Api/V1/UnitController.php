<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use App\Repositories\Api\V1\UnitRepository;
use App\Http\Resources\Api\V1\UnitResource;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class UnitController extends Controller
{
    protected UnitRepository $units;

    /**
     * UnitController constructor.
     * 
     * @param UnitRepository $units
     */
    public function __construct(UnitRepository $units)
    {
        $this->units = $units;
    }

    /**
     * Display a listing of units.
     * 
     * @param Request $request
     * @return AnonymousResourceCollection|JsonResponse
     */
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', Unit::class);

            $perPage = $request->query('per_page') ?? self::_DEFAULT_PAGINATION;
            $search = $request->query('search');

            $filters = compact('search');

            $units = $this->units->all($perPage, $filters);

            return UnitResource::collection($units);
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        }
    }

    /**
     * Store a newly created unit.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', Unit::class);

            $data = $request->validate([
                'building_id'      => ['required', 'exists:buildings,id'],
                'name'             => ['required', 'string', 'max:255', 'unique:units,name'],
                'floor_number'     => ['required', 'integer', 'min:0'],
                'owner_id'         => ['nullable', 'exists:users,id'],
                'ownership_file_id'=> ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:'.self::_MAX_FILE_SIZE],
                'unit_type'        => ['required', 'string', Rule::in(Controller::_UNIT_TYPES)],
                'size_m2'          => ['nullable', 'numeric', 'min:0'],
                'status'           => ['nullable', 'string', Rule::in(Controller::_UNIT_STATUSES)],
            ]);

            $unit = $this->units->create($data);

            return response()->json(new UnitResource($unit), 201);
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        }
    }

    /**
     * Display the specified unit.
     * 
     * @param Unit $unit
     * @return JsonResponse
     */
    public function show(Unit $unit): JsonResponse
    {
        try {
            $this->authorize('view', $unit);

            $unit->load(['building', 'owner', 'leases', 'ownershipFile', 'tenant']);

            return response()->json(new UnitResource($unit));
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        }
    }

    /**
     * Update the specified unit.
     * 
     * @param Request $request
     * @param Unit $unit
     * @return JsonResponse
     */
    public function update(Request $request, Unit $unit): JsonResponse
    {
        try {
            $this->authorize('update', $unit);

            $data = $request->validate([
                'building_id'      => ['sometimes', 'exists:buildings,id'],
                'name'             => ['sometimes', 'string', 'max:255', Rule::unique('units')->ignore($unit->id)],
                'floor_number'     => ['sometimes', 'integer', 'min:0'],
                'owner_id'         => ['nullable', 'exists:users,id'],
                'ownership_file_id'=> ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:'.self::_MAX_FILE_SIZE],
                'unit_type'        => ['sometimes', 'string', Rule::in(Controller::_UNIT_TYPES)],
                'size_m2'          => ['nullable', 'numeric', 'min:0'],
                'status'           => ['nullable', 'string', Rule::in(Controller::_UNIT_STATUSES)],
            ]);

            $updated = $this->units->update($unit, $data);

            return response()->json(new UnitResource($updated));
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        }
    }

    /**
     * Remove the specified unit (soft delete).
     * 
     * @param Unit $unit
     * @return JsonResponse
     */
    public function destroy(Unit $unit): JsonResponse
    {
        try {
            $this->authorize('delete', $unit);

            $this->units->delete($unit);

            return response()->json([
                'status' => self::_SUCCESS,
                'message' => 'Unit deleted successfully',
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        }
    }
}
