<?php

namespace App\Rules;

use App\Models\UnitOwner;
use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

class UniqueUnitOwner implements ValidationRule, DataAwareRule
{
    protected array $data = [];

    public function __construct(protected int $unitId)
    {
    }

    public function setData(array $data): static
    {
        $this->data = $data;
        return $this;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // $attribute is 'user_id', so $value is the user ID
        $userId    = $value;
        $startDate = $this->data['start_date'] ?? null;
        $endDate   = $this->data['end_date'] ?? null;

        $query = UnitOwner::query()
            ->where('unit_id', $this->unitId)
            ->where('user_id', $userId)
            ->where('start_date', $startDate)
            ->where('end_date', $endDate);

        if (!empty($this->data['unit_owner_id'])) {
            $query->where('id', '!=', $this->data['unit_owner_id']);
        }

        if ($query->exists()) {
            $fail($this->message());
        }
    }

    public function message(): string
    {
        return 'This user is already registered as an owner for this unit with the same start and end dates.';
    }
}
