<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class DocumentTemplateResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'category'      => $this->category,
            'sub_category'  => $this->sub_category,
            'name'          => $this->name,
            'url'           => $this->url ? URL::to(Storage::url($this->path)) : null,
            'placeholders'  => $this->placeholders,
            'description'   => $this->description,
            'version'       => $this->version,
            'created_by'    => $this->whenLoaded('creator', function () {
                return new UserResource($this->creator);
            }),
            'updated_by'    => $this->whenLoaded('updater', function () {
                return new UserResource($this->updater);
            }),
            'created_at'    => \Carbon\Carbon::parse($this->created_at)->toFormattedDateString(),
            'updated_at'    => \Carbon\Carbon::parse($this->updated_at)->toFormattedDateString(),
        ];
    }
}
