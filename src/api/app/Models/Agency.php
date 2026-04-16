<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Agency extends Model
{
    use SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'default_monthly_amount' => 'float',
        ];
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'notes',
        'default_worker_count',
        'default_monthly_amount',
    ];

    public function placements(): HasMany
    {
        return $this->hasMany(AgencyPlacement::class);
    }

    public function monthlyPayments(): HasMany
    {
        return $this->hasMany(AgencyMonthlyPayment::class);
    }
}
