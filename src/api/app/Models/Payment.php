<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'invoice_id',
        'amount',
        'method',
        'reference',
        'status',
        'type',
        'processed_by',
        'processed_at',
        'receipt_number',
        'reconciliation_metadata',
        'payment_screen_shoot_id',
        'payment_date',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string,string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'processed_at' => 'datetime',
            'payment_date' => 'datetime',
            'reconciliation_metadata' => 'array',
        ];
    }

    /**
     * Get the invoice related to the payment.
     *
     * @return BelongsTo
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Get the document of the payment screenshot.
     *
     * @return BelongsTo
     */
    public function screenshot(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'payment_screen_shoot_id');
    }

    /**
     * Get revenue schedules related to this payment.
     *
     * @return HasMany
     */
    public function revenueSchedules(): HasMany
    {
        return $this->hasMany(RevenueSchedule::class);
    }
}
