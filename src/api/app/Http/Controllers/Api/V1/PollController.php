<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PollResource;
use App\Http\Resources\Api\V1\VoteResource;
use App\Models\Poll;
use App\Repositories\Api\V1\PollRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PollController extends Controller
{
    public function __construct(
        protected PollRepository $polls,
    ) {}

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $this->authorize('viewAny', Poll::class);

            $perPage = (int) ($request->query('per_page', self::_DEFAULT_PAGINATION));
            $search = $request->query('search');
            $status = $request->query('status');

            $filters = array_filter([
                'search' => $search,
                'status' => $status,
            ], fn ($v) => $v !== null && $v !== '');

            $rows = $this->polls->all($perPage, $filters);

            return PollResource::collection($rows);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Polls index: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', Poll::class);

            $validated = $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'description' => ['nullable', 'string'],
                'eligible_scope' => ['nullable', 'array'],
                'start_at' => ['required', 'date'],
                'end_at' => ['required', 'date'],
                'options' => ['required', 'array', 'min:2'],
                'options.*.option_text' => ['required', 'string', 'max:500'],
                'options.*.order' => ['nullable', 'integer', 'min:0'],
            ]);

            $poll = $this->polls->create($validated);

            return (new PollResource(
                $poll->load(['options' => fn ($q) => $q->orderBy('order')->orderBy('id')])->loadCount('votes')
            ))
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
        } catch (QueryException $e) {
            Log::error('Poll store: '.$e->getMessage(), ['exception' => $e]);

            return response()->json([
                'status' => self::_ERROR,
                'message' => config('app.debug')
                    ? $e->getMessage()
                    : 'Database error saving the poll. Run migrations (php artisan migrate) if this install is new.',
            ], 400);
        } catch (\Exception $e) {
            Log::error('Poll store: '.$e->getMessage(), ['exception' => $e]);

            return response()->json([
                'status' => self::_ERROR,
                'message' => config('app.debug') ? $e->getMessage() : self::_UNKNOWN_ERROR,
            ], 400);
        }
    }

    public function show(Poll $poll): JsonResponse
    {
        try {
            $this->authorize('view', $poll);

            $poll->load(['options' => fn ($q) => $q->orderBy('order')->orderBy('id')]);
            $poll->loadCount('votes');

            return response()->json(new PollResource($poll));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Poll show: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function update(Request $request, Poll $poll): JsonResponse
    {
        try {
            $this->authorize('update', $poll);

            $validated = $request->validate([
                'title' => ['sometimes', 'string', 'max:255'],
                'description' => ['sometimes', 'nullable', 'string'],
                'eligible_scope' => ['sometimes', 'nullable', 'array'],
                'start_at' => ['sometimes', 'date'],
                'end_at' => ['sometimes', 'date'],
                'options' => ['sometimes', 'array', 'min:2'],
                'options.*.option_text' => ['required_with:options', 'string', 'max:500'],
                'options.*.order' => ['nullable', 'integer', 'min:0'],
            ]);

            $poll = $this->polls->update($poll, $validated);

            return response()->json(new PollResource($poll->load(['options'])->loadCount('votes')));
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
            Log::error('Poll update: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function destroy(Poll $poll): JsonResponse
    {
        try {
            $this->authorize('delete', $poll);

            $this->polls->delete($poll);

            return response()->json(['status' => self::_SUCCESS, 'message' => 'Poll deleted.']);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Poll destroy: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function open(Poll $poll): JsonResponse
    {
        try {
            $this->authorize('open', $poll);

            $poll = $this->polls->open($poll);

            return response()->json(new PollResource($poll->load(['options'])->loadCount('votes')));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Poll open: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function close(Poll $poll): JsonResponse
    {
        try {
            $this->authorize('close', $poll);

            $poll = $this->polls->close($poll);

            return response()->json(new PollResource($poll->load(['options'])->loadCount('votes')));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Poll close: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function results(Poll $poll): JsonResponse
    {
        try {
            $this->authorize('viewResults', $poll);

            $rows = $this->polls->results($poll);

            return response()->json([
                'poll_id' => $poll->id,
                'status' => $poll->status,
                'options' => $rows,
                'total_votes' => array_sum(array_column($rows, 'vote_count')),
            ]);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Poll results: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function vote(Request $request, Poll $poll): JsonResponse
    {
        try {
            $this->authorize('vote', $poll);

            $validated = $request->validate([
                'option_id' => [
                    'required',
                    'integer',
                    Rule::exists('poll_options', 'id')->where(fn ($q) => $q->where('poll_id', $poll->id)),
                ],
                'unit_id' => ['required', 'integer', 'exists:units,id'],
            ]);

            $user = Auth::user();
            if ($user === null) {
                return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
            }

            $vote = $this->polls->castVote($poll, $user, $validated);

            return response()->json(new VoteResource($vote->load(['option', 'unit'])), 201);
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
            Log::error('Poll vote: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }
}
