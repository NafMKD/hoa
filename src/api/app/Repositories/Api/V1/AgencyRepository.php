<?php

namespace App\Repositories\Api\V1;

use App\Models\Agency;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class AgencyRepository
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = Agency::query()->orderBy('name');

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
     * @return Collection<int, Agency>
     */
    public function getAll(): Collection
    {
        return Agency::query()->orderBy('name')->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Agency
    {
        return Agency::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Agency $agency, array $data): Agency
    {
        $agency->update($data);

        return $agency->fresh();
    }

    public function delete(Agency $agency): void
    {
        $agency->delete();
    }
}
