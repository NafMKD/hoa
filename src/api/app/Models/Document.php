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
     * Get publicly accessible URL for the document.
     * 
     * @return string
     */
    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }
    
}
