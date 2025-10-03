<?php

namespace App\Models;

use App\Http\Controllers\Controller;
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
        'ownership_file_id',
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
     * Get the ownership file of the unit.
     * 
     * @return BelongsTo
     */
    public function ownershipFile(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'ownership_file_id');
    }

    /**
     * Get the type of the unit.
     * 
     * @return string
     */
    public function type(): string
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
