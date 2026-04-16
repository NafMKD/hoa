<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Models\Vendor;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class VendorRepository
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = Vendor::query()->orderBy('name');

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * @return Collection<int, Vendor>
     */
    public function getAll(): Collection
    {
        return Vendor::query()->orderBy('name')->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Vendor
    {
        return Vendor::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Vendor $vendor, array $data): Vendor
    {
        $vendor->update($data);

        return $vendor->fresh();
    }

    public function delete(Vendor $vendor): void
    {
        if ($vendor->expenses()->exists()) {
            throw new RepositoryException('Cannot delete a vendor that is referenced by expenses.');
        }

        DB::beginTransaction();

        try {
            $vendor->delete();
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to delete vendor: '.$e->getMessage());
        }
    }
}
