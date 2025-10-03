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
     * Get all buildings with optional pagination.
     * 
     * @param  int|null  $perPage
     * @return Collection|LengthAwarePaginator
     */
    public function all(?int $perPage = null): Collection|LengthAwarePaginator
    {
        if ($perPage) {
            return Building::paginate($perPage);
        }

        return Building::all();
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
