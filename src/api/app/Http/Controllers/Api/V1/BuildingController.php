<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use App\Repositories\Api\V1\BuildingRepository;
use App\Http\Resources\Api\V1\BuildingResource;
use App\Models\Building;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class BuildingController extends Controller
{
    protected BuildingRepository $buildings;

    /**
     * BuildingController constructor.
     * 
     * @param  BuildingRepository  $buildings
     */
    public function __construct(BuildingRepository $buildings)
    {
        $this->buildings = $buildings;
    }

    /**
     * Display a listing of buildings.
     *
     * @param Request $request
     * @return AnonymousResourceCollection|JsonResponse
     */
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', Building::class);

            $perPage = $request->query('per_page') ?? self::_DEFAULT_PAGINATION;
            $search = $request->query('search');
            $floors = $request->query('floors');
            $unitsPerFloor = $request->query('units_per_floor');

            $filters = compact('search', 'floors', 'unitsPerFloor');

            $buildings = $this->buildings->all($perPage, $filters);

            return BuildingResource::collection($buildings);
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED
            ], 403);
        }
    }

    /**
     * Store a newly created building.
     * 
     * @param  Request  $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', Building::class);

            $data = $request->validate([
                'name'            => ['required', 'string', 'max:255', 'unique:buildings,name'],
                'floors'          => ['required', 'integer', 'min:1'],
                'units_per_floor' => ['required', 'integer', 'min:1'],
                'notes'           => ['nullable', 'string'],
            ]);

            $building = $this->buildings->create($data);

            return response()->json(new BuildingResource($building), 201);
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        }
    }

    /**
     * Display the specified building.
     * 
     * @param  Building  $building
     * @return JsonResponse
     */
    public function show(Building $building): JsonResponse
    {
        try {
            $this->authorize('view', Building::class);

            $building->load('units');

            return response()->json(new BuildingResource($building));
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        }
    }

    /**
     * Update the specified building.
     * 
     * @param  Request  $request
     * @param  Building $building
     * @return JsonResponse
     */
    public function update(Request $request, Building $building): JsonResponse
    {
        try {
            $this->authorize('update', Building::class);

            $data = $request->validate([
                'name'            => ['sometimes', 'string', 'max:255', Rule::unique('buildings')->ignore($building->id)],
                'floors'          => ['sometimes', 'integer', 'min:1'],
                'units_per_floor' => ['sometimes', 'integer', 'min:1'],
                'notes'           => ['nullable', 'string'],
            ]);

            $updated = $this->buildings->update($building, $data);

            return response()->json(new BuildingResource($updated));
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        }
    }

    /**
     * Remove the specified building (soft delete).
     * 
     * @param  Building $building
     * @return JsonResponse
     */
    public function destroy(Building $building): JsonResponse
    {
        try {
            $this->authorize('delete', Building::class);

            $this->buildings->delete($building);

            return response()->json([
                'status' => self::_SUCCESS,
                'message' => 'Building deleted successfully',
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        }
    }
}
