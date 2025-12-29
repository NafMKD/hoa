<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                       => $this->id,
            'amount'                   => $this->amount,
            'method'                   => $this->method,
            'reference'                => $this->reference,
            'status'                   => $this->status,
            'type'                     => $this->type,
            'processed_by'             => $this->processed_by,
            'processed_at'             => $this->processed_at,
            'receipt_number'           => $this->receipt_number,
            'payment_date'             => $this->payment_date,
            'reconciliation_metadata'  => $this->reconciliation_metadata,
            'invoice'                  => $this->whenLoaded('invoice', function () {
                return new InvoiceResource($this->invoice);
            }),
            'screenshot'               => $this->whenLoaded('screenshot', function () {
                return new DocumentResource($this->screenshot);
            }),
            'created_at'               => $this->created_at,
            'updated_at'               => $this->updated_at,
        ];
    }
}
