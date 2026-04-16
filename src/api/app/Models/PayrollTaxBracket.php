<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollTaxBracket extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'min_inclusive',
        'max_inclusive',
        'rate_percent',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'min_inclusive' => 'float',
            'max_inclusive' => 'float',
            'rate_percent' => 'float',
            'sort_order' => 'integer',
        ];
    }
}
