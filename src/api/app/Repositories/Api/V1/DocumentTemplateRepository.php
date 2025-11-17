<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Models\DocumentTemplate;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DocumentTemplateRepository
{
    /**
     * Get all templates with optional pagination.
     * 
     * @param  int|null  $perPage
     * @return Collection|LengthAwarePaginator
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = DocumentTemplate::query();

        // Filter by search (name or address)
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where('name', 'like', "%{$search}%");
        }

        // Order by creation date descending
        $query->orderBy('created_at', 'desc');

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * Create a new document template.
     * 
     * @param array<string, mixed> $data
     * @return DocumentTemplate
     * @throws RepositoryException
     */
    public function create(array $data): DocumentTemplate
    {
        DB::beginTransaction();

        try {
            if (!isset($data['file']) || !$data['file'] instanceof UploadedFile) {
                throw new RepositoryException('Template file is required.');
            }

            // Upload file and extract placeholders
            [$path, $placeholders] = $this->uploadTemplateFile(
                $data['category'],
                $data['sub_category'],
                $data['version'],
                $data['file']
            );

            $template = DocumentTemplate::create([
                'category'      => $data['category'],
                'sub_category'  => $data['sub_category'],
                'name'          => $data['name'] ?? $data['sub_category'] . ' v' . $data['version'],
                'path'          => $path,
                'placeholders'  => $placeholders,
                'description'   => $data['description'] ?? null,
                'version'       => $data['version'],
                'created_by'    => $data['created_by'],
                'updated_by'    => $data['created_by'],
            ]);

            DB::commit();
            return $template;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to create document template: ' . $e->getMessage());
        }
    }

    /**
     * Update an existing document template.
     * 
     * @param DocumentTemplate $template
     * @param array<string, mixed> $data
     * @return DocumentTemplate
     * @throws RepositoryException
     */
    public function update(DocumentTemplate $template, array $data): DocumentTemplate
    {
        DB::beginTransaction();

        try {
            if (isset($data['file']) && $data['file'] instanceof UploadedFile) {
                // Delete old template file
                if (Storage::disk('public')->exists($template->path)) {
                    Storage::disk('public')->delete($template->path);
                }

                [$path, $placeholders] = $this->uploadTemplateFile(
                    $template->category,
                    $template->sub_category,
                    $template->version,
                    $data['file']
                );

                $data['path'] = $path;
                $data['placeholders'] = $placeholders;
            }

            $template->update($data);

            DB::commit();
            return $template;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to update document template: ' . $e->getMessage());
        }
    }

    /**
     * Get placeholders for a given template.
     * 
     * @param DocumentTemplate $template
     * @return array<string>
     * @throws RepositoryException
     */
    public function getPlaceholders(DocumentTemplate $template): array
    {
        try {
            return $template->placeholders ?? [];
        } catch (\Throwable $e) {
            throw new RepositoryException('Failed to retrieve placeholders: ' . $e->getMessage());
        }
    }

    /**
     * Soft delete a document template.
     * 
     * @param DocumentTemplate $template
     * @return bool|null
     */
    public function delete(DocumentTemplate $template): ?bool
    {
        return DB::transaction(function () use ($template) {
            if (Storage::disk('public')->exists($template->path)) {
                Storage::disk('public')->delete($template->path);
            }

            return $template->delete();
        });
    }

    /**
     * Upload the .docx template file and extract placeholders.
     * 
     * @param string $category
     * @param string $subCategory
     * @param int $version
     * @param UploadedFile $file
     * @return array{string, array<string>}
     */
    private function uploadTemplateFile(string $category, string $subCategory, int $version, UploadedFile $file): array
    {
        $directory = "template_documents/{$category}";
        $filename = "{$subCategory}_v{$version}." . $file->getClientOriginalExtension();

        $path = $file->storeAs($directory, $filename, 'public');

        // Extract placeholders like {{variable}}
        $placeholders = $this->extractPlaceholdersFromDocx($file->getPathname());

        return [$path, $placeholders];
    }

    /**
     * Extract placeholders from DOCX file.
     * 
     * @param string $filePath
     * @return array<int, string>
     * @throws RepositoryException
     */
    private function extractPlaceholdersFromDocx(string $filePath): array
    {
        try {
            $zip = new \ZipArchive();
            $placeholders = [];

            if ($zip->open($filePath) === true) {
                $xml = $zip->getFromName('word/document.xml');
                $zip->close();

                // Remove all XML tags except text content
                $text = strip_tags($xml);

                // Match placeholders {{variable}}
                preg_match_all('/\{\{(\w+)\}\}/', $text, $matches);

                if (!empty($matches[1])) {
                    $placeholders = $matches[1];
                }
            }

            return array_unique($placeholders);
        } catch (\Throwable $e) {
            // fallback safe
            throw new RepositoryException('Failed to extract placeholders: ' . $e->getMessage());
        }
    }

    /**
     * Generate a filled document from a template using placeholder data
     * and save it directly as PDF.
     * 
     * @param DocumentTemplate $template
     * @param array<string, string> $data
     * @return string  Generated PDF file path
     * @throws RepositoryException
     */
    public function generate(DocumentTemplate $template, array $data): string
    {
        $source = storage_path('app/public/' . $template->path);
        $pdfOutputName = "{$template->sub_category}_v{$template->version}_filled_" . now()->timestamp . ".pdf";
        $pdfOutputPath = "generated_documents/{$template->category}/{$pdfOutputName}";

        try {
            // Load template
            $templateProcessor = new \PhpOffice\PhpWord\TemplateProcessor($source);
            
            // Replace placeholders
            foreach ($data as $key => $value) {
                $templateProcessor->setValue($key, $value);
            }

            // Save to temporary DOCX (required by PhpWord PDF conversion)
            $tempDocx = tempnam(sys_get_temp_dir(), 'tmp_docx_') . '.docx';
            $templateProcessor->saveAs($tempDocx);

            // Ensure output folder exists
            Storage::disk('public')->makeDirectory("generated_documents/{$template->category}");

            // Set PDF renderer
            \PhpOffice\PhpWord\Settings::setPdfRendererName(\PhpOffice\PhpWord\Settings::PDF_RENDERER_DOMPDF);
            \PhpOffice\PhpWord\Settings::setPdfRendererPath(base_path('vendor/dompdf/dompdf'));

            // Load DOCX and save as PDF
            $phpWord = \PhpOffice\PhpWord\IOFactory::load($tempDocx);
            $pdfWriter = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'PDF');
            $pdfWriter->save(storage_path("app/public/{$pdfOutputPath}"));

            // Delete temporary DOCX
            unlink($tempDocx);

            return $pdfOutputPath;
        } catch (\Throwable $e) {
            throw new RepositoryException('Failed to generate PDF: ' . $e->getMessage());
        }
    }
}
