<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Models\Poll;
use App\Models\PollOption;
use App\Models\Unit;
use App\Models\UnitLease;
use App\Models\UnitOwner;
use App\Models\User;
use App\Models\Vote;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PollRepository
{
    /**
     * @param  array<string, mixed>  $filters
     * @return Collection<int, Poll>|LengthAwarePaginator<int, Poll>
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = Poll::query()
            ->withCount('votes')
            ->with(['options' => function ($q) {
                $q->orderBy('order')->orderBy('id');
            }])
            ->orderByDesc('created_at');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * Validate and normalize eligible_scope JSON (stored on Poll).
     *
     * @param  array<string, mixed>|null  $scope
     * @return array<string, mixed>|null
     */
    public function validateEligibleScope(?array $scope): ?array
    {
        if ($scope === null || $scope === []) {
            return null;
        }

        $type = $scope['type'] ?? 'all';

        if ($type === 'all') {
            return ['type' => 'all'];
        }

        if ($type === 'buildings') {
            $ids = $scope['building_ids'] ?? [];
            if (! is_array($ids) || $ids === []) {
                throw new RepositoryException('eligible_scope.building_ids is required when type is buildings.');
            }
            $ids = array_values(array_unique(array_map('intval', $ids)));

            return ['type' => 'buildings', 'building_ids' => $ids];
        }

        if ($type === 'units') {
            $ids = $scope['unit_ids'] ?? [];
            if (! is_array($ids) || $ids === []) {
                throw new RepositoryException('eligible_scope.unit_ids is required when type is units.');
            }
            $ids = array_values(array_unique(array_map('intval', $ids)));

            return ['type' => 'units', 'unit_ids' => $ids];
        }

        throw new RepositoryException('eligible_scope.type must be all, buildings, or units.');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Poll
    {
        try {
            return DB::transaction(function () use ($data) {
                $scope = $this->validateEligibleScope($data['eligible_scope'] ?? null);

                try {
                    $start = Carbon::parse($data['start_at']);
                    $end = Carbon::parse($data['end_at']);
                } catch (\Throwable) {
                    throw new RepositoryException('Invalid start_at or end_at.');
                }
                if ($end->lte($start)) {
                    throw new RepositoryException('end_at must be after start_at.');
                }

                $poll = Poll::create([
                    'title' => $data['title'],
                    'description' => $data['description'] ?? null,
                    'eligible_scope' => $scope,
                    'start_at' => $start,
                    'end_at' => $end,
                    'status' => 'draft',
                ]);

                $this->syncDraftOptions($poll, $data['options'] ?? []);

                return $poll->fresh(['options']);
            });
        } catch (RepositoryException $e) {
            throw $e;
        } catch (QueryException $e) {
            Log::error('Poll create database error: '.$e->getMessage(), ['exception' => $e]);

            throw new RepositoryException(
                'Could not save the poll. Confirm migrations are applied (php artisan migrate) and the database connection works.'
            );
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Poll $poll, array $data): Poll
    {
        if ($poll->status !== 'draft') {
            throw new RepositoryException('Only draft polls can be edited.');
        }

        return DB::transaction(function () use ($poll, $data) {
            if (array_key_exists('eligible_scope', $data)) {
                $poll->eligible_scope = $this->validateEligibleScope($data['eligible_scope'] ?? null);
            }
            if (isset($data['title'])) {
                $poll->title = $data['title'];
            }
            if (array_key_exists('description', $data)) {
                $poll->description = $data['description'];
            }
            if (isset($data['start_at'])) {
                $poll->start_at = Carbon::parse($data['start_at']);
            }
            if (isset($data['end_at'])) {
                $poll->end_at = Carbon::parse($data['end_at']);
            }

            if ($poll->end_at->lte($poll->start_at)) {
                throw new RepositoryException('end_at must be after start_at.');
            }

            $poll->save();

            if (isset($data['options'])) {
                $this->syncDraftOptions($poll, $data['options']);
            }

            return $poll->fresh(['options']);
        });
    }

    public function delete(Poll $poll): void
    {
        if ($poll->status !== 'draft') {
            throw new RepositoryException('Only draft polls can be deleted.');
        }

        DB::transaction(function () use ($poll) {
            $poll->options()->forceDelete();
            $poll->delete();
        });
    }

    public function open(Poll $poll): Poll
    {
        if ($poll->status !== 'draft') {
            throw new RepositoryException('Only draft polls can be opened.');
        }

        $poll->load('options');
        if ($poll->options->count() < 2) {
            throw new RepositoryException('Add at least two options before opening a poll.');
        }

        $poll->status = 'open';
        $poll->save();

        return $poll->fresh(['options']);
    }

    public function close(Poll $poll): Poll
    {
        if ($poll->status !== 'open') {
            throw new RepositoryException('Only open polls can be closed.');
        }

        $poll->status = 'closed';
        $poll->save();

        return $poll->fresh(['options']);
    }

    /**
     * Tally votes per option (for open or closed polls).
     *
     * @return list<array{option_id: int, option_text: string, vote_count: int}>
     */
    public function results(Poll $poll): array
    {
        $poll->load(['options' => fn ($q) => $q->orderBy('order')->orderBy('id')]);

        $counts = Vote::query()
            ->where('poll_id', $poll->id)
            ->selectRaw('option_id, count(*) as c')
            ->groupBy('option_id')
            ->pluck('c', 'option_id');

        $out = [];
        foreach ($poll->options as $opt) {
            $out[] = [
                'option_id' => $opt->id,
                'option_text' => $opt->option_text,
                'vote_count' => (int) ($counts[$opt->id] ?? 0),
            ];
        }

        return $out;
    }

    /**
     * One vote per unit; user must be active owner or active tenant of that unit.
     *
     * @param  array<string, mixed>  $data
     */
    public function castVote(Poll $poll, User $user, array $data): Vote
    {
        return DB::transaction(function () use ($poll, $user, $data) {
            $poll->loadMissing('options');

            if ($poll->status !== 'open') {
                throw new RepositoryException('Voting is only allowed for open polls.');
            }

            $now = Carbon::now();
            if ($now->lt($poll->start_at) || $now->gt($poll->end_at)) {
                throw new RepositoryException('Voting is not allowed outside the poll window.');
            }

            $optionId = (int) $data['option_id'];
            $unitId = (int) $data['unit_id'];

            $option = $poll->options->firstWhere('id', $optionId);
            if (! $option) {
                throw new RepositoryException('Invalid option for this poll.');
            }

            $unit = Unit::query()->with('building')->find($unitId);
            if (! $unit) {
                throw new RepositoryException('Invalid unit.');
            }

            if (! $this->unitMatchesEligibleScope($poll, $unit)) {
                throw new RepositoryException('This unit is not eligible for this poll.');
            }

            if (! $this->userRepresentsUnit($user, $unit)) {
                throw new RepositoryException('You are not authorized to vote on behalf of this unit.');
            }

            $exists = Vote::query()
                ->where('poll_id', $poll->id)
                ->where('unit_id', $unitId)
                ->lockForUpdate()
                ->exists();

            if ($exists) {
                throw new RepositoryException('A vote has already been recorded for this unit.');
            }

            return Vote::create([
                'poll_id' => $poll->id,
                'option_id' => $optionId,
                'user_id' => $user->id,
                'unit_id' => $unitId,
            ]);
        });
    }

    public function unitMatchesEligibleScope(Poll $poll, Unit $unit): bool
    {
        $scope = $poll->eligible_scope;

        if ($scope === null || ! is_array($scope) || (($scope['type'] ?? 'all') === 'all')) {
            return true;
        }

        $type = $scope['type'];

        if ($type === 'buildings') {
            $ids = $scope['building_ids'] ?? [];

            return in_array((int) $unit->building_id, $ids, true);
        }

        if ($type === 'units') {
            $ids = $scope['unit_ids'] ?? [];

            return in_array((int) $unit->id, $ids, true);
        }

        return false;
    }

    public function userRepresentsUnit(User $user, Unit $unit): bool
    {
        if (UnitOwner::query()
            ->where('unit_id', $unit->id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->exists()) {
            return true;
        }

        return UnitLease::query()
            ->where('unit_id', $unit->id)
            ->where('tenant_id', $user->id)
            ->where('status', 'active')
            ->exists();
    }

    /**
     * @param  list<array{option_text: string, order?: int}>|list<mixed>  $options
     */
    private function syncDraftOptions(Poll $poll, array $options): void
    {
        if (count($options) < 2) {
            throw new RepositoryException('At least two options are required.');
        }

        $poll->options()->forceDelete();

        $order = 0;
        foreach ($options as $row) {
            if (! is_array($row) || empty($row['option_text'])) {
                throw new RepositoryException('Each option must have option_text.');
            }
            PollOption::create([
                'poll_id' => $poll->id,
                'option_text' => $row['option_text'],
                'order' => isset($row['order']) ? (int) $row['order'] : $order,
            ]);
            $order++;
        }
    }
}
