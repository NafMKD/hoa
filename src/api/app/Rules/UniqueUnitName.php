<?php

namespace App\Rules;

use App\Models\Unit;
use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

class UniqueUnitName implements ValidationRule, DataAwareRule
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
     * @param  string  $attribute
     * @param  mixed   $value
     * @param  \Closure(string): void  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $buildingId = $this->data['building_id'] ?? null;

        $query = Unit::query()
            ->where('building_id', $buildingId)
            ->where('name', $value);

        // If updating, exclude the current unit from the check
        if (!empty($this->data['unit_id'])) {
            $query->where('id', '!=', $this->data['unit_id']);
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
        return 'A unit with this name already exists in the selected building.';
    }
}
