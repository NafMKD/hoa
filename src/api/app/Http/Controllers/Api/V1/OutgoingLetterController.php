<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\OutgoingLetterResource;
use App\Models\OutgoingLetter;
use App\Repositories\Api\V1\OutgoingLetterRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class OutgoingLetterController extends Controller
{
    public function __construct(
        protected OutgoingLetterRepository $letters
    ) {}

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', OutgoingLetter::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $search = $request->query('search');

            $filters = array_filter([
                'search' => $search,
            ], fn ($v) => $v !== null && $v !== '');

            $rows = $this->letters->all($perPage, $filters);

            return OutgoingLetterResource::collection($rows);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Outgoing letters index: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', OutgoingLetter::class);

            $this->mergeNullableForeignIds($request);

            $validated = $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'description' => ['nullable', 'string'],
                'unit_id' => ['nullable', 'integer', 'exists:units,id'],
                'recipient_name' => ['nullable', 'string', 'max:255'],
                'scan' => ['nullable', 'file', 'max:'.self::_MAX_FILE_SIZE, 'mimes:pdf,jpeg,jpg,png,gif,webp'],
            ]);

            $validated['created_by'] = Auth::id();

            $scan = $request->file('scan');
            $scan = $scan instanceof UploadedFile && $scan->isValid() ? $scan : null;

            $letter = $this->letters->create($validated, $scan);

            return (new OutgoingLetterResource($letter))
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
            Log::error('Outgoing letters store: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function show(OutgoingLetter $outgoingLetter): JsonResponse
    {
        try {
            $this->authorize('view', $outgoingLetter);

            $outgoingLetter->load(['unit.building', 'creator', 'scannedDocument']);

            return response()->json(new OutgoingLetterResource($outgoingLetter));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Outgoing letters show: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function update(Request $request, OutgoingLetter $outgoingLetter): JsonResponse
    {
        try {
            $this->authorize('update', $outgoingLetter);

            $this->mergeNullableForeignIds($request);

            $validated = $request->validate([
                'title' => ['sometimes', 'string', 'max:255'],
                'description' => ['nullable', 'string'],
                'unit_id' => ['nullable', 'integer', 'exists:units,id'],
                'recipient_name' => ['nullable', 'string', 'max:255'],
                'scan' => ['nullable', 'file', 'max:'.self::_MAX_FILE_SIZE, 'mimes:pdf,jpeg,jpg,png,gif,webp'],
            ]);

            unset($validated['scan']);

            $scan = $request->file('scan');
            $scan = $scan instanceof UploadedFile && $scan->isValid() ? $scan : null;

            $letter = $this->letters->update($outgoingLetter, $validated, $scan);

            return response()->json(new OutgoingLetterResource($letter));
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
            Log::error('Outgoing letters update: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function destroy(OutgoingLetter $outgoingLetter): JsonResponse
    {
        try {
            $this->authorize('delete', $outgoingLetter);

            $this->letters->delete($outgoingLetter);

            return response()->json(['status' => self::_SUCCESS, 'message' => 'Outgoing letter deleted successfully.']);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Outgoing letters destroy: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    protected function mergeNullableForeignIds(Request $request): void
    {
        $v = $request->input('unit_id');
        if ($v === '' || $v === null) {
            $request->merge(['unit_id' => null]);
        }
    }
}
