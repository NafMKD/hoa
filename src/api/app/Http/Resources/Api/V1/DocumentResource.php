<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'file_path'    => $this->file_path,
            'file_name'    => $this->file_name,
            'mime_type'    => $this->mime_type,
            'file_size'    => $this->file_size,
            'category'     => $this->category,
            'uploaded_at'  => $this->uploaded_at?->toDateTimeString(),

            // Optionally include related models
            'users'        => $this->whenLoaded('users'),
            'payslips'     => $this->whenLoaded('payslip'),
            'payments'     => $this->whenLoaded('payments'),
            'tenant_leases'=> $this->whenLoaded('tenantLeases'),
            'vehicles'     => $this->whenLoaded('vehicles'),
            'stickers'     => $this->whenLoaded('stickers'),
        ];
    }
}
