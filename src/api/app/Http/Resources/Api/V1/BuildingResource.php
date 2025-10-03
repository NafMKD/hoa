<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BuildingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'floors'         => $this->floors,
            'units_per_floor'=> $this->units_per_floor,
            'address'        => $this->address,
            'notes'          => $this->notes,
            // 'units'          => $this->whenLoaded('units', function () {
            //     return new UnitResource($this->idFile);
            // }),
            'created_at'     => $this->created_at,
            'updated_at'     => $this->updated_at,
        ];
    }
}
