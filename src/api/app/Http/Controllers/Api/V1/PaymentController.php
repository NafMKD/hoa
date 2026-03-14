<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PaymentResource;
use App\Jobs\Api\V1\ProcessPaymentOcrJob;
use App\Models\Invoice;
use App\Models\Payment;
use App\Repositories\Api\V1\DocumentRepository;
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
    /** Max payment screenshot size in KB (1 MB – OCR.space free tier limit). */
    protected const _MAX_SCREENSHOT_SIZE_KB = 1024;

    protected PaymentRepository $payments;
    protected DocumentRepository $documents;

    public function __construct(PaymentRepository $payments, DocumentRepository $documents)
    {
        $this->payments = $payments;
        $this->documents = $documents;
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
     * Store a payment from Telegram Mini App (with screenshot).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function storeTelegram(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'invoice_id'    => ['required', 'integer', 'exists:invoices,id'],
                'amount'        => ['required', 'numeric', 'min:0'],
                // Temporarily let backend set payment date automatically for Telegram payments.
                'payment_date'  => ['nullable', 'date'],
                'screenshot'    => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:' . self::_MAX_SCREENSHOT_SIZE_KB],
            ]);

            $invoice = Invoice::findOrFail($validated['invoice_id']);
            $this->authorize('createFromTelegram', $invoice);

            if ($invoice->user_id && $invoice->user_id != $request->user()->id) {
                return response()->json([
                    'status'  => self::_ERROR,
                    'message' => 'Invoice does not belong to you.',
                ], 403);
            } else if (!$invoice->user_id && $invoice->unit->currentOwner && $invoice->unit->currentOwner->user_id != $request->user()->id) {
                return response()->json([
                    'status'  => self::_ERROR,
                    'message' => 'Invoice does not belong to you.',
                ], 403);
            } else if (!$invoice->user_id && $invoice->unit->currentLease && $invoice->unit->currentLease->tenant_id != $request->user()->id) {
                return response()->json([
                    'status'  => self::_ERROR,
                    'message' => 'Invoice does not belong to you.',
                ], 403);
            }

            $document = $this->documents->create(
                $request->file('screenshot'),
                Controller::_DOCUMENT_TYPES[3] // payments
            );

            $payment = $this->payments->createFromTelegram([
                'invoice_id'              => $validated['invoice_id'],
                'amount'                  => $validated['amount'],
                // If no payment_date is provided, default to today's date.
                'payment_date'            => $validated['payment_date'] ?? now()->toDateString(),
                'payment_screen_shoot_id' => $document->id,
            ]);

            ProcessPaymentOcrJob::dispatch($payment->id);

            $payment->load(['invoice', 'invoice.user', 'invoice.unit', 'screenshot']);

            return response()->json(new PaymentResource($payment), 201);
        } catch (AuthorizationException) {
            return response()->json([
                'status'  => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (ValidationException $e) {
            return response()->json([
                'status'  => self::_ERROR,
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (RepositoryException $e) {
            return response()->json([
                'status'  => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Error creating Telegram payment: ' . $e->getMessage());
            return response()->json([
                'status'  => self::_ERROR,
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
                'reference'               => ['required', 'string'],
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
     * Add a payment receipt number
     * 
     * @param Request $request
     * @param Payment $payment
     * 
     * @return Payment|JsonResponse
     */
    public function addReceiptNumber(Request $request, Payment $payment): Payment|JsonResponse
    {
        try {
            $this->authorize('addReceiptNumber', $payment);

            $validated = $request->validate([
                'receipt_number' => ['required', 'string', 'max:255'],
            ]);
            $paymentNumber = $validated['receipt_number'];

            $payment = $this->payments->addReceiptNumber($payment, $paymentNumber);

            $payment->load(['invoice', 'invoice.user',  'invoice.unit', 'screenshot']);

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
