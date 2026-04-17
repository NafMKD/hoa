<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\LetterCounter;
use App\Models\OutgoingLetter;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class OutgoingLetterRepository
{
    public function __construct(
        protected DocumentRepository $documents
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = OutgoingLetter::query()
            ->with(['unit.building', 'creator', 'scannedDocument'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('letter_number', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('recipient_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * Optional scan is stored with {@see DocumentRepository::create}.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?UploadedFile $scan = null): OutgoingLetter
    {
        return DB::transaction(function () use ($data, $scan) {
            $letterNumber = $this->allocateNextLetterNumberWithinTransaction();

            $docId = null;
            if ($scan instanceof UploadedFile && $scan->isValid()) {
                $document = $this->documents->create($scan, Controller::_DOCUMENT_CATEGORY_OUTGOING_LETTER_SCAN);
                $docId = $document->id;
            }

            $letter = OutgoingLetter::create([
                'letter_number' => $letterNumber,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'unit_id' => $data['unit_id'] ?? null,
                'recipient_name' => $data['recipient_name'] ?? null,
                'scanned_document_id' => $docId,
                'created_by' => $data['created_by'],
            ]);

            return $letter->fresh(['unit.building', 'creator', 'scannedDocument']);
        });
    }

    /**
     * Must run inside an outer DB::transaction (caller provides).
     */
    private function allocateNextLetterNumberWithinTransaction(): string
    {
        $ym = now()->format('Y-m');

        $counter = LetterCounter::query()
            ->where('year_month', $ym)
            ->lockForUpdate()
            ->first();

        if ($counter === null) {
            try {
                LetterCounter::query()->create([
                    'year_month' => $ym,
                    'last_sequence' => 0,
                ]);
            } catch (QueryException) {
                // Concurrent insert for the same month — row now exists.
            }
            $counter = LetterCounter::query()
                ->where('year_month', $ym)
                ->lockForUpdate()
                ->first();
        }

        if ($counter === null) {
            throw new RepositoryException('Failed to allocate letter counter.');
        }

        $seq = $counter->last_sequence + 1;
        $counter->update(['last_sequence' => $seq]);

        $mm = now()->format('m');
        $yy = now()->format('y');

        return sprintf('NG/%s%s/%04d', $mm, $yy, $seq);
    }

    /**
     * Scans are stored via {@see DocumentRepository::create} / {@see DocumentRepository::delete} only.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(OutgoingLetter $letter, array $data, ?UploadedFile $scan = null): OutgoingLetter
    {
        return DB::transaction(function () use ($letter, $data, $scan) {
            if ($scan instanceof UploadedFile && $scan->isValid()) {
                $old = $letter->scanned_document_id
                    ? Document::query()->find($letter->scanned_document_id)
                    : null;

                $document = $this->documents->create($scan, Controller::_DOCUMENT_CATEGORY_OUTGOING_LETTER_SCAN);
                $data['scanned_document_id'] = $document->id;

                if ($old) {
                    $this->documents->delete($old);
                }
            }

            $letter->update($data);

            return $letter->fresh(['unit.building', 'creator', 'scannedDocument']);
        });
    }

    public function delete(OutgoingLetter $letter): void
    {
        DB::beginTransaction();

        try {
            $letter->delete();
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to delete outgoing letter: '.$e->getMessage());
        }
    }
}
