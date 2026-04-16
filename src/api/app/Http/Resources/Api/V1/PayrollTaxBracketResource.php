<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayrollTaxBracketResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'min_inclusive' => $this->min_inclusive !== null ? (float) $this->min_inclusive : null,
            'max_inclusive' => $this->max_inclusive !== null ? (float) $this->max_inclusive : null,
            'rate_percent' => $this->rate_percent !== null ? (float) $this->rate_percent : null,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
