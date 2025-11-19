<?php

namespace App\Rules;

use App\Models\UnitOwner;
use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

class UniqueUnitOwner implements ValidationRule, DataAwareRule
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
     * @param string $attribute
     * @param mixed $value
     * @param \Closure(string): void $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $unitId = $this->data['unit_id'] ?? null;
        $userId = $this->data['user_id'] ?? null;
        $startDate = $this->data['start_date'] ?? null;
        $endDate = $this->data['end_date'] ?? null;

        $query = UnitOwner::query()
            ->where('unit_id', $unitId)
            ->where('user_id', $userId)
            ->where('start_date', $startDate)
            ->where('end_date', $endDate);

        // Exclude current record if updating
        if (!empty($this->data['unit_owner_id'])) {
            $query->where('id', '!=', $this->data['unit_owner_id']);
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
        return 'This user is already registered as an owner for this unit with the same start and end dates.';
    }
}
