<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Fee extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'description',
        'is_recurring',
        'recurring_period_months',
        'last_recurring_date',
        'next_recurring_date',
        'category',
        'amount',
        'is_penalizable',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string,string>
     */
    protected function casts(): array
    {
        return [
            'is_recurring' => 'boolean',
            'is_penalizable' => 'boolean',
            'last_recurring_date' => 'datetime',
            'next_recurring_date' => 'datetime',
            'amount' => 'decimal:2',
        ];
    }

    /**
     * Get all invoices generated from this fee.
     *
     * @return MorphMany
     */
    public function invoices(): MorphMany
    {
        return $this->morphMany(Invoice::class, 'source');
    }
}
