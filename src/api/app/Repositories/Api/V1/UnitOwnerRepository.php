<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\UnitOwner;
use App\Models\Document;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UnitOwnerRepository
{
    protected DocumentRepository $documentRepository;

    public function __construct(DocumentRepository $documentRepository)
    {
        $this->documentRepository = $documentRepository;
    }

    /**
     * Create a new unit owner.
     *
     * @param Unit $unit
     * @param array<string, mixed> $data
     * @return UnitOwner
     * @throws RepositoryException
     */
    public function create(unit $unit, array $data): UnitOwner
    {
        DB::beginTransaction();
        $document = null;
        try {
            // Handle ownership document upload
            if (isset($data['ownership_file']) && $data['ownership_file'] instanceof UploadedFile) {
                $document = $this->documentRepository->create(
                    $data['ownership_file'],
                    Controller::_DOCUMENT_TYPES[1], // ownership_files
                );

                $data['ownership_file_id'] = $document->id;
            }
            
            unset($data['ownership_file']);

            // Deactivate current owner if exists
            if ($unit->currentOwner) {
                if ($unit->currentOwner->user_id == $data['user_id'] && $unit->currentOwner->status === 'active') {
                    throw new RepositoryException('The specified user is already the active owner of this unit.');
                }
                $currentOwner = $unit->currentOwner;
                $deactivation = [
                    'status' => 'inactive',
                    'updated_by' => Auth::id(),
                ];
                if ($currentOwner->end_date === null || $currentOwner->end_date->isFuture()) {
                    $deactivation['end_date'] = now();
                }
                $currentOwner->update($deactivation);
                $currentOwner->save();
            }

            $owner = $unit->owners()->create($data);
            
            DB::commit();
            return $owner;
        } catch (\Throwable $e) {
            DB::rollBack();
            if ($document && Storage::disk('public')->exists($document->file_path)) {
                Storage::disk('public')->delete($document->file_path);
            }
            Log::error('Unit owner creation failed: ' . $e->getMessage());
            if ($e instanceof RepositoryException) throw $e;
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
            if ($owner->document) {
                $this->documentRepository->delete($owner->document);
            }

            // Note: Soft delete the owner record
            return $owner->delete();
        });
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
            Log::error('Unit owner deactivation failed: ' . $e->getMessage());
            throw new RepositoryException('Failed to deactivate unit owner.');
        }
    }
}
