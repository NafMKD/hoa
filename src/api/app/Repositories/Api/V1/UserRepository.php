<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UserRepository
{
    protected DocumentRepository $documentRepository;

    public function __construct(DocumentRepository $documentRepository)
    {
        $this->documentRepository = $documentRepository;
    }

    /**
     * Get all users with optional pagination.
     * 
     * @param  int|null  $perPage
     * @param  array  $filters
     * @return Collection|LengthAwarePaginator
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = User::query();

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
            });
        }

        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $query->orderBy('created_at', 'desc');

        return $perPage ? $query->paginate($perPage) : $query->get();;
    }

    /**
     * Search users by name or phone.
     * Additional filters can be added.
     * ['role', 'status']
     * 
     * @param  string  $term
     * @param  array  $filers
     * @return Collection
     */
    public function search(string $term, array $filers = []): Collection
    {
        $allowedRoles = array_slice(
            Controller::_ROLES, 
            -3 
        );

        $query = User::query()
            ->whereIn('role', $allowedRoles)
            ->where(function ($q) use ($term) {
                $q->where('first_name', 'like', "%{$term}%")
                  ->orWhere('last_name', 'like', "%{$term}%")
                  ->orWhere('phone', 'like', "%{$term}%")
                  ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$term}%"]);
            });

        // Apply additional filters if provided
        if (!empty($filers['role'])) {
            $query->where('role', $filers['role']);
        }

        if (!empty($filers['status'])) {
            $query->where('status', $filers['status']);
        }

        return $query->orderBy('first_name', 'asc')
                     ->orderBy('last_name', 'asc')
                     ->get();
    }

    /**
     * Get users by role for selection.
     * 
     * @param  string  $role
     * @return Collection
     */
    public function getUsersByRole(string $role): Collection
    {
        return User::query()
            ->where('role', $role)
            ->where('status', 'active')
            ->orderBy('first_name', 'asc')
            ->orderBy('last_name', 'asc')
            ->get();
    }

    /**
     * Get active users.
     * 
     * @return Collection
     */
    public function getActiveUsers(): Collection
    {
        return User::query()
            ->where('status', 'active')
            ->orderBy('first_name', 'asc')
            ->orderBy('last_name', 'asc')
            ->get();
    }

    /**
     * Create new user.
     * 
     * @param  array<string, mixed>  $data
     * @return User
     * @throws RepositoryException
     */
    public function create(array $data): User
    {
        // Detect if we're inside a parent transaction
        $inParentTransaction = DB::transactionLevel() > 0;

        try {
            if (! $inParentTransaction) {
                DB::beginTransaction();
            }

            if (isset($data['id_file'])) {
                $document = $this->documentRepository->create(
                    $data['id_file'],
                    Controller::_DOCUMENT_TYPES[0]
                );

                $data['id_file'] = $document->id;
            }

            $user = User::create($data);

            if (! $inParentTransaction) {
                DB::commit();
            }

            return $user;

        } catch (\Throwable $e) {

            if (! $inParentTransaction) {
                DB::rollBack();
            }

            Log::error("User creation failed: " . $e->getMessage());

            throw new RepositoryException('Failed to create user');
        }
    }

    /**
     * Update existing user.
     * 
     * @param  User  $user
     * @param  array<string, mixed>  $data
     * @return User
     * @throws RepositoryException
     */
    public function update(User $user, array $data): User
    {
        DB::beginTransaction();

        try {
            if (isset($data['id_file'])) {
                // delete old id_file if exist 
                if ($user->idFile) {
                    $this->documentRepository->delete($user->idFile);
                }

                $document = $this->documentRepository->create(
                    $data['id_file'],
                    Controller::_DOCUMENT_TYPES[0] // 'id_files'
                );

                $data['id_file'] = $document->id;
            }
            
            $user->update($data);

            DB::commit();
            return $user;
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('User update failed: ' . $e->getMessage());
            throw new RepositoryException('Failed to update user');
        }
    }

    /**
     * Soft delete a user.
     * 
     * @param  User  $user
     * @return bool|null
     */
    public function delete(User $user): ?bool
    {
        return DB::transaction(function () use ($user) {
            if ($user->idFile) {
                // Delete old file if exists
                if ($user->idFile->file_path && Storage::disk('public')->exists($user->idFile->file_path)) {
                    Storage::disk('public')->delete($user->idFile->file_path);
                }
                $user->idFile->delete();
            }
            // TODO: Unlink relationships (leases, payments, etc.) if necessary 
            return $user->delete();
        });
    }

    /**
     * Change user status.
     * 
     * @param  User  $user
     * @param  string  $status
     * @return User
     * @throws RepositoryException
     */
    public function changeStatus(User $user, string $status): User
    {
        if (!in_array($status, Controller::_USER_STATUSES)) {
            throw new RepositoryException('Invalid status provided.');
        }
        if ($user->status === $status) {
            return $user;
        }

        $user->status = $status;
        $user->save();

        return $user;
    }
}
