<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ComplaintResource;
use App\Models\Complaint;
use App\Repositories\Api\V1\ComplaintRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ComplaintController extends Controller
{
    public function __construct(
        protected ComplaintRepository $complaints
    ) {}

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', Complaint::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $search = $request->query('search');
            $category = $request->query('category');
            $status = $request->query('status');

            $filters = array_filter([
                'search' => $search,
                'category' => $category,
                'status' => $status,
            ], fn ($v) => $v !== null && $v !== '');

            $rows = $this->complaints->all($perPage, $filters);

            return ComplaintResource::collection($rows);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Complaints index: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', Complaint::class);

            $this->mergeNullableForeignIds($request);

            $validated = $request->validate([
                'user_id' => ['required', 'integer', 'exists:users,id'],
                'unit_id' => ['nullable', 'integer', 'exists:units,id'],
                'category' => ['required', 'string', Rule::in(self::_COMPLAINT_CATEGORIES)],
                'subject' => ['required', 'string', 'max:255'],
                'body' => ['required', 'string'],
                'status' => ['sometimes', 'string', Rule::in(self::_COMPLAINT_STATUSES)],
                'priority' => ['sometimes', 'string', Rule::in(self::_COMPLAINT_PRIORITIES)],
                'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
                'attachments' => ['nullable', 'array', 'max:10'],
                'attachments.*' => ['file', 'max:'.self::_MAX_FILE_SIZE, 'mimes:pdf,jpeg,jpg,png,gif,webp,doc,docx'],
            ]);

            $validated['status'] = $validated['status'] ?? self::_COMPLAINT_STATUSES[0];
            $validated['priority'] = $validated['priority'] ?? self::_COMPLAINT_PRIORITIES[1];

            $files = $this->collectUploadedFiles($request);

            unset($validated['attachments']);

            $complaint = $this->complaints->create($validated, $files);

            return (new ComplaintResource($complaint))
                ->response()
                ->setStatusCode(201);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Complaints store: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function show(Complaint $complaint): JsonResponse
    {
        try {
            $this->authorize('view', $complaint);

            $complaint->load(['submitter', 'assignee', 'unit.building', 'documents']);

            return response()->json(new ComplaintResource($complaint));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Complaints show: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function update(Request $request, Complaint $complaint): JsonResponse
    {
        try {
            $this->authorize('update', $complaint);

            $this->mergeNullableForeignIds($request);

            $validated = $request->validate([
                'user_id' => ['sometimes', 'integer', 'exists:users,id'],
                'unit_id' => ['nullable', 'integer', 'exists:units,id'],
                'category' => ['sometimes', 'string', Rule::in(self::_COMPLAINT_CATEGORIES)],
                'subject' => ['sometimes', 'string', 'max:255'],
                'body' => ['sometimes', 'string'],
                'status' => ['sometimes', 'string', Rule::in(self::_COMPLAINT_STATUSES)],
                'priority' => ['sometimes', 'string', Rule::in(self::_COMPLAINT_PRIORITIES)],
                'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
                'attachments' => ['nullable', 'array', 'max:10'],
                'attachments.*' => ['file', 'max:'.self::_MAX_FILE_SIZE, 'mimes:pdf,jpeg,jpg,png,gif,webp,doc,docx'],
                'remove_document_ids' => ['nullable', 'array'],
                'remove_document_ids.*' => ['integer', 'exists:documents,id'],
            ]);

            $removeIds = $validated['remove_document_ids'] ?? [];
            unset($validated['attachments'], $validated['remove_document_ids']);

            $files = $this->collectUploadedFiles($request);

            $complaint = $this->complaints->update($complaint, $validated, $files, $removeIds);

            return response()->json(new ComplaintResource($complaint));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Complaints update: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function destroy(Complaint $complaint): JsonResponse
    {
        try {
            $this->authorize('delete', $complaint);

            $this->complaints->delete($complaint);

            return response()->json(['status' => self::_SUCCESS, 'message' => 'Complaint deleted successfully.']);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Complaints destroy: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    protected function mergeNullableForeignIds(Request $request): void
    {
        foreach (['unit_id', 'assigned_to'] as $key) {
            $v = $request->input($key);
            if ($v === '' || $v === null) {
                $request->merge([$key => null]);
            }
        }
    }

    /**
     * @return array<int, UploadedFile>
     */
    protected function collectUploadedFiles(Request $request): array
    {
        $files = $request->file('attachments');
        if ($files === null) {
            return [];
        }
        if (! is_array($files)) {
            return $files instanceof UploadedFile && $files->isValid() ? [$files] : [];
        }

        return array_values(array_filter(
            $files,
            fn ($f) => $f instanceof UploadedFile && $f->isValid()
        ));
    }
}
