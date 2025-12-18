<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payroll extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'employee_id',
        'payroll_period_start',
        'payroll_period_end',
        'gross_salary',
        'taxes',
        'deductions',
        'net_salary',
        'pay_date',
        'status',
        'payslip_document_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string,string>
     */
    protected function casts(): array
    {
        return [
            'payroll_period_start' => 'date',
            'payroll_period_end' => 'date',
            'gross_salary' => 'float',
            'taxes' => 'float',
            'deductions' => 'float',
            'net_salary' => 'float',
            'pay_date' => 'date',
        ];
    }

    /**
     * Get the employee for this payroll.
     *
     * @return BelongsTo
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the payslip document.
     *
     * @return BelongsTo
     */
    public function payslip(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'payslip_document_id');
    }
}
