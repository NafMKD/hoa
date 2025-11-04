<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use App\Repositories\Api\V1\UserRepository;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    protected UserRepository $users;

    /**
     * UserController constructor.
     * 
     * @param  UserRepository  $users
     */
    public function __construct(UserRepository $users)
    {
        $this->users = $users;
    }

    /**
     * Display a listing of users.
     * 
     * @param  Request  $request
     * @return AnonymousResourceCollection|JsonResponse
     */
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', User::class);
            $perPage = $request->query('per_page') ?? self::_DEFAULT_PAGINATION;
            $search = $request->query('search');
            $role = $request->query('role');
            $status = $request->query('status');

            $filters = compact('search', 'role', 'status');

            $users = $this->users->all($perPage, $filters);
    
            return UserResource::collection($users);
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED
            ], 403);
        }
    }

    /**
     * Get all users by role
     * 
     * @param  Request  $request
     * @return JsonResponse
     */
    public function getUsersByRole(Request $request): JsonResponse
    {
        try {
            Validator::validate($request->all(), [
                'role' => ['required', 'string', Rule::in(self::_ROLES)],
                'per_page' => ['sometimes', 'integer', 'min:1']
            ]);

            $role = $request->query('role');
            $this->authorize('viewByRole', [User::class, $role]);
            $perPage = $request->query('per_page') ?? self::_DEFAULT_PAGINATION;
    
            $users = $this->users->getByRole($role, $perPage);
    
            return response()->json(UserResource::collection($users));
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED
            ], 403);
        }
    }

    /**
     * Change user status (activate/inactive/suspend).
     * 
     * @param  Request  $request
     * @param  User  $user
     * @return JsonResponse
     */
    public function changeStatus(Request $request, User $user): JsonResponse
    {
        try {
            $data = $request->validate([
                'status'  => ['required', 'string', Rule::in(self::_USER_STATUSES)],
            ]);

            $this->authorize('changeStatus', User::class);

            $user = $this->users->changeStatus($user, $data['status']);

            return response()->json(new UserResource($user));
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED
            ], 403);
        }
    }

    /**
     * Store a newly created user.
     * 
     * @param  Request  $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', User::class);
            $data = $request->validate([
                'first_name' => ['required', 'string', 'max:255'],
                'last_name'  => ['required', 'string', 'max:255'],
                'phone'      => [
                    'required',
                    'string',
                    'regex:/^0\d{9}$/', 
                    'unique:users,phone',
                ],  
                'email'      => ['nullable', 'email', 'unique:users,email'],
                'password'   => ['nullable', 'string', 'min:8'],
                'role'       => ['required', 'string', Rule::in(self::_ROLES)],
                'id_file'    => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:'.self::_MAX_FILE_SIZE], 
            ]);

            // if password is not provided, generate a random one
            if (empty($data['password'])) {
                $data['password'] = self::_DEFAULT_PASSWORD; 
            }
    
            $user = $this->users->create($data);
    
            return response()->json(new UserResource($user), 201);
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED
            ], 403);
        }
    }

    /**
     * Display the specified user.
     * 
     * @param  User $user
     * @return JsonResponse
     */
    public function show(User $user): JsonResponse
    {
        try {
            $this->authorize('view', [User::class, $user]); 

            $user->load(['idFile', 'ownedUnits', 'rentedUnits', 'leases', 'createdLeases', 'createdTemplates', 'updatedTemplates', 'representativeLeases']);
    
            return response()->json(new UserResource($user));
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED
            ], 403);
        }
    }

    /**
     * Update the specified user.
     * 
     * @param  Request  $request
     * @param  User $user
     * @return JsonResponse
     */
    public function update(Request $request, User $user): JsonResponse
    {
        try {
            $this->authorize('update', [User::class, $user]);
    
            $data = $request->validate([
                'first_name' => ['sometimes', 'string', 'max:255'],
                'last_name'  => ['sometimes', 'string', 'max:255'],
                'phone'      => ['sometimes', 'string', 'max:20', Rule::unique('users')->ignore($user->id)],
                'email'      => ['nullable', 'email', Rule::unique('users')->ignore($user->id)],
                'password'   => ['sometimes', 'string', 'min:8'],
                'role'       => ['sometimes', 'string', Rule::in(self::_ROLES)],
                'id_file'    => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:'.self::_MAX_FILE_SIZE],
            ]);
    
            $updated = $this->users->update($user, $data);
    
            return response()->json(new UserResource($updated));
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED
            ], 403);
        }
    }

    /**
     * Remove the specified user (soft delete).
     * 
     * @param  User $user
     * @return JsonResponse
     */
    public function destroy(User $user): JsonResponse
    {
        try {
            $this->authorize('delete', User::class);
    
            $this->users->delete($user);
    
            return response()->json([
                'status' => self::_SUCCESS,
                'message' => 'User deleted successfully'
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED
            ], 403);
        }
    }
}