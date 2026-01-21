<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleResource extends JsonResource
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
            'unit'              => $this->whenLoaded('unit', function () {
                return new UnitResource($this->unit);
            }),
            'make'              => $this->make,
            'model'             => $this->model,
            'year'              => $this->year,
            'license_plate'     => $this->license_plate,
            'color'             => $this->color,
            'document'          => $this->whenLoaded('document', function () {
                return new DocumentResource($this->document);
            }),
            // 'stickers'          => $this->whenLoaded('stickers', function () {
            //     return StickerIssueResource::collection($this->stickers);
            // }),
            'created_at'        => \Carbon\Carbon::parse($this->created_at)->toFormattedDateString(),
            'updated_at'        => \Carbon\Carbon::parse($this->updated_at)->toFormattedDateString(),
        ];
    }
}
