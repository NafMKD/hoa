<?php

namespace App\Repositories\Api\V1;

use App\Models\Employee;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class EmployeeRepository
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = Employee::query()->orderBy('last_name')->orderBy('first_name');

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * @return Collection<int, Employee>
     */
    public function getAll(): Collection
    {
        return Employee::query()->orderBy('last_name')->orderBy('first_name')->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Employee
    {
        return Employee::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Employee $employee, array $data): Employee
    {
        $employee->update($data);

        return $employee->fresh();
    }

    public function delete(Employee $employee): void
    {
        $employee->delete();
    }
}
