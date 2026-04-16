<?php

namespace App\Support;

use App\Models\PayrollTaxBracket;
use App\Models\PayrollSetting;

/**
 * Captures current tax brackets and deduction settings for storage on payroll rows.
 */
class PayrollRulesSnapshot
{
    /**
     * @return array{tax_brackets: list<array{min_inclusive: float, max_inclusive: float|null, rate_percent: float}>, deduction_fixed: float, deduction_percent_of_gross: float, captured_at: string}
     */
    public static function build(): array
    {
        $brackets = PayrollTaxBracket::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($b) => [
                'min_inclusive' => (float) $b->min_inclusive,
                'max_inclusive' => $b->max_inclusive === null ? null : (float) $b->max_inclusive,
                'rate_percent' => (float) $b->rate_percent,
            ])
            ->all();

        return [
            'tax_brackets' => $brackets,
            'deduction_fixed' => PayrollSetting::getFloat('deduction_fixed'),
            'deduction_percent_of_gross' => PayrollSetting::getFloat('deduction_percent_of_gross'),
            'captured_at' => now()->toIso8601String(),
        ];
    }
}
