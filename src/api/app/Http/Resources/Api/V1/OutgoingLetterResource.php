<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OutgoingLetterResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'letter_number' => $this->letter_number,
            'title' => $this->title,
            'description' => $this->description,
            'unit_id' => $this->unit_id,
            'recipient_name' => $this->recipient_name,
            'scanned_document_id' => $this->scanned_document_id,
            'unit' => $this->whenLoaded('unit', function () {
                return $this->unit
                    ? new UnitResource($this->unit)
                    : null;
            }),
            'creator' => $this->whenLoaded('creator', function () {
                return new UserResource($this->creator);
            }),
            'scan' => $this->whenLoaded('scannedDocument', function () {
                return $this->scannedDocument
                    ? new DocumentResource($this->scannedDocument)
                    : null;
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
