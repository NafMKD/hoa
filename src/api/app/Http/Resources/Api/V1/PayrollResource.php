<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayrollResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'payroll_period_start' => $this->payroll_period_start?->format('Y-m-d'),
            'payroll_period_end' => $this->payroll_period_end?->format('Y-m-d'),
            'gross_salary' => $this->gross_salary,
            'taxes' => $this->taxes,
            'deductions' => $this->deductions,
            'net_salary' => $this->net_salary,
            'pay_date' => $this->pay_date?->format('Y-m-d'),
            'status' => $this->status,
            'payslip_document_id' => $this->payslip_document_id,
            'expense_id' => $this->expense_id,
            'created_by' => $this->created_by,
            'calculation_metadata' => $this->calculation_metadata,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'employee' => $this->whenLoaded('employee', function () {
                return new EmployeeResource($this->employee);
            }),
            'payslip' => $this->whenLoaded('payslip', function () {
                return new DocumentResource($this->payslip);
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
