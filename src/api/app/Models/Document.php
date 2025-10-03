<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'category',
        'uploaded_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string,string>
     */
    protected $casts = [
        'uploaded_at' => 'datetime',
    ];

    /**
     * Get users that have this document as ID file.
     * 
     * @return HasMany
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'id_file');
    }

    /**
     * Get payroll that have this document as payslips.
     * 
     * @return HasMany
     */
    public function payslip(): HasMany
    {
        return $this->hasMany(Payroll::class, 'payslip_document_id');
    }

    /**
     * Get payment that have this document as screen shoot.
     * 
     * @return HasMany
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'payment_screen_shoot_id');
    }

    /**
     * Get tenant lease that have this document as agreement document.
     * 
     * @return HasMany
     */
    public function tenantLeases(): HasMany
    {
        return $this->hasMany(TenantLease::class, 'agreement_document_id');
    }

    /**
     * Get vehicle that have this document as vehicle document.
     * 
     * @return HasMany
     */
    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class, 'vehicle_document_id');
    }

    /**
     * Get sticker that have this document as qr code document.
     * 
     * @return HasMany
     */
    public function stickers(): HasMany
    {
        return $this->hasMany(StickerIssue::class, 'qr_code_file_id');
    }

    /**
     * Get unit that have this document ownership document.
     * 
     * @return HasMany
     */
    public function ownership(): HasMany
    {
        return $this->hasMany(Unit::class, 'ownership_file_id');
    }
}
