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
            'building'         => $this->whenLoaded('building', function () {
                return new IdNameResource($this->building);
            }),
            'name'             => $this->name,
            'floor_number'     => $this->floor_number,
            'owners'           => $this->whenLoaded('owners'),
            'currentOwner'     => $this->whenLoaded('currentOwner'),
            'unit_type'        => $this->unit_type,
            'type_name'        => $this->type,
            'size_m2'          => $this->size_m2,
            'status'           => $this->status,
            'status_name'      => ucwords(str_replace('_', ' ', $this->status)),
            'isRentable'       => $this->isRentable,
            'currentLease'     => $this->whenLoaded('currentLease'),
            'leases'           => $this->whenLoaded('leases'),
            'invoices'         => $this->whenLoaded('invoices'),
            'vehicles'         => $this->whenLoaded('vehicles'),
            'created_at'       => \Carbon\Carbon::parse($this->created_at)->toFormattedDateString(),
            'updated_at'       => \Carbon\Carbon::parse($this->updated_at)->toFormattedDateString(),
        ];
    }
}
