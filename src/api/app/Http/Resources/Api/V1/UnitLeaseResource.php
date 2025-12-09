<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UnitLeaseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                        => $this->id,
            'unit'                      => $this->whenLoaded('unit', function () {
                return new UnitResource($this->unit);
            }),
            'tenant'                    => $this->whenLoaded('tenant', function () {
                return new UserResource($this->tenant);
            }),
            'representative'            => $this->whenLoaded('representative', function () {
                return new UserResource($this->representative);
            }),
            'representative_document'   => $this->whenLoaded('representativeDocument', function () {
                return new DocumentResource($this->representativeDocument);
            }),
            'agreement_type'            => $this->agreement_type,
            'agreement_amount'          => $this->agreement_amount,
            'lease_template'            => $this->whenLoaded('leaseTemplate', function () {
                return new DocumentTemplateResource($this->leaseTemplate);
            }),
            'lease_document'            => $this->whenLoaded('document', function () {
                return new DocumentResource($this->document);
            }),
            'lease_start_date'          => \Carbon\Carbon::parse($this->lease_start_date)->toFormattedDateString(),
            'lease_end_date'            => \Carbon\Carbon::parse($this->lease_end_date)->toFormattedDateString(),
            'status'                    => $this->status,
            'witness_1_full_name'       => $this->witness_1_full_name,
            'witness_2_full_name'       => $this->witness_2_full_name,
            'witness_3_full_name'       => $this->witness_3_full_name,
            'notes'                     => $this->notes,
            'created_by'                => $this->whenLoaded('creator', function () {
                return new UserResource($this->creator);
            }),
            'updated_by'                => $this->whenLoaded('updater', function () {
                return new UserResource($this->updater);
            }),
            'created_at'       => \Carbon\Carbon::parse($this->created_at)->toFormattedDateString(),
            'updated_at'       => \Carbon\Carbon::parse($this->updated_at)->toFormattedDateString(),
        ];
    }
}
