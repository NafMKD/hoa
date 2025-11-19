<?php

namespace App\Rules;

use App\Models\UnitLease;
use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

class UniqueUnitLease implements ValidationRule, DataAwareRule
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
        $unitId = $this->data['unit_id'] ?? null;
        $tenantId = $this->data['tenant_id'] ?? null;
        $startDate = $this->data['lease_start_date'] ?? null;
        $endDate = $this->data['lease_end_date'] ?? null;

        $query = UnitLease::query()
            ->where('unit_id', $unitId)
            ->where('tenant_id', $tenantId)
            ->where('lease_start_date', $startDate)
            ->where('lease_end_date', $endDate);

        // Exclude current lease if updating
        if (!empty($this->data['lease_id'])) {
            $query->where('id', '!=', $this->data['lease_id']);
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
        return 'This tenant already has a lease for this unit with the same start and end dates.';
    }
}
