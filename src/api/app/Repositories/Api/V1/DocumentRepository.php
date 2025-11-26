<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class DocumentRepository
{
    /**
     * Uploads a file to storage and creates a corresponding Document record.
     *
     * @param UploadedFile $file 
     * @param string $category 
     * @return Document
     * @throws RepositoryException
     */
    public function create(UploadedFile $file, string $category): Document
    {
        DB::beginTransaction();
        try {
            // 1. Upload file to public storage
            $storagePath = $file->store($category, 'public');

            // 2. Create the Document record
            $document = Document::create([
                'file_path' => $storagePath,
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
                'category' => $category
            ]);

            DB::commit();
            return $document;

        } catch (Throwable $e) {
            DB::rollBack();
            Log::error("Document creation failed for category '{$category}': " . $e->getMessage());

            if (isset($storagePath) && Storage::disk('public')->exists($storagePath)) {
                Storage::disk('public')->delete($storagePath);
            }

            throw new RepositoryException('Failed to create document and upload file.');
        }
    }

    /**
     * Deletes a Document model record and the associated file from storage.
     *
     * @param Document $document 
     * @return bool|null 
     */
    public function delete(Document $document): ?bool
    {
        return DB::transaction(function () use ($document) {
            $filePath = $document->file_path;

            // 1. Delete file from storage if it exists
            if ($filePath && Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }

            // 2. Delete the Document record (using model's delete method, which is soft delete if enabled)
            return $document->delete();
        });
    }
}