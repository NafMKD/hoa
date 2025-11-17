<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use App\Repositories\Api\V1\DocumentTemplateRepository;
use App\Http\Resources\Api\V1\DocumentTemplateResource;
use App\Models\DocumentTemplate;
use App\Rules\UniqueTemplateVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DocumentTemplateController extends Controller
{
    protected DocumentTemplateRepository $templates;

    /**
     * DocumentTemplateController constructor.
     * 
     * @param DocumentTemplateRepository $templates
     */
    public function __construct(DocumentTemplateRepository $templates)
    {
        $this->templates = $templates;
    }

    /**
     * Display a listing of templates.
     * 
     * @param Request $request
     * @return AnonymousResourceCollection|JsonResponse
     */
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', DocumentTemplate::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $search = $request->query('search', null);

            $filters = compact('search');
            $templates = $this->templates->all($perPage, $filters);

            return DocumentTemplateResource::collection($templates);
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            // Log the exception 
            Log::error('Error fetching document templates: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Store a newly created template.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', DocumentTemplate::class);

            $validated = $request->validate([
                'category'     => ['required', 'string', 'max:255', Rule::in(self::_DOCUMENT_TEMPLATE_CATEGORIES)],
                'sub_category' => ['required', 'string', 'max:255'],
                'name'         => ['required', 'string', 'max:255'],
                'description'  => ['nullable', 'string'],
                'version'      => ['required', 'integer', 'min:1', new UniqueTemplateVersion],
                'file'         => ['required', 'file', 'mimes:docx', 'max:' . self::_MAX_FILE_SIZE],
            ]);

            $validated['created_by'] = Auth::id();
            $template = $this->templates->create($validated);

            return response()->json(new DocumentTemplateResource($template), 201);
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (ValidationException $e) {
            // Return validation errors in array format
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }  catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            // Log the exception 
            Log::error('Error creating document template: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Display the specified template.
     * 
     * @param DocumentTemplate $template
     * @return JsonResponse
     */
    public function show(DocumentTemplate $template): JsonResponse
    {
        try {
            $this->authorize('view', $template);

            $template->load('creator', 'updater');
            return response()->json(new DocumentTemplateResource($template));
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            // Log the exception 
            Log::error('Error fetching document template: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Download the specified template file.
     * 
     * @param DocumentTemplate $template
     * @return BinaryFileResponse|JsonResponse
     */
    public function download(DocumentTemplate $template): BinaryFileResponse|JsonResponse
    {
        try {
            $this->authorize('viewAny', $template);

            // check if the file exist
            if(!$template->path || !Storage::disk('public')->exists($template->path)) {
                return response()->json([
                    'status' => self::_ERROR,
                    'message' => 'Template file not found.',
                ], 404);
            }

            return response()->file(Storage::disk('public')->path($template->path));
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            // Log the exception 
            Log::error('Error downloading document template: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Update the specified template.
     * 
     * @param Request $request
     * @param DocumentTemplate $template
     * @return JsonResponse
     */
    public function update(Request $request, DocumentTemplate $template): JsonResponse
    {
        try {
            $this->authorize('update', $template);

            $validated = $request->validate([
                'category'     => ['sometimes', 'string', 'max:255'],
                'sub_category' => ['sometimes', 'string', 'max:255'],
                'name'         => ['nullable', 'string', 'max:255'],
                'description'  => ['nullable', 'string'],
                'version'      => ['sometimes', 'integer', 'min:1'],
                'file'         => ['nullable', 'file', 'mimes:docx', 'max:' . self::_MAX_FILE_SIZE],
            ]);

            $validated['updated_by'] = Auth::id();
            $template = $this->templates->update($template, $validated);

            return response()->json(new DocumentTemplateResource($template));
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (ValidationException $e) {
            // Return validation errors in array format
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }  catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            // Log the exception 
            Log::error('Error updating document template: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Get the placeholders for a given template.
     * 
     * @param DocumentTemplate $template
     * @return JsonResponse
     */
    public function placeholders(DocumentTemplate $template): JsonResponse
    {
        try {
            $this->authorize('view', $template);

            $placeholders = $this->templates->getPlaceholders($template);

            return response()->json([
                'status' => self::_SUCCESS,
                'placeholders' => $placeholders,
            ]);
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            // Log the exception 
            Log::error('Error fetching template placeholders: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Remove the specified template (soft delete).
     * 
     * @param DocumentTemplate $template
     * @return JsonResponse
     */
    public function destroy(DocumentTemplate $template): JsonResponse
    {
        try {
            $this->authorize('delete', $template);

            $this->templates->delete($template);

            return response()->json([
                'status' => self::_SUCCESS,
                'message' => 'Template deleted successfully.',
            ]);
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            // Log the exception 
            Log::error('Error deleting document template: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    /**
     * Generate a document from a template using placeholders.
     * 
     * @param Request $request
     * @param DocumentTemplate $template
     * @return JsonResponse
     */
    public function generate(Request $request, DocumentTemplate $template): JsonResponse
    {
        try {
            $this->authorize('generate', $template);

            $data = $request->validate([
                'placeholders' => ['required', 'array'],
                'placeholders.*' => ['string'],
            ]);

            $filePath = $this->templates->generate($template, $data['placeholders']);

            return response()->json([
                'status' => self::_SUCCESS,
                'message' => 'Document generated successfully.',
                'path' => $filePath,
            ]);
        } catch (AuthorizationException) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNAUTHORIZED,
            ], 403);
        } catch (RepositoryException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            // Log the exception 
            Log::error('Error generating document from template: ' . $e->getMessage());
            return response()->json([
                'status' => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }
}
