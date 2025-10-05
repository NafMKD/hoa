<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use App\Repositories\Api\V1\TenantLeaseRepository;
use App\Http\Resources\Api\V1\TenantLeaseResource;
use App\Models\TenantLease;
use Illuminate\Cache\Repository;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TenantLeaseController extends Controller
{
    protected TenantLeaseRepository $leases;

    /**
     * TenantLeaseController constructor.
     *
     * @param TenantLeaseRepository $leases
     */
    public function __construct(TenantLeaseRepository $leases)
    {
        $this->leases = $leases;
    }

    /**
     * Display a listing of tenant leases.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', TenantLease::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $leases = $this->leases->all($perPage);

            return response()->json(TenantLeaseResource::collection($leases));
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
            Log::error('Error fetching tenant leases: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Store a newly created tenant lease.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', TenantLease::class);

            $validated = $request->validate([
                'unit_id'                    => ['required', 'integer', 'exists:units,id'],
                'tenant_id'                  => ['required', 'integer', 'exists:users,id'],
                'representative_id'          => ['nullable', 'integer', 'exists:users,id'],
                'representative_document'    => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:' . self::_MAX_FILE_SIZE],
                'agreement_type'             => ['required', 'string', 'in:' . implode(',', Controller::_LEASE_AGREEMENT_TYPES)],
                'agreement_amount'           => ['required', 'numeric', 'min:0'],
                'lease_template_id'          => ['nullable', 'integer', 'exists:document_templates,id'],
                'lease_start_date'           => ['required', 'date'],
                'lease_end_date'             => ['nullable', 'date', 'after_or_equal:lease_start_date'],
                'status'                     => ['nullable', 'string', 'in:' . implode(',', Controller::_LEASE_STATUS)],
                'witness_1_full_name'        => ['nullable', 'string', 'max:255'],
                'witness_2_full_name'        => ['nullable', 'string', 'max:255'],
                'witness_3_full_name'        => ['nullable', 'string', 'max:255'],
                'notes'                      => ['nullable', 'string'],
                // JSON placeholders validation
                'placeholders'               => ['nullable', 'array'],
                'placeholders.*'             => ['string'], // ensures each value is a string
            ]);

            $validated['created_by'] = Auth::id();
            $lease = $this->leases->create($validated);

            return response()->json(new TenantLeaseResource($lease), 201);
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
     * Display the specified tenant lease.
     *
     * @param TenantLease $lease
     * @return JsonResponse
     */
    public function show(TenantLease $lease): JsonResponse
    {
        try {
            $this->authorize('view', $lease);

            $lease->load(['unit', 'tenant', 'representative', 'representativeDocument', 'leaseTemplate', 'document', 'creator']);
            return response()->json(new TenantLeaseResource($lease));
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
            Log::error('Error fetching tenant lease: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Update the specified tenant lease.
     *
     * @param Request $request
     * @param TenantLease $lease
     * @return JsonResponse
     */
    public function update(Request $request, TenantLease $lease): JsonResponse
    {
        try {
            $this->authorize('update', $lease);

            $validated = $request->validate([
                'unit_id'                    => ['sometimes', 'integer', 'exists:units,id'],
                'tenant_id'                  => ['sometimes', 'integer', 'exists:users,id'],
                'representative_id'          => ['nullable', 'integer', 'exists:users,id'],
                'representative_document'    => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:' . self::_MAX_FILE_SIZE],
                'agreement_type'             => ['sometimes', 'string', 'in:' . implode(',', Controller::_LEASE_AGREEMENT_TYPES)],
                'agreement_amount'           => ['sometimes', 'numeric', 'min:0'],
                'lease_template_id'          => ['nullable', 'integer', 'exists:document_templates,id'],
                'lease_document_id'          => ['nullable', 'integer', 'exists:documents,id'],
                'lease_start_date'           => ['sometimes', 'date'],
                'lease_end_date'             => ['nullable', 'date', 'after_or_equal:lease_start_date'],
                'status'                     => ['sometimes', 'string', 'in:' . implode(',', Controller::_LEASE_STATUS)],
                'witness_1_full_name'        => ['nullable', 'string', 'max:255'],
                'witness_2_full_name'        => ['nullable', 'string', 'max:255'],
                'witness_3_full_name'        => ['nullable', 'string', 'max:255'],
                'notes'                      => ['nullable', 'string'],
            ]);

            $lease = $this->leases->update($lease, $validated);

            return response()->json(new TenantLeaseResource($lease));
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
        }  catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Error updating tenant lease: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Remove the specified tenant lease (soft delete).
     *
     * @param TenantLease $lease
     * @return JsonResponse
     */
    public function destroy(TenantLease $lease): JsonResponse
    {
        try {
            $this->authorize('delete', $lease);

            $this->leases->delete($lease);

            return response()->json([
                'status' => self::_SUCCESS,
                'message' => 'Tenant lease deleted successfully.',
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
            Log::error('Error deleting tenant lease: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Terminate the specified tenant lease.
     * 
     * @param TenantLease $lease
     * @return JsonResponse
     */
    public function terminate(TenantLease $lease): JsonResponse
    {
        try {
            $this->authorize('terminate', $lease);

            $terminatedLease = $this->leases->terminateLeaseById($lease->id);

            return response()->json(new TenantLeaseResource($terminatedLease));
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
            Log::error('Error terminating tenant lease: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }
}
