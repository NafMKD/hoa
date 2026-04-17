<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StickerIssueResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vehicle_id' => $this->vehicle_id,
            'replaces_sticker_issue_id' => $this->replaces_sticker_issue_id,
            'sticker_code' => $this->sticker_code,
            'lookup_token' => $this->lookup_token,
            'status' => $this->status,
            'issued_at' => $this->issued_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'replacement_invoice_id' => $this->replacement_invoice_id,
            'lost_penalty_invoice_id' => $this->lost_penalty_invoice_id,
            'vehicle' => $this->whenLoaded('vehicle', function () {
                return new VehicleResource($this->vehicle);
            }),
            'replacement_invoice' => $this->whenLoaded('replacementInvoice', function () {
                return new InvoiceResource($this->replacementInvoice);
            }),
            'lost_penalty_invoice' => $this->whenLoaded('lostPenaltyInvoice', function () {
                return new InvoiceResource($this->lostPenaltyInvoice);
            }),
            'issuer' => $this->whenLoaded('issuer', function () {
                return new UserResource($this->issuer);
            }),
            'qr_code' => $this->whenLoaded('qrCode', function () {
                return new DocumentResource($this->qrCode);
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
