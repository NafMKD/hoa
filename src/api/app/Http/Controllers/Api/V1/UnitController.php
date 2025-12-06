<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UnitLeaseResource;
use App\Http\Resources\Api\V1\UnitOwnerResource;
use App\Models\UnitLease;
use App\Rules\UniqueUnitLease;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use App\Repositories\Api\V1\UnitRepository;
use App\Http\Resources\Api\V1\UnitResource;
use App\Models\Unit;
use App\Models\UnitOwner;
use App\Repositories\Api\V1\UnitLeaseRepository;
use App\Repositories\Api\V1\UnitOwnerRepository;
use App\Rules\UniqueUnitName;
use App\Rules\UniqueUnitOwner;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class UnitController extends Controller
{
    protected UnitRepository $units;
    protected UnitLeaseRepository $leases;
    protected UnitOwnerRepository $owners;

    /**
     * UnitController constructor.
     * 
     * @param UnitRepository $units
     */
    public function __construct(UnitRepository $units, UnitLeaseRepository $leases, UnitOwnerRepository $owners)
    {
        $this->units = $units;
        $this->leases = $leases;
        $this->owners = $owners;
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

            $units->load(['currentOwner']);

            return UnitResource::collection($units);
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
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
                'name'             => ['required', 'string', 'max:255', new UniqueUnitName()],
                'floor_number'     => ['required', 'integer', 'min:-2'],
                'unit_type'        => ['required', 'string', Rule::in(self::_UNIT_TYPES)],
                'size_m2'          => ['nullable', 'numeric', 'min:0'],
                'status'           => ['nullable', 'string', Rule::in(self::_UNIT_STATUSES)],
            ]);

            $unit = $this->units->create($data);

            return response()->json(new UnitResource($unit), 201);
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (ValidationException $e) {
            // Return validation errors in array format
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
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

            $unit->load([
                'building',
                'owners',
                'owners.owner',
                'owners.document',
                'currentOwner',
                'currentOwner.owner',
                'currentOwner.document',
                'leases',
                'currentLease',
            ]);

            return response()->json(new UnitResource($unit));
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
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
                'unit_type'        => ['sometimes', 'string', Rule::in(self::_UNIT_TYPES)],
                'size_m2'          => ['nullable', 'numeric', 'min:0'],
                'status'           => ['nullable', 'string', Rule::in(self::_UNIT_STATUSES)],
            ]);

            $updated = $this->units->update($unit, $data);

            return response()->json(new UnitResource($updated));
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (ValidationException $e) {
            // Return validation errors in array format
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
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
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Create a unit lease.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function storeUnitLease(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', UnitLease::class);

            Log::info('Creating unit lease with request data: ' . json_encode($request->all()));

            return response()->json([
                'status' => self::_SUCCESS,
                'message' => 'Unit lease created successfully.',
            ], 201);
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (ValidationException $e) {
            // Return validation errors in array format
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Error creating tenant lease: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Remove the specified unit lease (soft delete).
     *
     * @param UnitLease $lease
     * @return JsonResponse
     */
    public function destroyUnitLease(UnitLease $lease): JsonResponse
    {
        try {
            $this->authorize('delete', $lease);

            $this->leases->delete($lease);

            return response()->json([
                'status' => self::_SUCCESS,
                'message' => 'Unit lease deleted successfully.',
            ]);
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Error deleting Unit lease: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Terminate the specified unit lease.
     * 
     * @param UnitLease $lease
     * @return JsonResponse
     */
    public function terminateUnitLease(UnitLease $lease): JsonResponse
    {
        try {
            $this->authorize('terminate', $lease);

            $terminatedLease = $this->leases->terminateLeaseById($lease->id);

            return response()->json(new UnitLeaseResource($terminatedLease));
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Error terminating unit lease: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Activate the specified unit lease.
     * 
     * @param UnitLease $lease
     * @return JsonResponse
     */
    public function activateUnitLease(UnitLease $lease): JsonResponse
    {
        try {
            $this->authorize('activate', $lease);

            $activatedLease = $this->leases->activateDraftLease($lease->id);

            return response()->json(new UnitLeaseResource($activatedLease));
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Error activating unit lease: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Create a unit owner.
     *
     * @param Request $request
     * @param Unit $unit
     * @return JsonResponse
     */
    public function storeUnitOwner(Request $request, Unit $unit): JsonResponse
    {
        try {
            $this->authorize('create', UnitOwner::class);

            $validated = $request->validate([
                'user_id'             => ['required', 'exists:users,id', new UniqueUnitOwner($unit->id)],
                'start_date'          => ['required', 'date'],
                'end_date'            => ['nullable', 'date', 'after_or_equal:start_date'],
                'ownership_file'      => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:' . self::_MAX_FILE_SIZE],
            ]);

            $validated['created_by'] = Auth::id();

            $owner = $this->owners->create($unit, $validated);

            return response()->json(new UnitOwnerResource($owner), 201);
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Error creating unit owner: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Remove the specified unit owner (soft delete).
     *
     * @param UnitOwner $owner
     * @return JsonResponse
     */
    public function destroyUnitOwner(UnitOwner $owner): JsonResponse
    {
        try {
            $this->authorize('delete', $owner);

            $this->owners->delete($owner);

            return response()->json([
                'status' => self::_SUCCESS,
                'message' => 'Unit owner deleted successfully.',
            ]);
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Error deleting unit owner: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Deactivate the specified unit owner.
     *
     * @param UnitOwner $owner
     * @return JsonResponse
     */
    public function deactivateUnitOwner(UnitOwner $owner): JsonResponse
    {
        try {
            $this->authorize('deactivate', $owner);

            $this->owners->deactivate($owner);

            return response()->json(new UnitOwnerResource($owner));
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (\Exception $e) {
            Log::error('Error deactivating unit owner: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Change status of the unit
     * 
     * @param Request $request
     * @param Unit $unit
     * @return JsonResponse
     */
    public function changeUnitStatus(Request $request, Unit $unit): JsonResponse
    {
        try {
            $this->authorize('update', $unit);

            $data = $request->validate([
                'status' => ['required', 'string', Rule::in(self::_UNIT_STATUSES), Rule::notIn([$unit->status])],
            ]);

            $updated = $this->units->changeStatus($unit, $data['status']);

            return response()->json(new UnitResource($updated));
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (ValidationException $e) {
            // Return validation errors in array format
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }
}
