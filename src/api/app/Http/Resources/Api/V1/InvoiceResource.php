<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'invoice_number'    => $this->invoice_number,
            'user'              => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),
            'unit'              => $this->whenLoaded('unit', function () {
                return new UnitResource($this->unit);
            }),
            'fee'               => $this->whenLoaded('fee', function () {
                return new FeeResource($this->fee);
            }),
            // 'payments'          => $this->whenLoaded('payments', function () {
            //     return PaymentResource::collection($this->payments);
            // }),
            'issue_date'        => $this->issue_date,
            'due_date'          => $this->due_date,
            'total_amount'      => $this->total_amount,
            'amount_paid'       => $this->amount_paid,
            'penalty_amount'    => $this->penalty_amount,
            'status'            => $this->status,
            'source_type'       => $this->source_type,
            'source_id'         => $this->source_id,
            'metadata'          => $this->metadata,
            'created_at'        => $this->created_at,
            'updated_at'        => $this->updated_at,
        ];
    }
}
