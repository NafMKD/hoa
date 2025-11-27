<?php

namespace App\Models;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Unit extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'building_id',
        'name',
        'floor_number',
        'unit_type',
        'size_m2',
        'status',
    ];

    /**
     * Get the building of the unit.
     * 
     * @return BelongsTo
     */
    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    /**
     * Get the type of the unit.
     * 
     * @return string
     */
    public function getTypeAttribute(): string
    {
        switch ($this->unit_type) {
            case Controller::_UNIT_TYPES[0]:
                return '1 Bed Room';
            case Controller::_UNIT_TYPES[1]:
                return '2 Bed Room';
            case Controller::_UNIT_TYPES[2]:
                return '3 Bed Room';
            case Controller::_UNIT_TYPES[3]:
                return '4 Bed Room';
            default:
                return 'Unknown';
        }
    }

    /**
     * Get if the unit is rentable
     * 
     * @return bool
     */
    public function getIsRentableAttribute(): bool
    {
        if ($this->status == 'rented') return false;

        if ($this->currentLease != null) return false;


        return true;
    }

    /**
     * Get the leases of the unit.
     * 
     * @return HasMany
     */
    public function leases(): HasMany
    {
        return $this->hasMany(UnitLease::class);
    }

    /**
     * Get the current active lease of the unit.
     * 
     * @return hasOne
     */
    public function currentLease(): HasOne
    {
        return $this->hasOne(UnitLease::class)->where('status', 'active');
    }

    /**
     * Get the owners of the unit.
     * 
     * @return HasMany
     */
    public function owners(): HasMany
    {
        return $this->hasMany(UnitOwner::class);
    }

    /**
     * Get the the current active owner of the unit.
     * 
     * @return hasOne
     */
    public function currentOwner(): HasOne
    {
        return $this->hasOne(UnitOwner::class)->where('status', 'active');
    }
}
