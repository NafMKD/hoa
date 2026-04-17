<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComplaintResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'unit_id' => $this->unit_id,
            'category' => $this->category,
            'subject' => $this->subject,
            'body' => $this->body,
            'status' => $this->status,
            'priority' => $this->priority,
            'assigned_to' => $this->assigned_to,
            'submitter' => $this->whenLoaded('submitter', function () {
                return new UserResource($this->submitter);
            }),
            'assignee' => $this->whenLoaded('assignee', function () {
                return $this->assignee
                    ? new UserResource($this->assignee)
                    : null;
            }),
            'unit' => $this->whenLoaded('unit', function () {
                return $this->unit
                    ? new UnitResource($this->unit)
                    : null;
            }),
            'documents' => $this->whenLoaded('documents', function () {
                return DocumentResource::collection($this->documents);
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
