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
            'payment_number'           => $this->payment_number,
            'invoice_id'               => $this->invoice_id,
            'amount'                   => $this->amount,
            'method'                   => $this->method,
            'reference'                => $this->reference,
            'status'                   => $this->status,
            'processed_at'             => $this->processed_at,
            'payment_date'             => $this->payment_date,
            'reconciliation_metadata'  => $this->reconciliation_metadata,
            'payment_screen_shoot_id'  => $this->payment_screen_shoot_id,
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
