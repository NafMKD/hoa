<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BankStatementBatchResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'file_name'   => $this->file_name,
            'row_count'   => $this->row_count,
            'status'      => $this->status,
            'uploaded_at' => $this->uploaded_at?->toIso8601String(),
            'admin'       => $this->whenLoaded('admin', fn () => new UserResource($this->admin)),
            'transactions'     => $this->whenLoaded('transactions', fn () => BankTransactionResource::collection($this->transactions)),
            'matched_count'    => $this->whenLoaded('transactions', fn () => $this->transactions->where('status', 'matched')->count()),
            'escalated_count'  => $this->whenLoaded('transactions', fn () => $this->transactions->where('status', 'escalated')->count()),
            'created_at'  => $this->created_at?->toIso8601String(),
            'updated_at'  => $this->updated_at?->toIso8601String(),
        ];
    }
}
