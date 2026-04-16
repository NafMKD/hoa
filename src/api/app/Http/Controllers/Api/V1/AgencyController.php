<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\AgencyResource;
use App\Models\Agency;
use App\Repositories\Api\V1\AgencyRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AgencyController extends Controller
{
    public function __construct(
        protected AgencyRepository $agencies,
    ) {}

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', Agency::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $search = $request->query('search');
            $filters = compact('search');

            return AgencyResource::collection($this->agencies->all($perPage, $filters));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching agencies: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function getAll(): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', Agency::class);

            return AgencyResource::collection($this->agencies->getAll());
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching agencies: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', Agency::class);

            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'phone' => ['nullable', 'string', 'max:255'],
                'email' => ['nullable', 'email', 'max:255'],
                'address' => ['nullable', 'string'],
                'notes' => ['nullable', 'string'],
                'default_worker_count' => ['nullable', 'integer', 'min:1'],
                'default_monthly_amount' => ['nullable', 'numeric', 'min:0'],
            ]);

            $agency = $this->agencies->create($validated);

            return response()->json(new AgencyResource($agency), 201);
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
            Log::error('Error creating agency: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function show(Agency $agency): JsonResponse
    {
        try {
            $this->authorize('view', $agency);

            return response()->json(new AgencyResource($agency));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching agency: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function update(Request $request, Agency $agency): JsonResponse
    {
        try {
            $this->authorize('update', $agency);

            $validated = $request->validate([
                'name' => ['sometimes', 'string', 'max:255'],
                'phone' => ['nullable', 'string', 'max:255'],
                'email' => ['nullable', 'email', 'max:255'],
                'address' => ['nullable', 'string'],
                'notes' => ['nullable', 'string'],
                'default_worker_count' => ['nullable', 'integer', 'min:1'],
                'default_monthly_amount' => ['nullable', 'numeric', 'min:0'],
            ]);

            $agency = $this->agencies->update($agency, $validated);

            return response()->json(new AgencyResource($agency));
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
            Log::error('Error updating agency: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function destroy(Agency $agency): JsonResponse
    {
        try {
            $this->authorize('delete', $agency);

            $this->agencies->delete($agency);

            return response()->json(['status' => self::_SUCCESS, 'message' => 'Agency deleted successfully.']);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error deleting agency: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }
}
