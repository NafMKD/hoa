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
        $inParentTransaction = DB::transactionLevel() > 0;

        try {
            if (! $inParentTransaction) {
                DB::beginTransaction();
            }

            $storagePath = $file->store($category, 'public');

            $document = Document::create([
                'file_path' => $storagePath,
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
                'category' => $category,
            ]);

            if (! $inParentTransaction) {
                DB::commit();
            }

            return $document;
        } catch (Throwable $e) {
            if (! $inParentTransaction) {
                DB::rollBack();
            }
            Log::error("Document creation failed: " . $e->getMessage(), ['exception' => $e]);
            throw new RepositoryException("Failed to create document");
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

    /**
     * Create a document record from existing file path.
     * 
     * @param string $filePath
     * @param string $category
     * @return Document
     * @throws RepositoryException
     */
    public function createFromPath(string $filePath, string $category): Document
    {
        try {
            $fileName = basename($filePath);
            $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
            $fileSize = filesize($filePath) ?: 0;

            $document = Document::create([
                'file_path' => $filePath,
                'file_name' => $fileName,
                'mime_type' => $mimeType,
                'file_size' => $fileSize,
                'category' => $category,
            ]);

            return $document;
        } catch (Throwable $e) {
            Log::error("Document creation from path failed: " . $e->getMessage(), ['exception' => $e]);
            throw new RepositoryException("Failed to create document from path");
        }
    }
}