<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use App\Repositories\Api\V1\FeeRepository;
use App\Http\Resources\Api\V1\FeeResource;
use App\Models\Fee;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class FeeController extends Controller
{
    protected FeeRepository $fees;

    public function __construct(FeeRepository $fees)
    {
        $this->fees = $fees;
    }

    /**
     * Display a listing of fees.
     * 
     * @param Request $request
     * @return AnonymousResourceCollection|JsonResponse
     */
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', Fee::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $search = $request->query('search');

            $filters = compact('search');

            $fees = $this->fees->all($perPage, $filters);

            return FeeResource::collection($fees);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error fetching fees: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Store a newly created fee.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', Fee::class);

            $validated = $request->validate([
                'name'                  => ['required', 'string', 'max:255'],
                'description'           => ['nullable', 'string'],
                'category'              => ['required', 'string', 'max:255', Rule::in(self::_FEE_CATEGORIES)],
                'amount'                => ['required', 'numeric', 'min:0'],
                'is_recurring'          => ['required', 'boolean'],
                'recurring_period_months'=> ['nullable', 'integer', 'min:1'],
                'is_penalizable'        => ['required', 'boolean'],
            ]);

            $validated['created_by'] = Auth::id();
            $fee = $this->fees->create($validated);

            return response()->json(new FeeResource($fee), 201);
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
            Log::error('Error creating fee: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Display the specified fee.
     * 
     * @param Fee $fee
     * @return JsonResponse
     */
    public function show(Fee $fee): JsonResponse
    {
        try {
            $this->authorize('view', $fee);

            return response()->json(new FeeResource($fee));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error fetching fee: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Update the specified fee.
     * 
     * @param Request $request
     * @param Fee $fee
     * @return JsonResponse
     */
    public function update(Request $request, Fee $fee): JsonResponse
    {
        try {
            $this->authorize('update', $fee);

            $validated = $request->validate([
                'name'                  => ['sometimes', 'string', 'max:255'],
                'description'           => ['nullable', 'string'],
                'category'              => ['sometimes', 'string', 'max:255', Rule::in(self::_FEE_CATEGORIES)],
                'amount'                => ['sometimes', 'numeric', 'min:0'],
                'is_recurring'          => ['sometimes', 'boolean'],
                'recurring_period_months'=> ['nullable', 'integer', 'min:1'],
                'is_penalizable'        => ['sometimes', 'boolean'],
            ]);

            $fee = $this->fees->update($fee, $validated);

            return response()->json(new FeeResource($fee));
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
            Log::error('Error updating fee: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Terminate a fee.
     * 
     * @param Fee $fee
     * @return JsonResponse
     */
    public function terminate(Fee $fee): JsonResponse
    {
        try {
            $this->authorize('terminate', $fee);
            $fee = $this->fees->terminate($fee);

            return response()->json(new FeeResource($fee));
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
            Log::error('Error updating fee: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Soft delete the specified fee.
     */
    public function destroy(Fee $fee): JsonResponse
    {
        try {
            $this->authorize('delete', $fee);

            $this->fees->delete($fee);

            return response()->json(['status' => self::_SUCCESS, 'message' => 'Fee deleted successfully.']);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error deleting fee: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Process recurring fees (generate invoices).
     * 
     * @return JsonResponse
     */
    public function processRecurring(): JsonResponse
    {
        try {
            $this->authorize('processRecurring', Fee::class);

            $count = $this->fees->processRecurringFees();

            return response()->json([
                'status' => self::_SUCCESS,
                'message' => "{$count} recurring fees processed successfully.",
            ]);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error processing recurring fees: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }
}
