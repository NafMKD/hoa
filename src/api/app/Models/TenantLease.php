<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TenantLease extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'unit_id',
        'tenant_id',
        'representative_id',
        'representative_document_id',
        'agreement_type',
        'agreement_amount',
        'lease_template_id',
        'lease_document_id',
        'lease_start_date',
        'lease_end_date',
        'status',
        'witness_1_full_name',
        'witness_2_full_name',
        'witness_3_full_name',
        'notes',
        'created_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'lease_start_date' => 'date',
            'lease_end_date' => 'date',
            'agreement_amount' => 'decimal:2',
        ];
    }

    /**
     * Get the tenant of this lease.
     *
     * @return BelongsTo
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    /**
     * Get the unit of this lease.
     *
     * @return BelongsTo
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * Get the agreement document.
     *
     * @return BelongsTo
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'lease_document_id');
    }

    /**
     * Get the user who created this lease.
     *
     * @return BelongsTo
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the representative of this lease.
     *
     * @return BelongsTo
     */
    public function representative(): BelongsTo
    {
        return $this->belongsTo(User::class, 'representative_id');
    }

    /**
     * Get the representative document of this lease.
     *
     * @return BelongsTo
     */
    public function representativeDocument(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'representative_document_id');
    }

    /**
     * Get the lease template of this lease.
     *
     * @return BelongsTo
     */
    public function leaseTemplate(): BelongsTo
    {
        return $this->belongsTo(DocumentTemplate::class, 'lease_template_id');
    }
}
