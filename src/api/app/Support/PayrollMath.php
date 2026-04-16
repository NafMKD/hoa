<?php

namespace App\Support;

/**
 * Centralized payroll arithmetic to avoid float inconsistencies.
 */
class PayrollMath
{
    private const SCALE = 2;

    public static function computeNet(float $gross, float $taxes, float $deductions): float
    {
        return round($gross - $taxes - $deductions, self::SCALE);
    }

    /**
     * @throws \InvalidArgumentException
     */
    public static function assertNetMatches(
        float $gross,
        float $taxes,
        float $deductions,
        float $net
    ): void {
        $expected = self::computeNet($gross, $taxes, $deductions);
        if (abs($expected - $net) > 0.009) {
            throw new \InvalidArgumentException(
                'Net salary must equal gross minus taxes and deductions (within 0.01).'
            );
        }
    }

    public static function amountsMatch(float $a, float $b): bool
    {
        return abs($a - $b) <= 0.009;
    }

    /**
     * Progressive tax on gross using ordered brackets (min_inclusive, max_inclusive, rate_percent).
     *
     * @param  array<int, array{min_inclusive: float, max_inclusive?: float|null, rate_percent: float}>  $brackets
     */
    public static function progressiveTaxOnGross(float $gross, array $brackets): float
    {
        $tax = 0.0;
        foreach ($brackets as $b) {
            $min = (float) $b['min_inclusive'];
            $max = isset($b['max_inclusive']) && $b['max_inclusive'] !== null
                ? (float) $b['max_inclusive']
                : INF;
            $rate = (float) $b['rate_percent'] / 100.0;
            if ($gross <= $min) {
                continue;
            }
            $portion = min($gross, $max) - $min;
            if ($portion > 0) {
                $tax += $portion * $rate;
            }
        }

        return round($tax, self::SCALE);
    }

    /**
     * Other deductions: fixed ETB plus percent of gross (applied after tax is computed separately).
     */
    public static function otherDeductions(float $gross, float $fixed, float $percentOfGross): float
    {
        return round($fixed + ($gross * $percentOfGross / 100.0), self::SCALE);
    }
}
