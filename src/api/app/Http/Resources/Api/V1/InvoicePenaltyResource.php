<?php

namespace App\Http\Resources\Api\V1;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoicePenaltyResource extends JsonResource
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
            'invoice'           => $this->whenLoaded('invoice', function () {
                return new InvoiceResource($this->invoice);
            }),
            'amount'            => $this->amount,
            'applied_date'      => Carbon::parse($this->applied_date)->toFormattedDateString(),
            'reason'            => $this->reason,
            'created_at'        => Carbon::parse($this->created_at)->toFormattedDateString(),
            'updated_at'        => Carbon::parse($this->updated_at)->toFormattedDateString(),
        ];
    }
}
