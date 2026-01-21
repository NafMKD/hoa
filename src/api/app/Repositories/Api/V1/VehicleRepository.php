<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VehicleRepository
{

    public function __construct(protected DocumentRepository $documentRepository)
    {
    }

    /**
     * Get all vehicles with optional pagination.
     *
     * @param int|null $perPage
     * @param array $filters
     * @return Collection|LengthAwarePaginator
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = Vehicle::query();

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('make', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('year', 'like', "%{$search}%")
                    ->orWhere('license_plate', 'like', "%{$search}%")
                    ->orWhere('color', 'like', "%{$search}%");
            });
        }

        $query->orderBy('created_at', 'desc');

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * Create a new vehicle record.
     *
     * @param array<string, mixed> $data
     * @return Vehicle
     * @throws RepositoryException
     */
    public function create(array $data): Vehicle
    {
        DB::beginTransaction();

        try {
            if (isset($data['vehicle_document'])) {
                $document = $this->documentRepository->create(
                    $data['vehicle_document'],
                    Controller::_DOCUMENT_TYPES[5]
                );

                $data['vehicle_document_id'] = $document->id;
            }

            $vehicle = Vehicle::create($data);

            DB::commit();
            return $vehicle;
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Vehicle creation failed: " . $e->getMessage());
            throw new RepositoryException('Failed to create vehicle: ' . $e->getMessage());
        }
    }

    /**
     * Update an existing vehicle.
     *
     * @param Vehicle $vehicle
     * @param array<string, mixed> $data
     * @return Vehicle
     * @throws RepositoryException
     */
    public function update(Vehicle $vehicle, array $data): Vehicle
    {
        DB::beginTransaction();

        try {

            if (isset($data['vehicle_document'])) {
                // delete old vehicle_document if exist 
                if ($vehicle->document) {
                    $this->documentRepository->delete($vehicle->document);
                }

                $document = $this->documentRepository->create(
                    $data['vehicle_document'],
                    Controller::_DOCUMENT_TYPES[5] 
                );

                $data['vehicle_document_id'] = $document->id;
            }
            
            $vehicle->update($data);

            DB::commit();
            return $vehicle;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to update vehicle: ' . $e->getMessage());
        }
    }

    /**
     * Soft delete a vehicle.
     *
     * @param Vehicle $vehicle
     * @return bool|null
     */
    public function delete(Vehicle $vehicle): ?bool
    {
        return DB::transaction(function () use($vehicle) {
            // TODO: Handle related data (e.g. sticker issues, document)
            $vehicle->delete();
        });
    }
}
