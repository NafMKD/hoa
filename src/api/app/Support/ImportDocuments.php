<?php

namespace App\Support;

use App\Models\Document;

class ImportDocuments
{
    public static function ownershipPlaceholderId(): int
    {
        $name = config('import.ownership_placeholder_document_name');

        $doc = Document::firstOrCreate(
            ['file_name' => $name],
            [
                'file_path' => 'ownership_files/uWd9ytxfRYGIuYkuCpY4iJviIhHPu2uoj3TBKihV.pdf',
                'mime_type' => 'application/pdf',
                'file_size' => 72187,
                'category' => 'ownership_files',
            ]
        );

        return $doc->id;
    }
}
