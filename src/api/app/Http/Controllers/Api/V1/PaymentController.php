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
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
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
     *
     * @param Request $request
     * @return AnonymousResourceCollection|JsonResponse
     */
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', Payment::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $search = $request->query('search');

            $filters = compact('search');

            $payments = $this->payments->all($perPage, $filters);

            $payments->load(['invoice', 'invoice.user', 'invoice.unit']);

            return PaymentResource::collection($payments);
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
     * 
     * @param  Request  $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', Payment::class);

            $validated = $request->validate([
                'invoice_id'              => ['required', 'integer', 'exists:invoices,id'],
                'amount'                  => ['required', 'numeric', 'min:0'],
                'method'                  => ['required', 'string', 'max:255'],
                'reference'               => ['required', 'string', 'max:255'],
                'payment_date'            => ['required', 'date'],
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
     * 
     * @param  Payment $payment
     * @return JsonResponse
     */
    public function show(Payment $payment): JsonResponse
    {
        try {
            $this->authorize('view', $payment);
            $payment->load(['invoice', 'invoice.user',  'invoice.unit', 'screenshot']);

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
     * Mark payment as confirmed
     * 
     * @param  Payment $payment
     * @return Payment|JsonResponse
     */
    public function confirmPayment(Payment $payment): Payment|JsonResponse
    {
        try {
            $this->authorize('markConfirm', $payment);
            $payment = $this->payments->confirm($payment);

            $payment->load(['invoice', 'invoice.user',  'invoice.unit', 'screenshot']);

            return response()->json(new PaymentResource($payment));
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

    /**
     * Mark payment as refunded
     * 
     * @param  Payment $payment
     * @return Payment|JsonResponse
     */
    public function refundPayment(Payment $payment): Payment|JsonResponse
    {
        try {
            $this->authorize('markRefund', $payment);
            $payment = $this->payments->refund($payment);

            $payment->load(['invoice', 'invoice.user',  'invoice.unit', 'screenshot']);

            return response()->json(new PaymentResource($payment));
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

    /**
     * Mark payment as failed
     * 
     * @param  Payment $payment
     * @return Payment|JsonResponse
     */
    public function failPayment(Payment $payment): Payment|JsonResponse
    {
        try {
            $this->authorize('markFailed', $payment);
            $payment = $this->payments->fail($payment);
            
            $payment->load(['invoice', 'invoice.user',  'invoice.unit', 'screenshot']);

            return response()->json(new PaymentResource($payment));
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


    /**
     * Delete a payment.
     * 
     * @param  Payment $payment
     * @return JsonResponse
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
