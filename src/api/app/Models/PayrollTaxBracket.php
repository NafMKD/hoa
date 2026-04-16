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
            // Laravel expects `decimal:N` where N is scale (decimal places), not MySQL-style precision,scale.
            'min_inclusive' => 'decimal:2',
            'max_inclusive' => 'decimal:2',
            'rate_percent' => 'decimal:4',
            'sort_order' => 'integer',
        ];
    }
}
