<?php

namespace App\Http\Resources\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UnitResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'building'        => $this->whenLoaded('building', function () {
                return new BuildingResource($this->building);
            }), 
            'name'             => $this->name,
            'floor_number'     => $this->floor_number,
            'owner'           => $this->whenLoaded('owner', function () {
                return new UserResource($this->owner);
            }),
            'tenant'           => function () {
                if ($this->status === Controller::_UNIT_STATUS[0]) return new UserResource($this->tenant());
                return null;
            },
            'unit_type'        => $this->unit_type,
            'type_name'        => $this->type(),
            'size_m2'          => $this->size_m2,
            'status'           => $this->status,
            'ownership_file'  => $this->whenLoaded('ownershipFile', function () {
                return new DocumentResource($this->ownershipFile);
            }),
            'leases'           => $this->whenLoaded('leases'),
            'created_at'       => $this->created_at,
            'updated_at'       => $this->updated_at,
        ];
    }
}
