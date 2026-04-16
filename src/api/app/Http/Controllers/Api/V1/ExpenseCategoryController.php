<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ExpenseCategoryResource;
use App\Models\ExpenseCategory;
use App\Repositories\Api\V1\ExpenseCategoryRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ExpenseCategoryController extends Controller
{
    public function __construct(
        protected ExpenseCategoryRepository $expenseCategories
    ) {}

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', ExpenseCategory::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $search = $request->query('search');
            $filters = compact('search');

            $categories = $this->expenseCategories->all($perPage, $filters);

            return ExpenseCategoryResource::collection($categories);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error fetching expense categories: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function getAll(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', ExpenseCategory::class);

            $isActive = $request->query('is_active');
            $filters = ['is_active' => $isActive];

            $categories = $this->expenseCategories->getAll($filters);

            return ExpenseCategoryResource::collection($categories);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error fetching expense categories: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', ExpenseCategory::class);

            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'code' => ['required', 'string', 'max:64', 'regex:/^[a-z0-9_\-]+$/', Rule::unique('expense_categories', 'code')],
                'parent_id' => ['nullable', 'integer', 'exists:expense_categories,id'],
                'sort_order' => ['nullable', 'integer', 'min:0'],
                'is_active' => ['nullable', 'boolean'],
            ]);

            $category = $this->expenseCategories->create($validated);

            return response()->json(new ExpenseCategoryResource($category), 201);
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
            Log::error('Error creating expense category: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function show(ExpenseCategory $expenseCategory): JsonResponse
    {
        try {
            $this->authorize('view', $expenseCategory);

            return response()->json(new ExpenseCategoryResource($expenseCategory));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching expense category: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function update(Request $request, ExpenseCategory $expenseCategory): JsonResponse
    {
        try {
            $this->authorize('update', $expenseCategory);

            $validated = $request->validate([
                'name' => ['sometimes', 'string', 'max:255'],
                'code' => ['sometimes', 'string', 'max:64', 'regex:/^[a-z0-9_\-]+$/', Rule::unique('expense_categories', 'code')->ignore($expenseCategory->id)],
                'parent_id' => ['nullable', 'integer', 'exists:expense_categories,id'],
                'sort_order' => ['nullable', 'integer', 'min:0'],
                'is_active' => ['nullable', 'boolean'],
            ]);

            if (! empty($validated['parent_id']) && (int) $validated['parent_id'] === (int) $expenseCategory->id) {
                return response()->json(['status' => self::_ERROR, 'message' => 'Category cannot be its own parent.'], 422);
            }

            $category = $this->expenseCategories->update($expenseCategory, $validated);

            return response()->json(new ExpenseCategoryResource($category));
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
            Log::error('Error updating expense category: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function destroy(ExpenseCategory $expenseCategory): JsonResponse
    {
        try {
            $this->authorize('delete', $expenseCategory);

            $this->expenseCategories->delete($expenseCategory);

            return response()->json(['status' => self::_SUCCESS, 'message' => 'Expense category deleted successfully.']);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Error deleting expense category: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }
}
