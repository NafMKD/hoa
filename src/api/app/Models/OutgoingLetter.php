<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class OutgoingLetter extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'letter_number',
        'title',
        'description',
        'unit_id',
        'recipient_name',
        'scanned_document_id',
        'created_by',
    ];

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scannedDocument(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'scanned_document_id');
    }
}
