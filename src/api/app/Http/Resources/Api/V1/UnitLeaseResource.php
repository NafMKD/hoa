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
            'lease_start_date'          => $this->lease_start_date,
            'lease_end_date'            => $this->lease_end_date,
            'status'                    => ucwords(str_replace('_', ' ', $this->status)),
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
            'created_at'                => $this->created_at,
            'updated_at'                => $this->updated_at,
        ];
    }
}
