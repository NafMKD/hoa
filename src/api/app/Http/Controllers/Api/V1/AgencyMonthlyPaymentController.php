<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\AgencyMonthlyPaymentResource;
use App\Http\Resources\Api\V1\AgencyPlacementResource;
use App\Models\AgencyPlacement;
use App\Models\AgencyMonthlyPayment;
use App\Repositories\Api\V1\AgencyMonthlyPaymentRepository;
use App\Repositories\Api\V1\AgencyPlacementRepository;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AgencyMonthlyPaymentController extends Controller
{
    public function __construct(
        protected AgencyMonthlyPaymentRepository $payments,
        protected AgencyPlacementRepository $placements,
    ) {}

    public function generate(Request $request): JsonResponse
    {
        try {
            $this->authorize('generate', AgencyMonthlyPayment::class);

            $validated = $request->validate([
                'calendar_month' => ['required', 'date'],
            ]);

            $month = Carbon::parse($validated['calendar_month'])->startOfMonth()->toDateString();

            $created = $this->payments->generateDraftForMonth($month, (int) Auth::id());

            return response()->json(AgencyMonthlyPaymentResource::collection($created), 201);
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
        } catch (\Throwable $e) {
            return $this->jsonServerError($e, 'Error generating agency monthly payments');
        }
    }

    public function submitReview(AgencyMonthlyPayment $agency_monthly_payment): JsonResponse
    {
        try {
            $this->authorize('submitForReview', $agency_monthly_payment);

            $payment = $this->payments->submitForReview($agency_monthly_payment);

            return response()->json(new AgencyMonthlyPaymentResource($payment->load(['agency', 'placement', 'expense', 'creator', 'approver'])));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error submitting agency payment: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function approve(AgencyMonthlyPayment $agency_monthly_payment): JsonResponse
    {
        try {
            $this->authorize('approve', $agency_monthly_payment);

            $payment = $this->payments->approve($agency_monthly_payment, (int) Auth::id());

            return response()->json(new AgencyMonthlyPaymentResource($payment->load(['agency', 'placement', 'expense', 'creator', 'approver'])));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error approving agency payment: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function suggestions(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewSuggestions', AgencyMonthlyPayment::class);

            $validated = $request->validate([
                'calendar_month' => ['required', 'date'],
            ]);

            $list = $this->placements->activeForCalendarMonth($validated['calendar_month']);

            return AgencyPlacementResource::collection($list);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error fetching placement suggestions: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', AgencyMonthlyPayment::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $filters = [];
            if ($request->filled('agency_id')) {
                $filters['agency_id'] = $request->query('agency_id');
            }
            if ($request->filled('calendar_month')) {
                $filters['calendar_month'] = $request->query('calendar_month');
            }
            if ($request->filled('status')) {
                $filters['status'] = $request->query('status');
            }

            $list = $this->payments->all($perPage, $filters);

            return AgencyMonthlyPaymentResource::collection($list);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching agency monthly payments: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', AgencyMonthlyPayment::class);

            $validated = $request->validate([
                'agency_id' => ['required', 'integer', 'exists:agencies,id'],
                'calendar_month' => ['required', 'date'],
                'amount_paid' => ['required', 'numeric', 'min:0.01'],
                'worker_count' => ['required', 'integer', 'min:1'],
                'placement_id' => ['nullable', 'integer', 'exists:agency_placements,id'],
                'reference' => ['nullable', 'string', 'max:255'],
                'notes' => ['nullable', 'string'],
                'status' => ['sometimes', 'string', Rule::in(self::_AGENCY_MONTHLY_PAYMENT_STATUSES)],
            ]);

            $validated['created_by'] = Auth::id();
            if (! isset($validated['status'])) {
                $validated['status'] = self::_AGENCY_MONTHLY_PAYMENT_STATUSES[0];
            }

            $validated['calendar_month'] = \Carbon\Carbon::parse($validated['calendar_month'])->startOfMonth()->toDateString();

            if (! empty($validated['placement_id'])) {
                $placementOk = AgencyPlacement::query()
                    ->whereKey($validated['placement_id'])
                    ->where('agency_id', $validated['agency_id'])
                    ->exists();
                if (! $placementOk) {
                    return response()->json([
                        'status' => self::_ERROR,
                        'message' => 'Placement does not belong to the selected agency.',
                    ], 422);
                }
            }

            $payment = $this->payments->create($validated);

            return response()->json(new AgencyMonthlyPaymentResource($payment), 201);
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
            Log::error('Error creating agency monthly payment: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function show(AgencyMonthlyPayment $agency_monthly_payment): JsonResponse
    {
        try {
            $this->authorize('view', $agency_monthly_payment);

            $agency_monthly_payment->load(['agency', 'placement', 'expense', 'creator', 'approver']);

            return response()->json(new AgencyMonthlyPaymentResource($agency_monthly_payment));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching agency monthly payment: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function update(Request $request, AgencyMonthlyPayment $agency_monthly_payment): JsonResponse
    {
        try {
            $this->authorize('update', $agency_monthly_payment);

            $validated = $request->validate([
                'amount_paid' => ['sometimes', 'numeric', 'min:0.01'],
                'worker_count' => ['sometimes', 'integer', 'min:1'],
                'placement_id' => ['nullable', 'integer', 'exists:agency_placements,id'],
                'reference' => ['nullable', 'string', 'max:255'],
                'notes' => ['nullable', 'string'],
            ]);

            if (array_key_exists('placement_id', $validated) && $validated['placement_id']) {
                $placementOk = AgencyPlacement::query()
                    ->whereKey($validated['placement_id'])
                    ->where('agency_id', $agency_monthly_payment->agency_id)
                    ->exists();
                if (! $placementOk) {
                    return response()->json([
                        'status' => self::_ERROR,
                        'message' => 'Placement does not belong to this payment\'s agency.',
                    ], 422);
                }
            }

            $payment = $this->payments->update($agency_monthly_payment, $validated);

            return response()->json(new AgencyMonthlyPaymentResource($payment));
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
            Log::error('Error updating agency monthly payment: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function markPaid(Request $request, AgencyMonthlyPayment $agency_monthly_payment): JsonResponse
    {
        try {
            $this->authorize('markPaid', $agency_monthly_payment);

            $validated = $request->validate([
                'pay_date' => ['required', 'date'],
                'link_expense' => ['sometimes', 'boolean'],
            ]);

            $payment = $this->payments->markPaid(
                $agency_monthly_payment,
                $validated['pay_date'],
                (int) Auth::id(),
                $validated['link_expense'] ?? true,
            );

            return response()->json(new AgencyMonthlyPaymentResource($payment));
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
            Log::error('Error marking agency payment paid: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function destroy(AgencyMonthlyPayment $agency_monthly_payment): JsonResponse
    {
        try {
            $this->authorize('delete', $agency_monthly_payment);

            $this->payments->delete($agency_monthly_payment);

            return response()->json(['status' => self::_SUCCESS, 'message' => 'Agency monthly payment deleted successfully.']);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error deleting agency monthly payment: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }
}
