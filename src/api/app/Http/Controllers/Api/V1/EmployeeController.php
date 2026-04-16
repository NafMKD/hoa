<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\EmployeeResource;
use App\Models\Employee;
use App\Repositories\Api\V1\EmployeeRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EmployeeController extends Controller
{
    public function __construct(
        protected EmployeeRepository $employees,
    ) {}

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', Employee::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $search = $request->query('search');
            $role = $request->query('role');
            $filters = array_filter(compact('search', 'role'), fn ($v) => $v !== null && $v !== '');

            $list = $this->employees->all($perPage, $filters);

            return EmployeeResource::collection($list);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching employees: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function getAll(): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', Employee::class);

            return EmployeeResource::collection($this->employees->getAll());
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching employees: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', Employee::class);

            $validated = $request->validate([
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'role' => ['required', 'string', Rule::in(['maintenance', 'security', 'cleaning', 'accountant', 'secretary', 'other'])],
                'employment_type' => ['required', 'string', Rule::in(['permanent', 'contract', 'hourly'])],
                'gross_salary' => ['required', 'numeric', 'min:0'],
                'bank_account_encrypted' => ['nullable', 'string'],
                'hired_at' => ['nullable', 'date'],
                'terminated_at' => ['nullable', 'date', 'after_or_equal:hired_at'],
            ]);

            $employee = $this->employees->create($validated);

            return response()->json(new EmployeeResource($employee), 201);
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
            Log::error('Error creating employee: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function show(Employee $employee): JsonResponse
    {
        try {
            $this->authorize('view', $employee);

            return response()->json(new EmployeeResource($employee));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error fetching employee: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function update(Request $request, Employee $employee): JsonResponse
    {
        try {
            $this->authorize('update', $employee);

            $validated = $request->validate([
                'first_name' => ['sometimes', 'string', 'max:255'],
                'last_name' => ['sometimes', 'string', 'max:255'],
                'role' => ['sometimes', 'string', Rule::in(['maintenance', 'security', 'cleaning', 'accountant', 'secretary', 'other'])],
                'employment_type' => ['sometimes', 'string', Rule::in(['permanent', 'contract', 'hourly'])],
                'gross_salary' => ['sometimes', 'numeric', 'min:0'],
                'bank_account_encrypted' => ['nullable', 'string'],
                'hired_at' => ['nullable', 'date'],
                'terminated_at' => ['nullable', 'date', 'after_or_equal:hired_at'],
            ]);

            $employee = $this->employees->update($employee, $validated);

            return response()->json(new EmployeeResource($employee));
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
            Log::error('Error updating employee: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function destroy(Employee $employee): JsonResponse
    {
        try {
            $this->authorize('delete', $employee);

            $this->employees->delete($employee);

            return response()->json(['status' => self::_SUCCESS, 'message' => 'Employee deleted successfully.']);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error deleting employee: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }
}
