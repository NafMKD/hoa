<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReconciliationEscalationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'reason'              => $this->reason,
            'status'              => $this->status,
            'resolution_notes'   => $this->resolution_notes,
            'resolved_at'         => $this->resolved_at?->toIso8601String(),
            'payment'            => $this->whenLoaded('payment', fn () => new PaymentResource($this->payment)),
            'bank_transaction'   => $this->whenLoaded('bankTransaction', fn () => new BankTransactionResource($this->bankTransaction)),
            'resolver'           => $this->whenLoaded('resolver', fn () => new UserResource($this->resolver)),
            'created_at'         => $this->created_at?->toIso8601String(),
            'updated_at'         => $this->updated_at?->toIso8601String(),
        ];
    }
}
