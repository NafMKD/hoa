<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AgencyMonthlyPaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'agency_id' => $this->agency_id,
            'calendar_month' => $this->calendar_month?->format('Y-m-d'),
            'amount_paid' => $this->amount_paid,
            'worker_count' => $this->worker_count,
            'placement_id' => $this->placement_id,
            'reference' => $this->reference,
            'notes' => $this->notes,
            'status' => $this->status,
            'expense_id' => $this->expense_id,
            'created_by' => $this->created_by,
            'generation_metadata' => $this->generation_metadata,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'pay_date' => $this->pay_date?->format('Y-m-d'),
            'agency' => $this->whenLoaded('agency', function () {
                return new AgencyResource($this->agency);
            }),
            'placement' => $this->whenLoaded('placement', function () {
                return new AgencyPlacementResource($this->placement);
            }),
            'expense' => $this->whenLoaded('expense', function () {
                return new ExpenseResource($this->expense);
            }),
            'creator' => $this->whenLoaded('creator', function () {
                return new UserResource($this->creator);
            }),
            'approver' => $this->whenLoaded('approver', function () {
                return new UserResource($this->approver);
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
