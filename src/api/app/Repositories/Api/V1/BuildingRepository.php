<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Building;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class BuildingRepository
{
    /**
     * Get all buildings, optionally paginated and filtered.
     *
     * @param int|null $perPage
     * @param array $filters
     * @return Collection|LengthAwarePaginator
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = Building::query();

        // Filter by search (name or address)
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where('name', 'like', "%{$search}%");
        }

        // Filter by number of floors
        if (!empty($filters['floors'])) {
            $query->where('floors', $filters['floors']);
        }

        // Additional filters can be added here
        if (!empty($filters['units_per_floor'])) {
            $query->where('units_per_floor', $filters['units_per_floor']);
        }

        // Order by creation date descending
        $query->orderBy('created_at', 'desc');

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * Get all building names and IDs.
     * 
     * @return Collection
     */
    public function allNames(): Collection
    {
        return Building::query()
            ->select('id', 'name')
            ->orderBy('name', 'asc')
            ->get();
    }

    /**
     * Create new building.
     * 
     * @param  array<string, mixed>  $data
     * @return Building
     */
    public function create(array $data): Building
    {
        DB::beginTransaction();

        try {
            $data['address'] = Controller::_DEFAULT_ADDRESS;
            $building = Building::create($data);

            DB::commit();
            return $building;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to create building: ' . $e->getMessage());
        }
    }

    /**
     * Update existing building.
     * 
     * @param  Building  $building
     * @param  array<string, mixed>  $data
     * @return Building
     */
    public function update(Building $building, array $data): Building
    {
        DB::beginTransaction();

        try {
            $building->update($data);

            DB::commit();
            return $building;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to update building: ' . $e->getMessage());
        }
    }

    /**
     * Soft delete a building.
     * 
     * @param  Building  $building
     * @return bool|null
     */
    public function delete(Building $building): ?bool
    {
        return DB::transaction(function () use ($building): bool|null 
        {
            // TODO: Handle related units if necessary
            return $building->delete();
        });
    }
}
