<?php

namespace App\Repositories\Api\V1;

use App\Models\Agency;
use App\Models\AgencyPlacement;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class AgencyPlacementRepository
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function forAgency(Agency $agency, ?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = AgencyPlacement::query()
            ->where('agency_id', $agency->id)
            ->orderByDesc('effective_from');

        if (! empty($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Agency $agency, array $data): AgencyPlacement
    {
        $data['agency_id'] = $agency->id;

        return AgencyPlacement::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(AgencyPlacement $placement, array $data): AgencyPlacement
    {
        $placement->update($data);

        return $placement->fresh();
    }

    public function delete(AgencyPlacement $placement): void
    {
        $placement->delete();
    }

    /**
     * Placements active for any day inside the calendar month (first day of month GC).
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, AgencyPlacement>
     */
    public function activeForCalendarMonth(string $calendarMonthFirstDayYmd): Collection
    {
        $monthStart = \Carbon\Carbon::parse($calendarMonthFirstDayYmd)->startOfMonth();
        $monthEnd = \Carbon\Carbon::parse($calendarMonthFirstDayYmd)->endOfMonth();

        return AgencyPlacement::query()
            ->with('agency')
            ->where('is_active', true)
            ->whereDate('effective_from', '<=', $monthEnd->toDateString())
            ->where(function ($q) use ($monthStart) {
                $q->whereNull('effective_to')
                    ->orWhereDate('effective_to', '>=', $monthStart->toDateString());
            })
            ->orderBy('agency_id')
            ->orderBy('line_of_work')
            ->get();
    }
}
