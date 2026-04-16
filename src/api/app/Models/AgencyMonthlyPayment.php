<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AgencyMonthlyPayment extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'agency_id',
        'calendar_month',
        'amount_paid',
        'worker_count',
        'placement_id',
        'reference',
        'notes',
        'status',
        'expense_id',
        'created_by',
        'pay_date',
        'generation_metadata',
        'approved_by',
        'approved_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'calendar_month' => 'date',
            'amount_paid' => 'float',
            'pay_date' => 'date',
            'generation_metadata' => 'array',
            'approved_at' => 'datetime',
        ];
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function placement(): BelongsTo
    {
        return $this->belongsTo(AgencyPlacement::class, 'placement_id');
    }

    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class, 'expense_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
