<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollSetting extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'value',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'json',
        ];
    }

    public static function getFloat(string $key, float $default = 0.0): float
    {
        $row = static::query()->find($key);

        if (! $row) {
            return $default;
        }

        try {
            $v = $row->value;
        } catch (\Throwable) {
            return $default;
        }

        if (is_array($v)) {
            return (float) ($v['amount'] ?? $default);
        }

        if (is_numeric($v)) {
            return (float) $v;
        }

        return $default;
    }

    public static function putFloat(string $key, float $amount): void
    {
        static::query()->updateOrCreate(
            ['key' => $key],
            ['value' => ['amount' => round($amount, 4)]]
        );
    }
}
