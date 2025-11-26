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
            'url'          => $this->url,
            'file_path'    => $this->file_path,
            'file_name'    => $this->file_name,
            'mime_type'    => $this->mime_type,
            'file_size'    => $this->file_size,
            'category'     => $this->category,
            'uploaded_at'  => \Carbon\Carbon::parse($this->uploaded_at)->toFormattedDateString(),
            'created_at'   => \Carbon\Carbon::parse($this->created_at)->toFormattedDateString(),
            'updated_at'   => \Carbon\Carbon::parse($this->updated_at)->toFormattedDateString(),
        ];
    }
}
