<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AgencyPlacementResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'agency_id' => $this->agency_id,
            'line_of_work' => $this->line_of_work,
            'workers_count' => $this->workers_count,
            'effective_from' => $this->effective_from?->format('Y-m-d'),
            'effective_to' => $this->effective_to?->format('Y-m-d'),
            'is_active' => $this->is_active,
            'agency' => $this->whenLoaded('agency', function () {
                return new AgencyResource($this->agency);
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
