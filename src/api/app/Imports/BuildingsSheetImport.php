<?php

namespace App\Imports;

use App\Http\Controllers\Controller;
use App\Models\Building;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class BuildingsSheetImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    /**
     * For UI display.
     * Each item: ['name' => string, 'reason' => string]
     */
    public array $failedBuildings = [];

    public function __construct(private int $actorId)
    {
        // actorId reserved for audit usage if needed later
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $data = $row->toArray();

            $name = isset($data['name']) ? trim((string) $data['name']) : '';

            try {
                // Schema alignment:
                // name required + unique
                // floors NOT NULL
                // units_per_floor NOT NULL
                Validator::make($data, [
                    'name' => 'required|string',
                    'floors' => 'required|integer|min:0',
                    'units_per_floor' => 'required|integer|min:0',
                    'address' => 'nullable|string',
                    'notes' => 'nullable|string',
                ])->validate();

                // Include soft-deleted, so re-import can "revive" records
                $building = Building::withTrashed()->where('name', $name)->first();

                $payload = [
                    'name' => $name,
                    'floors' => (int) $data['floors'],
                    'units_per_floor' => (int) $data['units_per_floor'],
                    'address' => $data['address'] ?? Controller::_DEFAULT_ADDRESS,
                    'notes' => $data['notes'] ?? null,
                ];

                if (!$building) {
                    Building::create($payload);
                } else {
                    if ($building->trashed()) {
                        $building->restore();
                    }
                    $building->update($payload);
                }

            } catch (\Throwable $e) {
                $this->failedBuildings[] = [
                    'name' => $name ?: '(missing name)',
                    'reason' => $this->cleanReason($e->getMessage()),
                ];
                continue;
            }
        }
    }

    private function cleanReason(string $message): string
    {
        $msg = trim($message);

        // Optional: friendlier validation messages
        $msg = str_replace('The name field is required.', 'Name is required.', $msg);
        $msg = str_replace('The floors field is required.', 'Floors is required.', $msg);
        $msg = str_replace('The units per floor field is required.', 'Units per floor is required.', $msg);

        return $msg;
    }
}
