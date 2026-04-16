<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PayrollResource;
use App\Models\Payroll;
use App\Repositories\Api\V1\PayrollRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PayrollController extends Controller
{
    public function __construct(
        protected PayrollRepository $payrolls,
    ) {}

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', Payroll::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $filters = [];
            if ($request->filled('employee_id')) {
                $filters['employee_id'] = $request->query('employee_id');
            }
            if ($request->filled('status')) {
                $filters['status'] = $request->query('status');
            }
            if ($request->filled('search')) {
                $filters['search'] = $request->query('search');
            }

            $list = $this->payrolls->all($perPage, $filters);

            return PayrollResource::collection($list);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching payrolls: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', Payroll::class);

            $validated = $request->validate([
                'employee_id' => ['required', 'integer', 'exists:employees,id'],
                'payroll_period_start' => ['required', 'date'],
                'payroll_period_end' => ['required', 'date', 'after_or_equal:payroll_period_start'],
                'gross_salary' => ['required', 'numeric', 'min:0'],
                'taxes' => ['required', 'numeric', 'min:0'],
                'deductions' => ['required', 'numeric', 'min:0'],
                'net_salary' => ['required', 'numeric', 'min:0'],
                'payslip' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:'.self::_MAX_FILE_SIZE],
            ]);

            $validated['status'] = self::_PAYROLL_STATUSES[0];
            $validated['created_by'] = Auth::id();

            if ($request->hasFile('payslip')) {
                $validated['payslip'] = $request->file('payslip');
            }

            $payroll = $this->payrolls->create($validated);

            return response()->json(new PayrollResource($payroll), 201);
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
            Log::error('Error creating payroll: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function show(Payroll $payroll): JsonResponse
    {
        try {
            $this->authorize('view', $payroll);

            $payroll->load(['employee', 'payslip', 'expense', 'creator', 'approver']);

            return response()->json(new PayrollResource($payroll));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching payroll: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function update(Request $request, Payroll $payroll): JsonResponse
    {
        try {
            $this->authorize('update', $payroll);

            $validated = $request->validate([
                'payroll_period_start' => ['sometimes', 'date'],
                'payroll_period_end' => ['sometimes', 'date', 'after_or_equal:payroll_period_start'],
                'gross_salary' => ['sometimes', 'numeric', 'min:0'],
                'taxes' => ['sometimes', 'numeric', 'min:0'],
                'deductions' => ['sometimes', 'numeric', 'min:0'],
                'net_salary' => ['sometimes', 'numeric', 'min:0'],
                'payslip' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:'.self::_MAX_FILE_SIZE],
            ]);

            if ($request->hasFile('payslip')) {
                $validated['payslip'] = $request->file('payslip');
            }

            $payroll = $this->payrolls->update($payroll, $validated);
            $payroll->load(['employee', 'payslip', 'expense', 'creator', 'approver']);

            return response()->json(new PayrollResource($payroll));
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
            Log::error('Error updating payroll: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function generateDirect(Request $request): JsonResponse
    {
        try {
            $this->authorize('generate', Payroll::class);

            $validated = $request->validate([
                'year' => ['required', 'integer', 'min:2000', 'max:2100'],
                'month' => ['required', 'integer', 'min:1', 'max:12'],
                'employee_ids' => ['required', 'array', 'min:1'],
                'employee_ids.*' => ['integer', 'exists:employees,id'],
            ]);

            $created = $this->payrolls->generateDirectForMonth(
                $validated['year'],
                $validated['month'],
                $validated['employee_ids'],
                (int) Auth::id()
            );

            return response()->json(PayrollResource::collection($created), 201);
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
            Log::error('Error generating payrolls: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function submitReview(Payroll $payroll): JsonResponse
    {
        try {
            $this->authorize('submitForReview', $payroll);

            $payroll = $this->payrolls->submitForReview($payroll);

            return response()->json(new PayrollResource($payroll->load(['employee', 'payslip', 'expense', 'creator', 'approver'])));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error submitting payroll: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function approve(Payroll $payroll): JsonResponse
    {
        try {
            $this->authorize('approve', $payroll);

            $payroll = $this->payrolls->approve($payroll, (int) Auth::id());

            return response()->json(new PayrollResource($payroll->load(['employee', 'payslip', 'expense', 'creator', 'approver'])));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error approving payroll: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function markPaid(Request $request, Payroll $payroll): JsonResponse
    {
        try {
            $this->authorize('markPaid', $payroll);

            $validated = $request->validate([
                'pay_date' => ['required', 'date'],
                'payslip' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:'.self::_MAX_FILE_SIZE],
                'link_expense' => ['sometimes', 'boolean'],
            ]);

            $payroll = $this->payrolls->markPaid(
                $payroll,
                $validated['pay_date'],
                $request->file('payslip'),
                (int) Auth::id(),
                $validated['link_expense'] ?? true,
            );

            return response()->json(new PayrollResource($payroll));
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
            Log::error('Error marking payroll paid: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function destroy(Payroll $payroll): JsonResponse
    {
        try {
            $this->authorize('delete', $payroll);

            $this->payrolls->delete($payroll);

            return response()->json(['status' => self::_SUCCESS, 'message' => 'Payroll deleted successfully.']);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error deleting payroll: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }
}

