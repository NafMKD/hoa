<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ExpenseResource;
use App\Models\Expense;
use App\Repositories\Api\V1\ExpenseRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ExpenseController extends Controller
{
    public function __construct(
        protected ExpenseRepository $expenses
    ) {}

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', Expense::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $search = $request->query('search');
            $expenseCategoryId = $request->query('expense_category_id');
            $vendorId = $request->query('vendor_id');
            $status = $request->query('status');
            $createdBy = $request->query('created_by');
            $expenseDateFrom = $request->query('expense_date_from');
            $expenseDateTo = $request->query('expense_date_to');

            $filters = array_filter([
                'search' => $search,
                'expense_category_id' => $expenseCategoryId,
                'vendor_id' => $vendorId,
                'status' => $status,
                'created_by' => $createdBy,
                'expense_date_from' => $expenseDateFrom,
                'expense_date_to' => $expenseDateTo,
            ], fn ($v) => $v !== null && $v !== '');

            $expenses = $this->expenses->all($perPage, $filters);

            return ExpenseResource::collection($expenses);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error fetching expenses: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', Expense::class);

            $validated = $request->validate([
                'expense_category_id' => ['required', 'integer', 'exists:expense_categories,id'],
                'vendor_id' => ['nullable', 'integer', 'exists:vendors,id'],
                'description' => ['required', 'string'],
                'amount' => ['required', 'numeric', 'min:0.01'],
                'invoice_number' => ['nullable', 'string', 'max:255'],
                'status' => ['required', 'string', Rule::in(self::_EXPENSE_STATUSES)],
                'expense_date' => ['required', 'date'],
            ]);

            $validated['created_by'] = Auth::id();

            $expense = $this->expenses->create($validated);

            return response()->json(new ExpenseResource($expense), 201);
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
            Log::error('Error creating expense: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function show(Expense $expense): JsonResponse
    {
        try {
            $this->authorize('view', $expense);

            $expense->load(['category', 'vendor', 'creator']);

            return response()->json(new ExpenseResource($expense));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching expense: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        try {
            $this->authorize('update', $expense);

            $validated = $request->validate([
                'expense_category_id' => ['sometimes', 'integer', 'exists:expense_categories,id'],
                'vendor_id' => ['nullable', 'integer', 'exists:vendors,id'],
                'description' => ['sometimes', 'string'],
                'amount' => ['sometimes', 'numeric', 'min:0.01'],
                'invoice_number' => ['nullable', 'string', 'max:255'],
                'status' => ['sometimes', 'string', Rule::in(self::_EXPENSE_STATUSES)],
                'expense_date' => ['sometimes', 'date'],
            ]);

            $expense = $this->expenses->update($expense, $validated);

            return response()->json(new ExpenseResource($expense));
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
            Log::error('Error updating expense: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function destroy(Expense $expense): JsonResponse
    {
        try {
            $this->authorize('delete', $expense);

            $this->expenses->delete($expense);

            return response()->json(['status' => self::_SUCCESS, 'message' => 'Expense deleted successfully.']);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error deleting expense: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }
}
