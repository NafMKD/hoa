<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
            'path'          => $this->path,
            'placeholders'  => $this->placeholders,
            'description'   => $this->description,
            'version'       => $this->version,
            'created_by'    => $this->whenLoaded('creator', function () {
                return new UserResource($this->creator);
            }),
            'updated_by'    => $this->whenLoaded('updater', function () {
                return new UserResource($this->updater);
            }),
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at,
        ];
    }
}
