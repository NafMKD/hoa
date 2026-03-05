<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\BankStatementBatchResource;
use App\Http\Resources\Api\V1\BankTransactionResource;
use App\Http\Resources\Api\V1\ReconciliationEscalationResource;
use App\Models\BankStatementBatch;
use App\Models\ReconciliationEscalation;
use App\Repositories\Api\V1\BankStatementBatchRepository;
use App\Repositories\Api\V1\PaymentRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ReconciliationController extends Controller
{
    public function __construct(
        protected BankStatementBatchRepository $batchRepository,
        protected PaymentRepository $paymentRepository
    ) {}

    /**
     * List bank statement batches.
     *
     * @param Request $request
     * @return AnonymousResourceCollection|JsonResponse
     */
    public function batches(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', BankStatementBatch::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $batches = BankStatementBatch::with('admin')
                ->orderByDesc('uploaded_at')
                ->paginate($perPage);

            return BankStatementBatchResource::collection($batches);
        } catch (AuthorizationException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching reconciliation batches: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Get batch with transactions.
     *
     * @param BankStatementBatch $batch
     * @return JsonResponse
     */
    public function showBatch(BankStatementBatch $batch): JsonResponse
    {
        try {
            $this->authorize('view', $batch);
            $batch->load(['admin', 'transactions.matchedPayment.invoice']);
            return response()->json(new BankStatementBatchResource($batch));
        } catch (AuthorizationException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching batch: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Upload bank statement CSV.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function uploadBankStatement(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', BankStatementBatch::class);

            $validated = $request->validate([
                'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
            ]);

            $batch = $this->batchRepository->createFromCsv(
                $request->file('file'),
                $request->user()->id
            );

            return response()->json(new BankStatementBatchResource($batch->load('admin')), 201);
        } catch (AuthorizationException $e) {
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
            Log::error('Error uploading bank statement: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * List escalations.
     *
     * @param Request $request
     * @return AnonymousResourceCollection|JsonResponse
     */
    public function escalations(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', ReconciliationEscalation::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $escalations = ReconciliationEscalation::with(['payment.invoice', 'bankTransaction', 'resolver'])
                ->where('status', 'pending')
                ->orderByDesc('created_at')
                ->paginate($perPage);

            return ReconciliationEscalationResource::collection($escalations);
        } catch (AuthorizationException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching escalations: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Resolve an escalation.
     *
     * @param Request $request
     * @param ReconciliationEscalation $escalation
     * @return JsonResponse
     */
    public function resolveEscalation(Request $request, ReconciliationEscalation $escalation): JsonResponse
    {
        try {
            $this->authorize('update', $escalation);

            $validated = $request->validate([
                'action'            => ['required', Rule::in(['confirm', 'fail', 'link'])],
                'payment_id'       => ['required_if:action,link', 'nullable', 'exists:payments,id'],
                'resolution_notes' => ['nullable', 'string', 'max:1000'],
            ]);

            $payment = $escalation->payment;
            $bankTransaction = $escalation->bankTransaction;

            if ($validated['action'] === 'confirm' && $payment) {
                $this->paymentRepository->confirm($payment);
                if ($bankTransaction) {
                    $bankTransaction->update(['matched_payment_id' => $payment->id, 'status' => 'matched']);
                    $payment->update(['bank_transaction_id' => $bankTransaction->id]);
                }
            } elseif ($validated['action'] === 'fail' && $payment) {
                $this->paymentRepository->fail($payment);
            } elseif ($validated['action'] === 'link' && $validated['payment_id'] && $bankTransaction) {
                $payment = \App\Models\Payment::findOrFail($validated['payment_id']);
                $this->paymentRepository->confirm($payment);
                $bankTransaction->update(['matched_payment_id' => $payment->id, 'status' => 'matched']);
                $payment->update(['bank_transaction_id' => $bankTransaction->id]);
            }

            $escalation->update([
                'status'           => 'resolved',
                'resolved_by'      => $request->user()->id,
                'resolved_at'      => now(),
                'resolution_notes' => $validated['resolution_notes'] ?? null,
            ]);

            return response()->json(new ReconciliationEscalationResource($escalation->fresh(['payment', 'bankTransaction', 'resolver'])));
        } catch (AuthorizationException $e) {
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
            Log::error('Error resolving escalation: ' . $e->getMessage());
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }
}
