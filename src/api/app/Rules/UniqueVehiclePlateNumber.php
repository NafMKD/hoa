<?php

namespace App\Rules;

use App\Models\Vehicle;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class UniqueVehiclePlateNumber implements ValidationRule
{
    protected array $data = [];

    /**
     * Set the data for DataAwareRule.
     */
    public function setData(array $data): self
    {
        $this->data = $data;
        return $this;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $unitId = $this->data['unit_id'] ?? null;

        $query = Vehicle::query()
            ->where('unit_id', $unitId)
            ->where('license_plate', $value);

        // If updating, exclude the current unit from the check
        if (!empty($this->data['vehicle_id'])) {
            $query->where('id', '!=', $this->data['vehicle_id']);
        }

        if ($query->exists()) {
            $fail($this->message());
        }
    }

    /**
     * Custom validation message.
     */
    public function message(): string
    {
        return 'A vehicle with this license plate already exists in the selected unit.';
    }
}
