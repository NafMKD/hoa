<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'invoice_number',
        'user_id',
        'unit_id',
        'issue_date',
        'due_date',
        'total_amount',
        'amount_paid',
        'status',
        'source_type',
        'source_id',
        'penalty_amount',
        'metadata',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string,string>
     */
    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'due_date' => 'date',
            'total_amount' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'penalty_amount' => 'decimal:2',
            'metadata' => 'array',
        ];
    }

    /**
     * Get the user (payer) of the invoice.
     *
     * @return BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the unit related to this invoice.
     *
     * @return BelongsTo
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * Get payments applied to this invoice.
     *
     * @return HasMany
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get the fee that generated this invoice (if source_type is fee).
     *
     * @return BelongsTo
     */
    public function fee()
    {
        return $this->belongsTo(Fee::class, 'source_id')->where('source_type', 'fee');
    }
}
