<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\UnitLease;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use App\Models\Document;
use Illuminate\Support\Facades\Auth;

class UnitLeaseRepository
{
    protected DocumentTemplateRepository $templates;

    public function __construct(DocumentTemplateRepository $templates)
    {
        $this->templates = $templates;
    }

    /**
     * Create a new unit lease.
     * 
     * @param array<string, mixed> $data
     * @return UnitLease
     */
    public function create(array $data): UnitLease
    {
        DB::beginTransaction();

        try {
            // Handle representative document upload
            if (isset($data['representative_document']) && $data['representative_document'] instanceof UploadedFile) {
                $data['representative_document_id'] = $this->uploadRepresentativeDocument($data['representative_document']);
            }

            // Create the lease
            $lease = UnitLease::create($data);

            DB::commit();
            return $lease;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to create unit lease ');
        }
    }

    /**
     * Soft delete a unit lease.
     * 
     * @param UnitLease $lease
     * @return bool|null
     */
    public function delete(UnitLease $lease): ?bool
    {
        return DB::transaction(function () use ($lease) {
            // Delete representative document if exists
            if ($lease->representativeDocument && Storage::disk('public')->exists($lease->representativeDocument->file_path)) {
                Storage::disk('public')->delete($lease->representativeDocument->file_path);
                $lease->representativeDocument->delete();
            }
            // Note: Lease document is not deleted to preserve records

            return $lease->delete();
        });
    }

    /**
     * Upload the representative's document.
     * 
     * @param UploadedFile $file
     * @return int
     */
    private function uploadRepresentativeDocument(UploadedFile $file): int
    {
        $path = $file->store(Controller::_DOCUMENT_TYPES[7], 'public');

        $document = Document::create([
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'category'  => Controller::_DOCUMENT_TYPES[7],
        ]);

        return $document->id;
    }

    /**
     * Generate the lease document from the template and save it as a Document.
     *
     * @param UnitLease $lease
     * @param array<string, string> $placeholderData
     * @return UnitLease
     * @throws RepositoryException
     */
    private function generateLeaseDocument(UnitLease $lease, array $placeholderData): UnitLease
    {
        if (!$lease->leaseTemplate) {
            throw new RepositoryException('Lease template not assigned.');
        }

        // Ensure only allowed placeholders are used
        $allowedPlaceholders = $lease->leaseTemplate->placeholders;
        $data = [];
        foreach ($allowedPlaceholders as $key) {
            $data[$key] = $placeholderData[$key] ?? '';
        }

        // Generate PDF via template repository
        $path = $this->templates->generate($lease->leaseTemplate, $data);

        // Save generated document
        $document = Document::create([
            'file_name' => basename($path),
            'file_path' => $path,
            'mime_type' => 'application/pdf',
            'file_size' => Storage::disk('public')->size($path),
            'category'  => 'lease_document',
            'created_by' => Auth::id(),
        ]);

        // Update lease with generated document
        $lease->lease_document_id = $document->id;
        $lease->save();

        return $lease->fresh();
    }

    /**
     * Activate draft lease by ID.
     * 
     * @param UnitLease $lease
     * @return UnitLease
     */
    public function activateDraftLease(UnitLease $lease): UnitLease
    {
        DB::beginTransaction();

        try {
            if ($lease->status !== 'draft') {
                throw new RepositoryException('Only draft leases can be activated.');
            }

            $lease->status = 'active';

            // update unit status
            $unit = $lease->unit;
            if ($unit) {
                $unit->status = Controller::_UNIT_STATUSES[0];
                $unit->save();
            }
            $lease->updated_by = Auth::id();

            $lease->save();

            DB::commit();
            return $lease;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to activate draft lease');
        }
    }

    /**
     * Deactivate expired leases.
     * 
     * @return int Number of leases deactivated
     * @throws RepositoryException
     */
    public function deactivateExpiredLeases(): int
    {
        DB::beginTransaction();
        try {
            $now = now();
            $expiredLeases = UnitLease::where('status', 'active')
                ->where('end_date', '<', $now)
                ->get();

            foreach ($expiredLeases as $lease) {
                $lease->status = 'expired';
                $lease->updated_by = Auth::id();
                $lease->save();

                $unit = $lease->unit;
                if ($unit && $unit->status === Controller::_UNIT_STATUSES[0]) {
                    $unit->status = Controller::_UNIT_STATUSES[2];
                    $unit->save();
                }
            }

            DB::commit();
            return $expiredLeases->count();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to deactivate expired leases ');
        }
    }

    /**
     * Terminate a lease by ID.
     * 
     * @param UnitLease $lease
     * @return UnitLease
     * @throws RepositoryException
     */
    public function terminateLeaseById(UnitLease $lease): UnitLease
    {
        DB::beginTransaction();

        try {
            if ($lease->status !== 'active') {
                throw new RepositoryException('Only active leases can be terminated.');
            }

            $lease->status = 'terminated';
            if ($lease->lease_end_date === null) {
                $lease->lease_end_date = now();
            }
            $lease->save();

            // update unit status
            $unit = $lease->unit;
            if ($unit) {
                $unit->status = Controller::_UNIT_STATUSES[2];
                $unit->save();
            }

            $lease->updated_by = Auth::id();

            DB::commit();
            return $lease;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to terminate lease ');
        }
    }
    
}
