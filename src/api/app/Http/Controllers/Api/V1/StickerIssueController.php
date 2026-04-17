<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\StickerIssueResource;
use App\Models\StickerIssue;
use App\Models\Vehicle;
use App\Repositories\Api\V1\StickerIssueRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class StickerIssueController extends Controller
{
    public function __construct(
        protected StickerIssueRepository $stickerIssues,
    ) {
    }

    /**
     * List sticker issues for a vehicle.
     */
    public function index(Request $request, Vehicle $vehicle): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', StickerIssue::class);
            $this->authorize('view', $vehicle);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $rows = $this->stickerIssues->forVehicle($vehicle, $perPage);

            return StickerIssueResource::collection($rows);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Sticker issues index: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Lost or returned stickers for this vehicle that still need a replacement issue.
     */
    public function pendingReplacements(Vehicle $vehicle): JsonResponse
    {
        try {
            $this->authorize('viewAny', StickerIssue::class);
            $this->authorize('view', $vehicle);

            $rows = $this->stickerIssues->pendingReplacementStickers($vehicle);

            return response()->json(StickerIssueResource::collection($rows));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Sticker pending replacements: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Issue a new parking sticker for the vehicle.
     */
    public function store(Request $request, Vehicle $vehicle): JsonResponse
    {
        try {
            $this->authorize('create', StickerIssue::class);
            $this->authorize('view', $vehicle);

            $validated = $request->validate([
                'expires_at' => ['nullable', 'date', 'after:now'],
                'supersedes_sticker_issue_id' => ['nullable', 'integer', 'exists:sticker_issues,id'],
            ]);

            $issue = $this->stickerIssues->issue($vehicle, $validated);

            return response()->json(new StickerIssueResource($issue), 201);
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
            Log::error('Sticker issue store: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Revoke an active sticker (void).
     */
    public function revoke(StickerIssue $stickerIssue): JsonResponse
    {
        try {
            $this->authorize('revoke', $stickerIssue);

            $issue = $this->stickerIssues->revoke($stickerIssue);

            return response()->json(new StickerIssueResource($issue));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Sticker revoke: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Mark an active sticker as lost: creates penalty invoice (vehicle default fee or fee_id) and links it to the sticker.
     */
    public function markLost(Request $request, StickerIssue $stickerIssue): JsonResponse
    {
        try {
            $this->authorize('markLost', $stickerIssue);

            $validated = $request->validate([
                'fee_id' => ['nullable', 'integer', 'exists:fees,id'],
            ]);

            $issue = $this->stickerIssues->markLost($stickerIssue, $validated['fee_id'] ?? null);

            return response()->json(new StickerIssueResource($issue));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Sticker mark lost: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Mark an active sticker as returned (no invoice; replacement allowed without payment).
     */
    public function markReturned(StickerIssue $stickerIssue): JsonResponse
    {
        try {
            $this->authorize('markReturned', $stickerIssue);

            $issue = $this->stickerIssues->markReturned($stickerIssue);

            return response()->json(new StickerIssueResource($issue));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Sticker mark returned: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Payload for label print (QR encodes lookup_token; human line per doc/sticker_print.md scramble).
     */
    public function printData(StickerIssue $stickerIssue): JsonResponse
    {
        try {
            $this->authorize('view', $stickerIssue);

            $stickerIssue->load(['vehicle.unit']);

            return response()->json([
                'sticker_code' => $stickerIssue->sticker_code,
                'lookup_token' => $stickerIssue->lookup_token,
                'sticker_line' => $this->stickerIssues->stickerLine($stickerIssue),
            ]);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Sticker printData: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    /**
     * Resolve a sticker by opaque lookup token (e.g. after scanning QR). Admin-only.
     */
    public function verify(string $token): JsonResponse
    {
        try {
            $this->authorize('viewAny', StickerIssue::class);

            $issue = $this->stickerIssues->findByLookupToken($token);
            if (! $issue) {
                return response()->json(['status' => self::_ERROR, 'message' => 'Sticker not found.'], 404);
            }

            return response()->json([
                'sticker_code' => $issue->sticker_code,
                'status' => $issue->status,
                'issued_at' => $issue->issued_at?->toIso8601String(),
                'expires_at' => $issue->expires_at?->toIso8601String(),
                'license_plate' => $issue->vehicle->license_plate ?? null,
                'unit' => $issue->vehicle->unit ? [
                    'id' => $issue->vehicle->unit->id,
                    'name' => $issue->vehicle->unit->name,
                    'building' => $issue->vehicle->unit->building?->name,
                ] : null,
            ]);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Sticker verify: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }
}
