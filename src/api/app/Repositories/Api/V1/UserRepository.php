<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class UserRepository
{
    /**
     * Get all users with optional pagination.
     * 
     * @param  int|null  $perPage
     * @return Collection|LengthAwarePaginator
     */
    public function all(?int $perPage = null): Collection|LengthAwarePaginator
    {
        if ($perPage) {
            return User::paginate($perPage);
        }

        return User::all();
    }

    /**
     * Get users by role with optional pagination.
     * 
     * @param  string  $role
     * @param  int|null  $perPage
     * @return Collection|LengthAwarePaginator
     */
    public function getByRole(string $role, ?int $perPage = null): Collection|LengthAwarePaginator
    {
        if ($perPage) {
            return User::where('role', $role)->paginate($perPage);
        }

        return User::where('role', $role)->get();
    }

    /**
     * Create new user.
     * 
     * @param  array<string, mixed>  $data
     * @return User
     */
    public function create(array $data): User
    {
        DB::beginTransaction();

        try {
            if (isset($data['id_file'])) {
                $path = $this->uploadIdFile($data['id_file']);
                $document = Document::create([
                    'file_path' => $path,
                    'file_name' => $data['id_file']->getClientOriginalName(),
                    'mime_type' => $data['id_file']->getClientMimeType(),
                    'file_size' => $data['id_file']->getSize(),
                    'category' => Controller::_DOCUMENT_TYPES[0] // 'id_files'
                ]);

                $data['id_file'] = $document->id;
            }

            $user = User::create($data);

            DB::commit();
            return $user;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to create user: '.$e->getMessage());
        }
    }

    /**
     * Update existing user.
     * 
     * @param  User  $user
     * @param  array<string, mixed>  $data
     * @return User
     */
    public function update(User $user, array $data): User
    {
        DB::beginTransaction();

        try {
            if (isset($data['id_file'])) {
                // Delete old file if exists
                if ($user->idFile->file_path && Storage::disk('public')->exists($user->idFile->file_path)) {
                    Storage::disk('public')->delete($user->idFile->file_path);
                    $user->idFile->delete();
                }

                $path = $this->uploadIdFile($data['id_file']);

                $document = Document::create([
                    'file_path' => $path,
                    'file_name' => $data['id_file']->getClientOriginalName(),
                    'mime_type' => $data['id_file']->getClientMimeType(),
                    'file_size' => $data['id_file']->getSize(),
                    'category' => Controller::_DOCUMENT_TYPES[0] // 'id_files'
                ]);

                $data['id_file'] = $document->id;

            }

            $user->update($data);

            DB::commit();
            return $user;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to update user: '.$e->getMessage());
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
     * Handle uploading ID file.
     *
     * @param UploadedFile|string $file
     * @return string
     */
    private function uploadIdFile($file): string
    {
        return $file->store(Controller::_DOCUMENT_TYPES[0], 'public');
    }
}
