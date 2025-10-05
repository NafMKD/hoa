<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\TenantLease;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use App\Models\Document;
use Illuminate\Support\Facades\Auth;

class TenantLeaseRepository
{
    protected DocumentTemplateRepository $templates;

    public function __construct(DocumentTemplateRepository $templates)
    {
        $this->templates = $templates;
    }

    /**
     * Get all tenant leases with optional pagination.
     * 
     * @param int|null $perPage
     * @return Collection|LengthAwarePaginator
     */
    public function all(?int $perPage = null): Collection|LengthAwarePaginator
    {
        if ($perPage) {
            return TenantLease::paginate($perPage);
        }

        return TenantLease::all();
    }

    /**
     * Create a new tenant lease.
     * 
     * @param array<string, mixed> $data
     * @return TenantLease
     */
    public function create(array $data): TenantLease
    {
        DB::beginTransaction();

        try {
            // check if active lease exists for the same tenant or unit
            $existingLease = TenantLease::where(function ($query) use ($data) {
                $query->where('tenant_id', $data['tenant_id'])
                      ->orWhere('unit_id', $data['unit_id']);
            })->where('status', 'active')->first();

            if ($existingLease) {
                throw new RepositoryException('An active lease already exists for the same tenant or unit.');
            }

            // Handle representative document upload
            if (isset($data['representative_document']) && $data['representative_document'] instanceof UploadedFile) {
                $data['representative_document_id'] = $this->uploadRepresentativeDocument($data['representative_document']);
            }

            // Create the lease
            $lease = TenantLease::create($data);

            // If lease template assigned, generate lease document
            if (!empty($data['lease_template_id']) && !empty($data['placeholders'])) {
                $lease = $this->generateLeaseDocument($lease, $data['placeholders']);
            }

            // update unit status
            $unit = $lease->unit;
            if ($unit) {
                $unit->status = Controller::_UNIT_STATUSES[0];
                $unit->save();
            }

            DB::commit();
            return $lease;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to create tenant lease: ' . $e->getMessage());
        }
    }

    /**
     * Update an existing tenant lease.
     * 
     * @param TenantLease $lease
     * @param array<string, mixed> $data
     * @return TenantLease
     * @throws RepositoryException
     */
    public function update(TenantLease $lease, array $data): TenantLease
    {
        DB::beginTransaction();

        try {
            // Handle representative document replacement
            if (isset($data['representative_document']) && $data['representative_document'] instanceof UploadedFile) {
                if ($lease->representativeDocument && Storage::disk('public')->exists($lease->representativeDocument->file_path)) {
                    Storage::disk('public')->delete($lease->representativeDocument->file_path);
                    $lease->representativeDocument->delete();
                }

                $data['representative_document_id'] = $this->uploadRepresentativeDocument($data['representative_document']);
            }

            $lease->update($data);

            DB::commit();
            return $lease;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to update tenant lease: ' . $e->getMessage());
        }
    }

    /**
     * Soft delete a tenant lease.
     * 
     * @param TenantLease $lease
     * @return bool|null
     */
    public function delete(TenantLease $lease): ?bool
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
     * @param TenantLease $lease
     * @param array<string, string> $placeholderData
     * @return TenantLease
     * @throws RepositoryException
     */
    private function generateLeaseDocument(TenantLease $lease, array $placeholderData): TenantLease
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
     * Deactivate expired leases.
     * 
     * @return int Number of leases deactivated
     * @throws RepositoryException
     */
    public function deactivateExpiredLeases(): int
    {
        try {
            $now = now();
            $expiredLeases = TenantLease::where('status', 'active')
                ->where('end_date', '<', $now)
                ->get();

            foreach ($expiredLeases as $lease) {
                $lease->status = 'expired';
                $lease->save();
            }

            return $expiredLeases->count();
        } catch (\Throwable $e) {
            throw new RepositoryException('Failed to deactivate expired leases: ' . $e->getMessage());
        }
    }

    /**
     * Terminate a lease by ID.
     * 
     * @param int $leaseId
     * @return TenantLease
     * @throws RepositoryException
     */
    public function terminateLeaseById(int $leaseId): TenantLease
    {
        DB::beginTransaction();

        try {
            $lease = TenantLease::findOrFail($leaseId);

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

            DB::commit();
            return $lease;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to terminate lease: ' . $e->getMessage());
        }
    }
    
}
