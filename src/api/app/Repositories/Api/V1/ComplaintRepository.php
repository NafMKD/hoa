<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\Document;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class ComplaintRepository
{
    public function __construct(
        protected DocumentRepository $documents
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = Complaint::query()
            ->with([
                'submitter',
                'assignee',
                'unit.building',
                'documents',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, UploadedFile>  $newFiles
     */
    public function create(array $data, array $newFiles = []): Complaint
    {
        DB::beginTransaction();

        try {
            $complaint = Complaint::create($data);

            foreach ($newFiles as $file) {
                if (! $file instanceof UploadedFile || ! $file->isValid()) {
                    continue;
                }
                $doc = $this->documents->create($file, Controller::_DOCUMENT_CATEGORY_COMPLAINT_ATTACHMENT);
                $complaint->documents()->attach($doc->id);
            }

            DB::commit();

            return $complaint->fresh(['submitter', 'assignee', 'unit.building', 'documents']);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to create complaint: '.$e->getMessage());
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, UploadedFile>  $newFiles
     * @param  array<int, int>  $removeDocumentIds
     */
    public function update(Complaint $complaint, array $data, array $newFiles = [], array $removeDocumentIds = []): Complaint
    {
        DB::beginTransaction();

        try {
            if ($data !== []) {
                $complaint->update($data);
            }

            foreach ($removeDocumentIds as $docId) {
                $docId = (int) $docId;
                if ($docId < 1) {
                    continue;
                }
                $stillLinked = $complaint->documents()->where('documents.id', $docId)->exists();
                if (! $stillLinked) {
                    continue;
                }
                $document = Document::query()->find($docId);
                if ($document) {
                    $complaint->documents()->detach($docId);
                    $this->documents->delete($document);
                }
            }

            foreach ($newFiles as $file) {
                if (! $file instanceof UploadedFile || ! $file->isValid()) {
                    continue;
                }
                $doc = $this->documents->create($file, Controller::_DOCUMENT_CATEGORY_COMPLAINT_ATTACHMENT);
                $complaint->documents()->attach($doc->id);
            }

            DB::commit();

            return $complaint->fresh(['submitter', 'assignee', 'unit.building', 'documents']);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to update complaint: '.$e->getMessage());
        }
    }

    public function delete(Complaint $complaint): void
    {
        DB::beginTransaction();

        try {
            $complaint->delete();
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to delete complaint: '.$e->getMessage());
        }
    }
}
