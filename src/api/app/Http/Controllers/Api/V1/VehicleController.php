<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\VehicleResource;
use App\Models\Vehicle;
use App\Repositories\Api\V1\VehicleRepository;
use App\Rules\UniqueVehiclePlateNumber;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class VehicleController extends Controller
{
    protected VehicleRepository $vehicles;

    public function __construct(VehicleRepository $vehicles)
    {
        $this->vehicles = $vehicles;
    }

    /**
     * Display a listing of vehicles.
     *
     * @param Request $request
     * @return AnonymousResourceCollection|JsonResponse
     */
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', Vehicle::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $search = $request->query('search');

            $filters = compact('search');

            $vehicles = $this->vehicles->all($perPage, $filters);

            $vehicles->load(['unit']);

            return VehicleResource::collection($vehicles);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error fetching vehicles: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Store a newly created vehicle.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', Vehicle::class);

            $validated = $request->validate([
                'unit_id'             => ['required', 'integer', 'exists:units,id'],
                'make'                => ['required', 'string', 'max:255'],
                'model'               => ['required', 'string', 'max:255'],
                'year'                => ['required', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
                'license_plate'       => ['required', 'string', 'min:8', 'max:9', new UniqueVehiclePlateNumber()],
                'color'               => ['nullable', 'string', 'max:255'],
                'vehicle_document'    => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:' . self::_MAX_FILE_SIZE],
            ]);

            $vehicle = $this->vehicles->create($validated);

            return response()->json(new VehicleResource($vehicle), 201);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error creating vehicle: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Display the specified vehicle.
     *
     * @param Vehicle $vehicle
     * @return JsonResponse
     */
    public function show(Vehicle $vehicle): JsonResponse
    {
        try {
            $this->authorize('view', $vehicle);

            $vehicle->load('stickers', 'unit', 'document');

            return response()->json(new VehicleResource($vehicle));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error fetching vehicle: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Update the specified vehicle.
     *
     * @param Request $request
     * @param Vehicle $vehicle
     * @return JsonResponse
     */
    public function update(Request $request, Vehicle $vehicle): JsonResponse
    {
        try {
            $this->authorize('update', $vehicle);

            $validated = $request->validate([
                'unit_id'             => ['sometimes', 'nullable', 'integer', 'exists:units,id'],
                'make'                => ['sometimes', 'string', 'max:255'],
                'model'               => ['sometimes', 'string', 'max:255'],
                'year'                => ['sometimes', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
                'license_plate'       => ['sometimes', 'string', 'min:8', 'max:9', new UniqueVehiclePlateNumber()],
                'color'               => ['sometimes', 'nullable', 'string', 'max:255'],
                'vehicle_document'    => ['sometimes', 'nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:' . self::_MAX_FILE_SIZE],
            ]);

            $vehicle = $this->vehicles->update($vehicle, $validated);

            return response()->json(new VehicleResource($vehicle));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error updating vehicle: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Soft delete the specified vehicle.
     *
     * @param Vehicle $vehicle
     * @return JsonResponse
     */
    public function destroy(Vehicle $vehicle): JsonResponse
    {
        try {
            $this->authorize('delete', $vehicle);

            $this->vehicles->delete($vehicle);

            return response()->json(['status' => self::_SUCCESS, 'message' => 'Vehicle deleted successfully.']);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error deleting vehicle: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }
}
