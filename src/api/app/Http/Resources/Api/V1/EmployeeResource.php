<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => trim($this->first_name.' '.$this->last_name),
            'role' => $this->role,
            'employment_type' => $this->employment_type,
            'gross_salary' => $this->gross_salary,
            'hired_at' => $this->hired_at?->format('Y-m-d'),
            'terminated_at' => $this->terminated_at?->format('Y-m-d'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
