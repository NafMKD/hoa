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
        'city',
        'sub_city',
        'woreda',
        'house_number',
        'id_file',
        'role',
        'last_login_at',
        'status',
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
     * @param array|string $role
     * @return bool
     */
    public function hasRole(array|string $roles): bool
    {

        if (is_array($roles)) {
            return in_array($this->role, $roles, true);
        }

        return $this->role === $roles;
    }

    /**
     * Check if the user is active.
     * 
     * @return bool
     */
    public function getIsActiveAttribute(): bool
    {
        return $this->status === \App\Http\Controllers\Controller::_USER_STATUSES[0];
    }

    /**
     * Check if the user address is complete.
     * 
     * @return bool
     */
    public function getIsAddressCompleteAttribute(): bool
    {
        return !is_null($this->city)
            && !is_null($this->sub_city)
            && !is_null($this->woreda)
            && !is_null($this->house_number);
    }

    /**
     * Get the user's full name.
     * 
     * @return string
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
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
     * Get audit logs performed by the user.
     * 
     * @return HasMany
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'actor_user_id');
    }

    /**
     * Get the units owned by the user.
     * 
     * @return HasMany
     */
    public function ownedUnits(): HasMany
    {
        return $this->hasMany(UnitOwner::class, 'user_id');
    }
}
