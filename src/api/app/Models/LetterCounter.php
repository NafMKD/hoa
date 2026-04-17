<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LetterCounter extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'year_month',
        'last_sequence',
    ];
}
