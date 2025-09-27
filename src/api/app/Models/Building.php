<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Building extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'floors',
        'units_per_floor',
        'address',
        'notes',
    ];

    /**
     * Get units in the building.
     * 
     * @return HasMany
     */
    public function units(): HasMany
    {
        return $this->hasMany(Unit::class);
    }
}
