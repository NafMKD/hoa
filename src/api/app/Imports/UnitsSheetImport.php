<?php

namespace App\Imports;

use App\Models\Building;
use App\Models\Unit;
use App\Models\User;
use App\Models\UnitOwner;
use App\Models\UnitLease;
use App\Support\ImportDocuments;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

// Optional if you want strict enum validation from your Controller constants
use App\Http\Controllers\Controller as AppController;

class UnitsSheetImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    /**
     * For UI display.
     * Each item can include unit_name or phone so your dialog can show both.
     *
     * Example:
     * ['unit_name' => 'Unit 101', 'reason' => 'Building not found']
     * ['phone' => '+2519xxxx', 'unit_name' => 'Unit 101', 'reason' => 'Owner not found']
     */
    public array $failedItems = [];

    private int $placeholderOwnershipDocId;

    public function __construct(private int $actorId)
    {
        $this->placeholderOwnershipDocId = ImportDocuments::ownershipPlaceholderId();
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $data = $row->toArray();

            $unitName = isset($data['name']) ? trim((string)$data['name']) : '';
            $buildingName = isset($data['building_name']) ? trim((string)$data['building_name']) : '';

            try {
                $this->validateUnitRow($data);

                // Building must exist (because floors/units_per_floor are NOT NULL)
                $building = Building::where('name', $buildingName)->first();
                if (!$building) {
                    throw new \Exception("Building not found: {$buildingName}");
                }

                // Upsert Unit by global unique name
                $unit = Unit::withTrashed()->where('name', $unitName)->first();

                $unitPayload = [
                    'building_id' => $building->id,
                    'name' => $unitName,
                    'floor_number' => (int) $data['floor_number'],
                    'unit_type' => $data['unit_type'] ?? null,
                    'size_m2' => $data['size_m2'] ?? null,
                    'status' => $data['status'] ?? 'vacant',
                ];

                if (!$unit) {
                    $unit = Unit::create($unitPayload);
                } else {
                    if ($unit->trashed()) $unit->restore();
                    $unit->update($unitPayload);
                }

                // Owners + Leases are optional per row
                $this->handleOwners($unit, $data);
                $this->handleLease($unit, $data);

            } catch (\Throwable $e) {
                $this->failedItems[] = [
                    'unit_name' => $unitName ?: '(missing unit name)',
                    'reason' => $this->cleanReason($e->getMessage()),
                ];
                continue;
            }
        }
    }

    private function validateUnitRow(array $data): void
    {
        $rules = [
            'name' => 'required|string',
            'building_name' => 'required|string',
            'floor_number' => 'required|integer',

            'unit_type' => 'nullable|string',
            'size_m2' => 'nullable|numeric',
            'status' => 'nullable|string',

            // Ownership
            'owner_phones' => 'nullable|string',
            'ownership_start_date' => 'nullable|date',
            'ownership_end_date' => 'nullable|date',
            'ownership_status' => 'nullable|string',
            'ownership_file_code' => 'nullable|string',

            // Lease
            'tenant_phone' => 'nullable|string',
            'representative_phone' => 'nullable|string',
            'agreement_type' => 'nullable|string',
            'agreement_amount' => 'nullable|numeric',
            'lease_start_date' => 'nullable|date',
            'lease_end_date' => 'nullable|date',
            'lease_status' => 'nullable|string',

            'witness_1_full_name' => 'nullable|string',
            'witness_2_full_name' => 'nullable|string',
            'witness_3_full_name' => 'nullable|string',
            'notes' => 'nullable|string',
        ];

        // Optional stricter enum checks if you want:
        if (defined(AppController::class.'::_UNIT_TYPES')) {
            $rules['unit_type'] = 'nullable|in:'.implode(',', AppController::_UNIT_TYPES);
        }
        if (defined(AppController::class.'::_UNIT_STATUSES')) {
            $rules['status'] = 'nullable|in:'.implode(',', AppController::_UNIT_STATUSES);
        }
        if (defined(AppController::class.'::_LEASE_AGREEMENT_TYPES')) {
            $rules['agreement_type'] = 'nullable|in:'.implode(',', AppController::_LEASE_AGREEMENT_TYPES);
        }
        if (defined(AppController::class.'::_LEASE_STATUS')) {
            $rules['lease_status'] = 'nullable|in:'.implode(',', AppController::_LEASE_STATUS);
        }

        Validator::make($data, $rules)->validate();

        // Conditional requirements (based on your NOT NULL schema)
        if (!empty($data['owner_phones']) && empty($data['ownership_start_date'])) {
            throw new \Exception("ownership_start_date is required when owner_phones is provided.");
        }

        if (!empty($data['tenant_phone'])) {
            if (empty($data['agreement_amount'])) {
                throw new \Exception("agreement_amount is required when tenant_phone is provided.");
            }
            if (empty($data['lease_start_date'])) {
                throw new \Exception("lease_start_date is required when tenant_phone is provided.");
            }
        }
    }

    private function handleOwners(Unit $unit, array $data): void
    {
        if (empty($data['owner_phones'])) return;

        $startDate = $data['ownership_start_date'];
        $endDate = $data['ownership_end_date'] ?? null;
        $status = $data['ownership_status'] ?? 'active';

        $phones = collect(explode(';', (string)$data['owner_phones']))
            ->map(fn($p) => trim($p))
            ->filter()
            ->unique();

        foreach ($phones as $phone) {
            try {
                $owner = User::withTrashed()->where('phone', $phone)->first();
                if (!$owner) {
                    throw new \Exception("Owner not found for phone {$phone}");
                }
                if ($owner->trashed()) $owner->restore();

                // NOTE: You could later resolve ownership_file_code -> documents table.
                $ownershipFileId = $this->placeholderOwnershipDocId;

                UnitOwner::withTrashed()->updateOrCreate(
                    [
                        'unit_id' => $unit->id,
                        'user_id' => $owner->id,
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    [
                        'status' => $status,
                        'ownership_file_id' => $ownershipFileId,
                        'created_by' => $this->actorId,
                        'updated_by' => $this->actorId,
                    ]
                );

            } catch (\Throwable $e) {
                $this->failedItems[] = [
                    'unit_name' => $unit->name,
                    'phone' => $phone,
                    'reason' => $this->cleanReason($e->getMessage()),
                ];
                continue;
            }
        }
    }

    private function handleLease(Unit $unit, array $data): void
    {
        if (empty($data['tenant_phone'])) return;

        $tenantPhone = trim((string)$data['tenant_phone']);
        $repPhone = !empty($data['representative_phone'])
            ? trim((string)$data['representative_phone'])
            : null;

        try {
            $tenant = User::withTrashed()->where('phone', $tenantPhone)->first();
            if (!$tenant) {
                throw new \Exception("Tenant not found for phone {$tenantPhone}");
            }
            if ($tenant->trashed()) $tenant->restore();

            $rep = null;
            if ($repPhone) {
                $rep = User::withTrashed()->where('phone', $repPhone)->first();
                if (!$rep) {
                    throw new \Exception("Representative not found for phone {$repPhone}");
                }
                if ($rep->trashed()) $rep->restore();
            }

            $leaseStart = $data['lease_start_date'];
            $leaseEnd = $data['lease_end_date'] ?? null;

            UnitLease::withTrashed()->updateOrCreate(
                [
                    'unit_id' => $unit->id,
                    'tenant_id' => $tenant->id,
                    'lease_start_date' => $leaseStart,
                    'lease_end_date' => $leaseEnd,
                ],
                [
                    'representative_id' => $rep?->id,
                    'representative_document_id' => null,
                    'agreement_type' => $data['agreement_type'] ?? 'owner',
                    'agreement_amount' => $data['agreement_amount'],
                    'lease_template_id' => null,
                    'lease_document_id' => null,
                    'status' => $data['lease_status'] ?? 'draft',
                    'witness_1_full_name' => $data['witness_1_full_name'] ?? null,
                    'witness_2_full_name' => $data['witness_2_full_name'] ?? null,
                    'witness_3_full_name' => $data['witness_3_full_name'] ?? null,
                    'notes' => $data['notes'] ?? null,
                    'created_by' => $this->actorId,
                    'updated_by' => $this->actorId,
                ]
            );

        } catch (\Throwable $e) {
            $this->failedItems[] = [
                'unit_name' => $unit->name,
                'phone' => $tenantPhone,
                'reason' => $this->cleanReason($e->getMessage()),
            ];
        }
    }

    private function cleanReason(string $message): string
    {
        $msg = trim($message);

        $msg = str_replace('The name field is required.', 'Unit name is required.', $msg);
        $msg = str_replace('The building name field is required.', 'Building name is required.', $msg);
        $msg = str_replace('The floor number field is required.', 'Floor number is required.', $msg);

        return $msg;
    }
}
