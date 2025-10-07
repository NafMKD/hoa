<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use App\Repositories\Api\V1\InvoiceRepository;
use App\Http\Resources\Api\V1\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class InvoiceController extends Controller
{
    protected InvoiceRepository $invoices;

    /**
     * InvoiceController constructor.
     *
     * @param InvoiceRepository $invoices
     */
    public function __construct(InvoiceRepository $invoices)
    {
        $this->invoices = $invoices;
    }

    /**
     * Display a listing of invoices.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', Invoice::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $invoices = $this->invoices->all($perPage);

            return response()->json(InvoiceResource::collection($invoices));
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
            Log::error('Error fetching invoices: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Store a newly created invoice.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', Invoice::class);

            $validated = $request->validate([
                'user_id'        => ['required', 'integer', 'exists:users,id'],
                'unit_id'        => ['required', 'integer', 'exists:units,id'],
                'total_amount'   => ['required', 'numeric', 'min:0'],
                'issue_date'     => ['required', 'date'],
                'due_date'       => ['required', 'date', 'after_or_equal:issue_date'],
                'source_type'    => ['nullable', 'string'],
                'source_id'      => ['nullable', 'integer'],
                'penalty_amount' => ['nullable', 'numeric', 'min:0'],
            ]);

            $validated['metadata'] = ['generated_by' => Auth::id()];
            $invoice = $this->invoices->create($validated);

            return response()->json(new InvoiceResource($invoice), 201);
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
            Log::error('Error creating invoice: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Display the specified invoice.
     *
     * @param Invoice $invoice
     * @return JsonResponse
     */
    public function show(Invoice $invoice): JsonResponse
    {
        try {
            $this->authorize('view', $invoice);

            $invoice->load(['user', 'unit', 'source', 'payments']);
            return response()->json(new InvoiceResource($invoice));
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
            Log::error('Error fetching invoice: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Remove the specified invoice (soft delete).
     *
     * @param Invoice $invoice
     * @return JsonResponse
     */
    public function destroy(Invoice $invoice): JsonResponse
    {
        try {
            $this->authorize('delete', $invoice);

            $this->invoices->delete($invoice);

            return response()->json([
                'status' => self::_SUCCESS,
                'message' => 'Invoice deleted successfully.',
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
            Log::error('Error deleting invoice: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }
}
