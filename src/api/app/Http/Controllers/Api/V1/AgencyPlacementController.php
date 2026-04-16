<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\AgencyPlacementResource;
use App\Models\Agency;
use App\Models\AgencyPlacement;
use App\Repositories\Api\V1\AgencyPlacementRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AgencyPlacementController extends Controller
{
    public function __construct(
        protected AgencyPlacementRepository $placements,
    ) {}

    public function index(Request $request, Agency $agency): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', AgencyPlacement::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $isActive = $request->query('is_active');
            $filters = [];
            if ($request->filled('is_active')) {
                $filters['is_active'] = $isActive;
            }

            $list = $this->placements->forAgency($agency, $perPage, $filters);

            return AgencyPlacementResource::collection($list);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching placements: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function store(Request $request, Agency $agency): JsonResponse
    {
        try {
            $this->authorize('create', AgencyPlacement::class);

            $validated = $request->validate([
                'line_of_work' => ['required', 'string', Rule::in(self::_AGENCY_SERVICE_LINES)],
                'workers_count' => ['required', 'integer', 'min:1'],
                'effective_from' => ['required', 'date'],
                'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
                'is_active' => ['sometimes', 'boolean'],
            ]);

            $placement = $this->placements->create($agency, $validated);

            return response()->json(new AgencyPlacementResource($placement->load('agency')), 201);
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
            Log::error('Error creating placement: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function show(Agency $agency, AgencyPlacement $placement): JsonResponse
    {
        try {
            $this->authorize('view', $placement);
            abort_if($placement->agency_id !== $agency->id, 404);

            $placement->load('agency');

            return response()->json(new AgencyPlacementResource($placement));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching placement: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function update(Request $request, Agency $agency, AgencyPlacement $placement): JsonResponse
    {
        try {
            $this->authorize('update', $placement);
            abort_if($placement->agency_id !== $agency->id, 404);

            $validated = $request->validate([
                'line_of_work' => ['sometimes', 'string', Rule::in(self::_AGENCY_SERVICE_LINES)],
                'workers_count' => ['sometimes', 'integer', 'min:1'],
                'effective_from' => ['sometimes', 'date'],
                'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
                'is_active' => ['sometimes', 'boolean'],
            ]);

            $placement = $this->placements->update($placement, $validated);

            return response()->json(new AgencyPlacementResource($placement->load('agency')));
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
            Log::error('Error updating placement: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function destroy(Agency $agency, AgencyPlacement $placement): JsonResponse
    {
        try {
            $this->authorize('delete', $placement);
            abort_if($placement->agency_id !== $agency->id, 404);

            $this->placements->delete($placement);

            return response()->json(['status' => self::_SUCCESS, 'message' => 'Placement deleted successfully.']);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error deleting placement: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }
}
