<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UnitOwnerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'unit'               => $this->whenLoaded('unit', function () {
                return new UnitResource($this->unit);
            }),
            'owner'              => $this->whenLoaded('owner', function () {
                return new UserResource($this->owner);
            }),
            'ownership_document' => $this->whenLoaded('document', function () {
                return new DocumentResource($this->document);
            }),
            'start_date'       => \Carbon\Carbon::parse($this->start_date)->toFormattedDateString(),
            'end_date'       => $this->end_date ? \Carbon\Carbon::parse($this->end_date)->toFormattedDateString() : null,
            'status'             => ucwords(str_replace('_', ' ', $this->status)),
            'created_by'         => $this->whenLoaded('creator', function () {
                return new UserResource($this->creator);
            }),
            'updated_by'         => $this->whenLoaded('updater', function () {
                return new UserResource($this->updater);
            }),
            'created_at'       => \Carbon\Carbon::parse($this->created_at)->toFormattedDateString(),
            'updated_at'       => \Carbon\Carbon::parse($this->updated_at)->toFormattedDateString(),
        ];
    }
}
