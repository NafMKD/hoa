<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PaymentResource;
use App\Models\Payment;
use App\Repositories\Api\V1\PaymentRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    protected PaymentRepository $payments;

    public function __construct(PaymentRepository $payments)
    {
        $this->payments = $payments;
    }

    /**
     * Display a listing of payments.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', Payment::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $payments = $this->payments->all($perPage);

            return response()->json(PaymentResource::collection($payments));
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
            Log::error('Error fetching payments: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Store a newly created payment.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', Payment::class);

            $validated = $request->validate([
                'invoice_id'              => ['required', 'integer', 'exists:invoices,id'],
                'amount'                  => ['required', 'numeric', 'min:0'],
                'method'                  => ['required', 'string', 'max:255'],
                'reference'               => ['nullable', 'string', 'max:255'],
                'status'                  => ['required', 'string', 'in:pending,completed,failed,reconciled'],
                'processed_at'            => ['nullable', 'date'],
                'payment_date'            => ['required', 'date'],
                'reconciliation_metadata' => ['nullable', 'array'],
                'payment_screen_shoot'    => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:'.self::_MAX_FILE_SIZE],
            ]);

            $payment = $this->payments->create($validated);

            return response()->json(new PaymentResource($payment), 201);
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
            Log::error('Error creating payment: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Display a specific payment.
     */
    public function show(Payment $payment): JsonResponse
    {
        try {
            $this->authorize('view', $payment);
            $payment->load(['invoice', 'screenshot']);
            return response()->json(new PaymentResource($payment));
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching payment: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Update the specified payment.
     */
    public function update(Request $request, Payment $payment): JsonResponse
    {
        try {
            $this->authorize('update', $payment);

            $validated = $request->validate([
                'amount'                  => ['sometimes', 'numeric', 'min:0'],
                'method'                  => ['sometimes', 'string', 'max:255'],
                'reference'               => ['nullable', 'string', 'max:255'],
                'status'                  => ['sometimes', 'string', 'in:pending,completed,failed,reconciled'],
                'processed_at'            => ['nullable', 'date'],
                'payment_date'            => ['nullable', 'date'],
                'reconciliation_metadata' => ['nullable', 'array'],
                'payment_screen_shoot_id' => ['nullable', 'integer', 'exists:documents,id'],
            ]);

            $payment = $this->payments->update($payment, $validated);

            return response()->json(new PaymentResource($payment));
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
            Log::error('Error updating payment: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Delete a payment.
     */
    public function destroy(Payment $payment): JsonResponse
    {
        try {
            $this->authorize('delete', $payment);
            $this->payments->delete($payment);

            return response()->json([
                'status' => self::_SUCCESS,
                'message' => 'Payment deleted successfully.',
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
            Log::error('Error deleting payment: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }
}
