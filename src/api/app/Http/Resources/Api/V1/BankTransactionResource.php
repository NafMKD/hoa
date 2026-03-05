<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BankTransactionResource extends JsonResource
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
            'amount'           => $this->amount,
            'reference'        => $this->reference,
            'transaction_date' => $this->transaction_date?->toDateString(),
            'description'      => $this->description,
            'status'           => $this->status,
            'matched_payment'  => $this->whenLoaded('matchedPayment', fn () => new PaymentResource($this->matchedPayment)),
            'created_at'       => $this->created_at?->toIso8601String(),
            'updated_at'       => $this->updated_at?->toIso8601String(),
        ];
    }
}
