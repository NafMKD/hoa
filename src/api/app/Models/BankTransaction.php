<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankTransaction extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'batch_id',
        'amount',
        'reference',
        'transaction_date',
        'description',
        'raw_data',
        'matched_payment_id',
        'status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'transaction_date' => 'date',
            'raw_data' => 'array',
        ];
    }

    /**
     * Get the batch this transaction belongs to.
     *
     * @return BelongsTo
     */
    public function batch(): BelongsTo
    {
        return $this->belongsTo(BankStatementBatch::class, 'batch_id');
    }

    /**
     * Get the matched payment.
     *
     * @return BelongsTo
     */
    public function matchedPayment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'matched_payment_id');
    }
}
