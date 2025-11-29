<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use App\Models\Document;

class UnitRepository
{
    /**
     * Get all units, optionally paginated and filtered.
     *
     * @param int|null $perPage
     * @param array $filters
     * @return Collection|LengthAwarePaginator
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = Unit::query()
            ->with([
                'building:id,name'
            ]);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['building_id'])) {
            $query->where('building_id', $filters['building_id']);
        }

        // Filter by floor number
        if (!empty($filters['floor_number'])) {
            $query->where('floor_number', $filters['floor_number']);
        }

        if (!empty($filters['unit_type'])) {
            $query->where('unit_type', $filters['unit_type']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $query->orderBy('created_at', 'desc');

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * Create a new unit.
     * 
     * @param array<string, mixed> $data
     * @return Unit
     */
    public function create(array $data): Unit
    {
        DB::beginTransaction();

        try {

            if (!isset($data['status'])) {
                $data['status'] = 'vacant';
            }

            $unit = Unit::create($data);

            DB::commit();
            return $unit;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to create unit: ' . $e->getMessage());
        }
    }

    /**
     * Update an existing unit.
     * 
     * @param Unit $unit
     * @param array<string, mixed> $data
     * @return Unit
     */
    public function update(Unit $unit, array $data): Unit
    {
        DB::beginTransaction();

        try {
            $unit->update($data);

            DB::commit();
            return $unit;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to update unit: ' . $e->getMessage());
        }
    }

    /**
     * Soft delete a unit.
     * 
     * @param Unit $unit
     * @return bool|null
     */
    public function delete(Unit $unit): ?bool
    {
        return DB::transaction(function () use ($unit) {

            // TODO: Handle related entities (e.g., leases, tenants) 

            return $unit->delete();
        });
    }
}
