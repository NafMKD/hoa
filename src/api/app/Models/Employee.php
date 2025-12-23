<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'role',
        'employment_type',
        'base_salary',
        'bank_account_encrypted',
        'hired_at',
        'terminated_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string,string>
     */
    protected function casts(): array
    {
        return [
            'base_salary' => 'float',
            'hired_at' => 'date',
            'terminated_at' => 'date',
        ];
    }

    /**
     * Get payroll records for this employee.
     *
     * @return HasMany
     */
    public function payrolls(): HasMany
    {
        return $this->hasMany(Payroll::class);
    }
}
