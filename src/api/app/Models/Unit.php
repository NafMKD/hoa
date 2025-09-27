<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        'owner_id',
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
     * Get the owner of the unit.
     * 
     * @return BelongsTo
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the tenant of the unit.
     * 
     * @return mixed
     */
    public function tenant(): mixed
    {
        return $this->leases()->where('status', 'active')->first();
    }

    /**
     * Get the leases of the unit.
     * 
     * @return HasMany
     */
    public function leases(): HasMany
    {
        return $this->hasMany(TenantLease::class);
    }

    /**
     * Get the invoices of the unit.
     * 
     * @return HasMany
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Get vehicles assigned to the unit.
     * 
     * @return HasMany
     */
    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }
}
