<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'name'                  => $this->name,
            'description'           => $this->description,
            'category'              => $this->category,
            'amount'                => $this->amount,
            'is_recurring'          => $this->is_recurring,
            'recurring_period_months'=> $this->recurring_period_months,
            'last_recurring_date'   => $this->last_recurring_date,
            'next_recurring_date'   => $this->next_recurring_date,
            'is_penalizable'        => $this->is_penalizable,
            'status'                => $this->status,
            'created_at'            => $this->created_at,
            'updated_at'            => $this->updated_at,
        ];
    }
}
