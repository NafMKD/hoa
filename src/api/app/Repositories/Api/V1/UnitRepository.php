<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use App\Models\Document;

class UnitRepository
{
    /**
     * Get all units with optional pagination.
     * 
     * @param  int|null  $perPage
     * @return Collection|LengthAwarePaginator
     */
    public function all(?int $perPage = null): Collection|LengthAwarePaginator
    {
        if ($perPage) {
            return Unit::paginate($perPage);
        }

        return Unit::all();
    }

    /**
     * Create a new unit.
     * 
     * @param array<string, mixed> $data
     * @return Unit
     */
    public function create(array $data): Unit
    {
        DB::beginTransaction();

        try {
            if (isset($data['ownership_file_id']) && $data['ownership_file_id'] instanceof UploadedFile) {
                $data['ownership_file_id'] = $this->uploadOwnershipFile($data['ownership_file_id']);
            }

            if (!isset($data['status'])) {
                $data['status'] = 'owner_occupied';
            }

            $unit = Unit::create($data);

            DB::commit();
            return $unit;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to create unit: ' . $e->getMessage());
        }
    }

    /**
     * Update an existing unit.
     * 
     * @param Unit $unit
     * @param array<string, mixed> $data
     * @return Unit
     */
    public function update(Unit $unit, array $data): Unit
    {
        DB::beginTransaction();

        try {
            if (isset($data['ownership_file_id']) && $data['ownership_file_id'] instanceof UploadedFile) {
                // Delete old ownership file
                if ($unit->ownershipFile && Storage::disk('public')->exists($unit->ownershipFile->file_path)) {
                    Storage::disk('public')->delete($unit->ownershipFile->file_path);
                    $unit->ownershipFile->delete();
                }

                $data['ownership_file_id'] = $this->uploadOwnershipFile($data['ownership_file_id']);
            }

            $unit->update($data);

            DB::commit();
            return $unit;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to update unit: ' . $e->getMessage());
        }
    }

    /**
     * Soft delete a unit.
     * 
     * @param Unit $unit
     * @return bool|null
     */
    public function delete(Unit $unit): ?bool
    {
        return DB::transaction(function () use ($unit) {
            // Delete ownership file if exists
            if ($unit->ownershipFile && Storage::disk('public')->exists($unit->ownershipFile->file_path)) {
                Storage::disk('public')->delete($unit->ownershipFile->file_path);
                $unit->ownershipFile->delete();
            }

            // TODO: Handle related entities (e.g., leases, tenants) 

            return $unit->delete();
        });
    }

    /**
     * Handle uploading the ownership file.
     * 
     * @param UploadedFile $file
     * @return int
     */
    private function uploadOwnershipFile(UploadedFile $file): int
    {
        $path = $file->store(Controller::_DOCUMENT_TYPES[1], 'public');

        $document = Document::create([
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'category'  => Controller::_DOCUMENT_TYPES[1],
        ]);

        return $document->id;
    }
}
