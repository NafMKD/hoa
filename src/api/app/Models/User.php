<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasApiTokens, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'phone',
        'email',
        'password',
        'id_file',
        'role',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Check if the user has a specific role.
     *
     * @param string $role
     * @return bool
     */
    public function hasRole(string $role): bool
    {
        return in_array($role, \App\Http\Controllers\Controller::_ROLES, true)
            && $this->role === $role;
    }

    /**
     * Get the ID document.
     * 
     * @return BelongsTo
     */
    public function idFile(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'id_file');
    }

    /**
     * Get units owned by the user.
     * 
     * @return HasMany
     */
    public function ownedUnits(): HasMany
    {
        return $this->hasMany(Unit::class, 'owner_id');
    }

    /**
     * Get units rented by the user.
     * 
     * @return HasMany
     */
    public function rentedUnits(): HasMany
    {
        return $this->hasMany(Unit::class, 'owner_id')
                ->whereHas('leases', function($query) {
                    $query->where('status', 'active');
                });
    }

    /**
     * Get payments made by the user.
     * 
     * @return mixed
     */
    public function payments(): mixed
    {
        return Payment::whereHas('invoice', function ($query) {
            $query->where('user_id', $this->id);
        })->first();
    }

    /**
     * Get invoices for the user.
     * 
     * @return HasMany
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Get leases where the user is tenant.
     * 
     * @return HasMany
     */
    public function leases(): HasMany
    {
        return $this->hasMany(TenantLease::class, 'tenant_id');
    }

    /**
     * Get leases created by the user (staff).
     * 
     * @return HasMany
     */
    public function createdLeases(): HasMany
    {
        return $this->hasMany(TenantLease::class, 'created_by');
    }

    /**
     * Get expense created by the user (staff).
     * 
     * @return HasMany
     */
    public function createdExpenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'created_by');
    }

    /**
     * Get stickers created by the user (staff).
     * 
     * @return HasMany
     */
    public function createdStickers(): HasMany
    {
        return $this->hasMany(StickerIssue::class, 'issued_by');
    }

    /**
     * Get votes cast by the user.
     * 
     * @return HasMany
     */
    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    /**
     * Get vehicles owned by the user.
     * 
     * @return HasMany
     */
    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    /**
     * Get sticker issues issued by the user.
     * 
     * @return HasMany
     */
    public function issuedStickers(): HasMany
    {
        return $this->hasMany(StickerIssue::class, 'issued_by');
    }

    /**
     * Get audit logs performed by the user.
     * 
     * @return HasMany
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'actor_user_id');
    }

    /**
     * Get document templates created by the user.
     * 
     * @return HasMany
     */
    public function createdTemplates(): HasMany
    {
        return $this->hasMany(DocumentTemplate::class, 'created_by');
    }

    /**
     * Get document templates updated by the user.
     * 
     * @return HasMany
     */
    public function updatedTemplates(): HasMany
    {
        return $this->hasMany(DocumentTemplate::class, 'updated_by');
    }

    /**
     * Get the leases where the user is a representative.
     * 
     * @return HasMany
     */
    public function representativeLeases(): HasMany
    {
        return $this->hasMany(TenantLease::class, 'representative_id');
    }
}
