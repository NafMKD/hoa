<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'expense_category_id' => $this->expense_category_id,
            'vendor_id' => $this->vendor_id,
            'description' => $this->description,
            'amount' => $this->amount,
            'invoice_number' => $this->invoice_number,
            'status' => $this->status,
            'expense_date' => $this->expense_date,
            'created_by' => $this->created_by,
            'category' => $this->whenLoaded('category', function () {
                return new ExpenseCategoryResource($this->category);
            }),
            'vendor' => $this->whenLoaded('vendor', function () {
                return new VendorResource($this->vendor);
            }),
            'creator' => $this->whenLoaded('creator', function () {
                return new UserResource($this->creator);
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
