<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\UnitLease;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use App\Models\Document;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UnitLeaseRepository
{
    protected DocumentTemplateRepository $templates;
    protected UserRepository $user;
    protected DocumentRepository $documentRepository;

    public function __construct(DocumentTemplateRepository $templates, UserRepository $user, DocumentRepository $documentRepository)
    {
        $this->templates = $templates;
        $this->user = $user;
        $this->documentRepository = $documentRepository;
    }

    /**
     * Create a new unit lease.
     * 
     * @param Unit $unit
     * @param array<string, mixed> $data
     * @return UnitLease
     */
    public function create(Unit $unit, array $data): UnitLease
    {       
        try {
            
            DB::beginTransaction();

            $createdBy = Auth::id();

            $createTenant = function () use ($data, $createdBy) {
                return $this->user->create([
                    'first_name'    => $data['tenant_first_name'],
                    'last_name'     => $data['tenant_last_name'],
                    'phone'         => $data['tenant_phone'],
                    'email'         => $data['tenant_email'] ?? null,
                    'city'          => $data['tenant_city'] ?? null,
                    'sub_city'      => $data['sub_city'] ?? null,
                    'woreda'        => $data['woreda'] ?? null,
                    'house_number'  => $data['house_number'] ?? null,
                    'role'          => 'tenant',
                    'id_file'       => $data['tenant_id_file'] ?? null,
                    'created_by'    => $createdBy,
                ]);
            };

            $createRepresentative = function () use ($data, $createdBy) {
                return $this->user->create([
                    'first_name'    => $data['representative_first_name'],
                    'last_name'     => $data['representative_last_name'],
                    'phone'         => $data['representative_phone'],
                    'email'         => $data['representative_email'] ?? null,
                    'city'          => $data['representative_city'] ?? null,
                    'sub_city'      => $data['representative_sub_city'] ?? null,
                    'woreda'        => $data['representative_woreda'] ?? null,
                    'house_number'  => $data['representative_house_number'] ?? null,
                    'role'          => 'representative',
                    'id_file'       => $data['representative_id_file'] ?? null,
                    'created_by'    => $createdBy,
                ]);
            };

            $leaseCommon = [
                'agreement_type'                => $data['leasing_by'],
                'agreement_amount'              => $data['agreement_amount'],
                'lease_template_id'             => $data['lease_template_id'],
                'lease_start_date'              => $data['lease_start_date'],
                'lease_end_date'                => $data['lease_end_date'] ?? null,
                'status'                        => 'draft',
                'witness_1_full_name'           => $data['witness_1_full_name'] ?? null,
                'witness_2_full_name'           => $data['witness_2_full_name'] ?? null,
                'witness_3_full_name'           => $data['witness_3_full_name'] ?? null,
                'notes'                         => $data['notes'] ?? null,
                'created_by'                    => $createdBy,
            ];

            $unitLease = null;

            /*
            |   1) leasing_by = owner, renter_type = existing
            |    - NO representative_type allowed
            |    - tenant_id is required
            */
            if ($data['leasing_by'] === 'owner' && $data['renter_type'] === 'existing') {
                // create lease
                $unitLease = $unit->leases()->create(array_merge($leaseCommon, [
                    'tenant_id'                     => $data['tenant_id'],
                    'representative_id'             => null,
                    'representative_document_id'    => null,
                    'lease_document_id'             => null, // TODO
                ]));
            }
            /*
            | 2) leasing_by = owner, renter_type = new
            |    - NO representative_type allowed
            |    - new tenant fields required (first_name, last_name, phone, optional email + file)
            */ 
            elseif ($data['leasing_by'] === 'owner' && $data['renter_type'] === 'new') {
                // 1. create tenant
                $tenant = $createTenant();

                // 2. create lease
                $unitLease = $unit->leases()->create(array_merge($leaseCommon, [
                    'tenant_id'                     => $tenant->id,
                    'representative_id'             => null,
                    'representative_document_id'    => null,
                    'lease_document_id'             => null, // TODO
                ]));
            }
            /*
            | 3) leasing_by = representative, renter_type = existing
            |    - tenant_id required
            |    - representative_id required
            */ 
            elseif ($data['leasing_by'] === 'representative' && $data['renter_type'] === 'existing') {
                if (isset($data['lease_representative_document'])) {
                    $representativeDocument = $this->documentRepository->create(
                        $data['lease_representative_document'],
                        Controller::_DOCUMENT_TYPES[7]
                    );
                    $data['representative_document_id'] = $representativeDocument->id;
                } 
                /*
                | 3.1) representative_type = existing
                */
                if ($data['representative_type'] === 'existing') {
                    // create lease
                    $unitLease = $unit->leases()->create(array_merge($leaseCommon, [
                        'tenant_id'                     => $data['tenant_id'],
                        'representative_id'             => $data['representative_id'],
                        'representative_document_id'    => $data['representative_document_id'], 
                        'lease_document_id'             => null, // TODO
                    ]));
                }
                /*
                | 3.2) representative_type = new
                |    - new representative fields required: first_name, last_name, phone, optional email
                */ elseif ($data['representative_type'] === 'new') {
                    // 1. create representative
                    $representative = $createRepresentative();

                    // 2. create lease
                    $unitLease = $unit->leases()->create(array_merge($leaseCommon, [
                        'tenant_id'                     => $data['tenant_id'],
                        'representative_id'             => $representative->id,
                        'representative_document_id'    => $data['representative_document_id'], // TODO
                        'lease_document_id'             => null, // TODO
                    ]));
                }
            }
            /*
            | 5) leasing_by = representative, renter_type = new
            |    - new tenant fields required
            |    - representative_id required
            */ 
            elseif ($data['leasing_by'] === 'representative' && $data['renter_type'] === 'new') {
                if (isset($data['lease_representative_document'])) {
                    $representativeDocument = $this->documentRepository->create(
                        $data['lease_representative_document'],
                        Controller::_DOCUMENT_TYPES[7]
                    );
                    $data['representative_document_id'] = $representativeDocument->id;
                }
                /*
                | 5.1) representative_type = existing
                */
                if ($data['representative_type'] === 'existing') {
                    // 1. create tenant
                    $tenant = $createTenant();

                    // 2. create lease
                    $unitLease = $unit->leases()->create(array_merge($leaseCommon, [
                        'tenant_id'                     => $tenant->id,
                        'representative_id'             => $data['representative_id'],
                        'representative_document_id'    => $data['representative_document_id'], 
                        'lease_document_id'             => null, // TODO
                    ]));
                }
                /*
                | 5.2) representative_type = new
                |    - new representative fields required
                */ elseif ($data['representative_type'] === 'new') {
                    // 1. create tenant
                    $tenant = $createTenant();

                    // 2. create representative
                    $representative = $createRepresentative();

                    // 3. create lease
                    $unitLease = $unit->leases()->create(array_merge($leaseCommon, [
                        'tenant_id'                     => $data['tenant_id'],
                        'representative_id'             => $representative->id,
                        'representative_document_id'    => $data['representative_document_id'], 
                        'lease_document_id'             => null, // TODO
                    ]));
                }
            }
            else {
                throw new RepositoryException('Invalid leasing_by or renter_type value.');
            }

            // change the unit status to rented
            $unit->status = Controller::_UNIT_STATUSES[0];
            $unit->save();

            // TODO: generate lease document
            // $unitLease = $this->generateLeaseDocument($unitLease);

            DB::commit();
            return $unitLease;
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Unit lease creation failed: ' . $e->getMessage());
            throw new RepositoryException('Failed to create unit lease ');
        }
    }

    /**
     * Soft delete a unit lease.
     * 
     * @param UnitLease $lease
     * @return bool|null
     */
    public function delete(UnitLease $lease): ?bool
    {
        return DB::transaction(function () use ($lease) {
            // Delete representative document if exists
            if ($lease->representativeDocument && Storage::disk('public')->exists($lease->representativeDocument->file_path)) {
                Storage::disk('public')->delete($lease->representativeDocument->file_path);
                $lease->representativeDocument->delete();
            }
            // Note: Lease document is not deleted to preserve records

            return $lease->delete();
        });
    }

    /**
     * Generate the lease document from the template and save it as a Document.
     *
     * @param UnitLease $lease
     * @return UnitLease
     * @throws RepositoryException
     */
    private function generateLeaseDocument(UnitLease $lease): UnitLease
    {
        if (!$lease->leaseTemplate) {
            throw new RepositoryException('Lease template not assigned.');
        }

        // Prepare data for placeholders
        $data = [
            // Owner Info
            'unit.owner.full_name' => $lease->unit->currentOwner->full_name ?? '',
            // Representative Info
            'representative.full_name' => $lease->representative->full_name ? "( {$lease->representative->full_name} )" : '',

            // Tenant Info
            'tenant.full_name' => $lease->tenant->full_name ?? '',
            'tenant.city' => $lease->tenant->city ?? '',
            'tenant.sub_city' => $lease->tenant->sub_city ?? '',
            'tenant.woreda' => $lease->tenant->woreda ?? '',
            'tenant.house_number' => $lease->tenant->house_number ?? '',
            'tenant.phone' => $lease->tenant->phone ?? '',

            // Unit / House Info
            'unit.building.name' => $lease->unit->building->name ?? '',
            'unit.name' => $lease->unit->name ?? '',
            'unit.unit_type' => $lease->unit->unit_type ?? '',

            // Lease Info
            'agreement_amount' => $lease->agreement_amount ?? '',
            'amount_in_words' => $lease->amount_in_words,
            'lease_term_in_years' => $lease->lease_term_in_years ?? '',

            // Date
            'today_date' => now()->format('Y-m-d'),

            // Witnesses
            'witness_1_full_name' => $lease->witness_1_full_name ?? '',
            'witness_2_full_name' => $lease->witness_2_full_name ?? '',
        ];

        // check if the type is owner
        if ($lease->agreement_type === 'owner') {
            $data['unit.lessor.name'] = $lease->unit->currentOwner->full_name ?? '';
            $data['unit.owner.city'] = $lease->unit->currentOwner->city ?? '';
            $data['unit.owner.sub_city'] = $lease->unit->currentOwner->sub_city ?? '';
            $data['unit.owner.woreda'] = $lease->unit->currentOwner->woreda ?? '';
            $data['unit.owner.house_number'] = $lease->unit->currentOwner->house_number ?? '';
            $data['unit.owner.phone'] = $lease->unit->currentOwner->phone ?? '';
        } elseif ($lease->agreement_type === 'representative') {
            $data['unit.lessor.name'] = $lease->representative->full_name ?? '';
            $data['unit.owner.city'] = $lease->representative->city ?? '';
            $data['unit.owner.sub_city'] = $lease->representative->sub_city ?? '';
            $data['unit.owner.woreda'] = $lease->representative->woreda ?? '';
            $data['unit.owner.house_number'] = $lease->representative->house_number ?? '';
            $data['unit.owner.phone'] = $lease->representative->phone ?? '';
        }

        // Only keep allowed placeholders
        $allowedPlaceholders = $lease->leaseTemplate->placeholders;
        $filteredData = [];
        foreach ($allowedPlaceholders as $key) {
            $filteredData[$key] = $data[$key] ?? '';
        }

        // Generate PDF via template repository
        $path = $this->templates->generate($lease->leaseTemplate, $filteredData);

        // Save generated document
        $document = $this->documentRepository->createFromPath(
            $path,
            Controller::_DOCUMENT_TYPES[4] 
        );

        // Update lease with generated document
        $lease->lease_document_id = $document->id;
        $lease->save();

        return $lease->fresh();
    }

    /**
     * Activate draft lease by ID.
     * 
     * @param UnitLease $lease
     * @return UnitLease
     */
    public function activateDraftLease(UnitLease $lease): UnitLease
    {
        DB::beginTransaction();

        try {
            if ($lease->status !== 'draft') {
                throw new RepositoryException('Only draft leases can be activated.');
            }

            $lease->status = 'active';

            // update unit status
            $unit = $lease->unit;
            if ($unit) {
                $unit->status = Controller::_UNIT_STATUSES[0];
                $unit->save();
            }
            $lease->updated_by = Auth::id();

            $lease->save();

            DB::commit();
            return $lease;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to activate draft lease');
        }
    }

    /**
     * Deactivate expired leases.
     * 
     * @return int Number of leases deactivated
     * @throws RepositoryException
     */
    public function deactivateExpiredLeases(): int
    {
        DB::beginTransaction();
        try {
            $now = now();
            $expiredLeases = UnitLease::where('status', 'active')
                ->where('end_date', '<', $now)
                ->get();

            foreach ($expiredLeases as $lease) {
                $lease->status = 'expired';
                $lease->updated_by = Auth::id();
                $lease->save();

                $unit = $lease->unit;
                if ($unit && $unit->status === Controller::_UNIT_STATUSES[0]) {
                    $unit->status = Controller::_UNIT_STATUSES[2];
                    $unit->save();
                }
            }

            DB::commit();
            return $expiredLeases->count();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to deactivate expired leases ');
        }
    }

    /**
     * Terminate a lease by ID.
     * 
     * @param UnitLease $lease
     * @return UnitLease
     * @throws RepositoryException
     */
    public function terminateLeaseById(UnitLease $lease): UnitLease
    {
        DB::beginTransaction();

        try {
            if ($lease->status !== 'active') {
                throw new RepositoryException('Only active leases can be terminated.');
            }

            $lease->status = 'terminated';
            if ($lease->lease_end_date === null) {
                $lease->lease_end_date = now();
            }
            $lease->save();

            // update unit status
            $unit = $lease->unit;
            if ($unit) {
                $unit->status = Controller::_UNIT_STATUSES[2];
                $unit->save();
            }

            $lease->updated_by = Auth::id();

            DB::commit();
            return $lease;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to terminate lease ');
        }
    }
    
}
