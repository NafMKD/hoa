<?php

namespace App\Support;

/**
 * Human-readable sticker line from plate + unit (does not expose raw unit number).
 *
 * @see doc/sticker_print.md
 */
final class ParkingStickerScramble
{
    /**
     * @param string $licensePlate e.g. "3 AA B34567" or "3AAB34567"
     * @param string $unitName e.g. "SA07"
     */
    public static function line(string $licensePlate, string $unitName): string
    {
        $plate = str_replace(' ', '', $licensePlate);

        if ($plate === '' || strlen($plate) < 6) {
            return '';
        }

        if (! preg_match('/^(.+?)(\d{5})$/', $plate, $m)) {
            return '';
        }

        $leftRaw = $m[1];
        $plateRight = $m[2];
        $left = str_replace('B', '', $leftRaw);

        $unit = trim($unitName);
        if ($unit === '') {
            return '';
        }

        $floor = strtoupper(substr($unit, 0, 1));
        $unitCode = strlen($unit) > 1 ? substr($unit, 1) : '';

        return sprintf('%s%s | %s%s', $plateRight, $floor, $left, $unitCode);
    }
}
