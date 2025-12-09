<?php

namespace App\Helpers;

class NumberToWords
{
    // ============================
    //   ENGLISH  (Number words)
    // ============================
    public static function toEnglish($number): string
    {
        $number = floatval($number);

        if ($number == 0) {
            return "zero";
        }

        $formatter = new \NumberFormatter("en", \NumberFormatter::SPELLOUT);
        return $formatter->format($number);
    }

    // ============================
    //   ENGLISH CURRENCY STYLE
    // ============================
    public static function toEnglishCurrency($number): string
    {
        $number = number_format((float) $number, 2, '.', '');
        [$whole, $fraction] = explode(".", $number);

        $formatter = new \NumberFormatter("en", \NumberFormatter::SPELLOUT);

        $wholeWords = ucfirst($formatter->format($whole));
        $fractionWords = ucfirst($formatter->format($fraction));

        return "{$wholeWords} & {$fractionWords} Cents";
    }

    // ============================
    //   AMHARIC (Basic version)
    // ============================
    public static function toAmharic($number): string
    {
        $units = [
            '', 'አንድ', 'ሁለት', 'ሶስት', 'አራት', 'አምስት',
            'ስድስት', 'ሰባት', 'ስምንት', 'ዘጠኝ'
        ];

        $tens = [
            '', 'አስር', 'ሃያ', 'ሰላሳ', 'አርባ', 'አምሳ',
            'ስልሳ', 'ሰባ', 'ሰማንያ', 'ዘጠና'
        ];

        $thousands = [
            '', 'ሺህ', 'ዐሥር ሺህ', 'መቶ ሺህ', 'ዐሥር ሚሊዮን', 'መቶ ሚሊዮን'
        ];

        if ($number == 0) {
            return 'ዜሮ';
        }

        $result = [];
        $num = intval($number);
        $i = 0;

        while ($num > 0) {
            $chunk = $num % 1000;
            $num = intval($num / 1000);

            if ($chunk > 0) {
                $result[] = self::convertChunkAmharic($chunk, $units, $tens) . ' ' . $thousands[$i];
            }

            $i++;
        }

        return trim(implode(' ', array_reverse($result)));
    }

    private static function convertChunkAmharic($num, $units, $tens): string
    {
        $parts = [];

        if ($num >= 100) {
            $parts[] = $units[intval($num / 100)] . ' መቶ';
            $num %= 100;
        }

        if ($num >= 10) {
            $parts[] = $tens[intval($num / 10)];
            $num %= 10;
        }

        if ($num > 0) {
            $parts[] = $units[$num];
        }

        return trim(implode(' ', $parts));
    }

}
