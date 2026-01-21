<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'unit_id',
        'make',
        'model',
        'year',
        'license_plate',
        'color',
        'vehicle_document_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string,string>
     */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
        ];
    }

    /**
     * Get the unit assigned to the vehicle.
     *
     * @return BelongsTo
     */
    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * Get the vehicle document.
     *
     * @return BelongsTo
     */
    public function document()
    {
        return $this->belongsTo(Document::class, 'vehicle_document_id');
    }

    /**
     * Get sticker issues for this vehicle.
     *
     * @return HasMany
     */
    public function stickers(): HasMany
    {
        return $this->hasMany(StickerIssue::class);
    }
}
