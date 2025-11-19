<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\UnitOwner;
use App\Models\Document;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;

class UnitOwnerRepository
{
    /**
     * Create a new unit owner.
     *
     * @param array<string, mixed> $data
     * @return UnitOwner
     * @throws RepositoryException
     */
    public function create(array $data): UnitOwner
    {
        DB::beginTransaction();

        try {
            // Handle ownership document upload
            if (isset($data['ownership_file']) && $data['ownership_file'] instanceof UploadedFile) {
                $data['ownership_file_id'] = $this->uploadOwnershipDocument($data['ownership_file']);
            }

            $owner = UnitOwner::create($data);

            DB::commit();
            return $owner;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to create unit owner.');
        }
    }

    /**
     * Soft delete a unit owner.
     *
     * @param UnitOwner $owner
     * @return bool|null
     * @throws RepositoryException
     */
    public function delete(UnitOwner $owner): ?bool
    {
        return DB::transaction(function () use ($owner) {
            // Delete ownership document if exists
            if ($owner->document && Storage::disk('public')->exists($owner->document->file_path)) {
                Storage::disk('public')->delete($owner->document->file_path);
                $owner->document->delete();
            }

            // Note: Soft delete the owner record
            return $owner->delete();
        });
    }

    /**
     * Upload the ownership document.
     *
     * @param UploadedFile $file
     * @return int
     */
    private function uploadOwnershipDocument(UploadedFile $file): int
    {
        $path = $file->store(Controller::_DOCUMENT_TYPES[1], 'public');

        $document = Document::create([
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'category'  => Controller::_DOCUMENT_TYPES[1],
            'created_by' => Auth::id(),
        ]);

        return $document->id;
    }

    /**
     * Deactivate a unit owner.
     * 
     * @param UnitOwner $owner
     * @return UnitOwner
     * @throws RepositoryException
     */
    public function deactivate(UnitOwner $owner): UnitOwner
    {
        DB::beginTransaction();

        try {
            if($owner->status !== 'active') {
                throw new RepositoryException('Only active unit owners can be deactivated.');
            }

            $owner->status = 'inactive';

            // change the end date to today
            if ($owner->end_date === null || $owner->end_date->isFuture()) {
                $owner->end_date = now();
            }

            // change unit status
            $unit = $owner->unit;
            if ($unit && $unit->status === Controller::_UNIT_STATUSES[1]) {
                $unit->status = Controller::_UNIT_STATUSES[2];
                $unit->save();
            }
            
            $owner->updated_by = Auth::id();
            $owner->save();

            DB::commit();
            return $owner;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to deactivate unit owner.');
        }
    }
}
