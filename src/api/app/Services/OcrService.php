<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use thiagoalessio\TesseractOCR\TesseractOCR;

class OcrService
{
    /**
     * Extract text and parse transaction data from payment screenshot.
     *
     * @param string $imagePath Full path to image file
     * @return array{raw_text: string, amount: float|null, date: string|null, reference: string|null, bank: string|null, confidence: float}
     */
    public function extractFromPaymentScreenshot(string $imagePath): array
    {
        $result = [
            'raw_text'   => '',
            'amount'     => null,
            'date'       => null,
            'reference'  => null,
            'bank'       => null,
            'confidence' => 0.0,
        ];

        try {
            $ocr = new TesseractOCR($imagePath);
            $ocr->lang(config('ocr.tesseract_lang', 'eng'));

            if ($path = config('ocr.tesseract_path')) {
                $ocr->executable($path);
            }

            $rawText = $ocr->run();
            $result['raw_text'] = $rawText;
            $result['confidence'] = 0.85; // Tesseract doesn't provide per-run confidence; use heuristic

            $parsed = $this->parseTransactionData($rawText);
            $result = array_merge($result, $parsed);
        } catch (\Throwable $e) {
            Log::warning('OCR extraction failed: ' . $e->getMessage(), ['path' => $imagePath]);
            $result['confidence'] = 0.0;
        }

        return $result;
    }

    /**
     * Parse amount, date, reference, bank from raw OCR text.
     *
     * @param string $text
     * @return array{amount: float|null, date: string|null, reference: string|null, bank: string|null}
     */
    protected function parseTransactionData(string $text): array
    {
        $result = [
            'amount'    => null,
            'date'      => null,
            'reference' => null,
            'bank'      => null,
        ];

        // Amount: match patterns like 1,500.00 or 1500.00 or 1 500.00
        if (preg_match('/(?:ETB|Birr|USD|\$)?\s*([\d,.\s]+(?:\.\d{2})?)/', $text, $m)) {
            $cleaned = preg_replace('/[\s,]/', '', $m[1]);
            if (is_numeric($cleaned)) {
                $result['amount'] = (float) $cleaned;
            }
        }

        // Date: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
        if (preg_match('/(\d{4}-\d{2}-\d{2})/', $text, $m)) {
            $result['date'] = $m[1];
        } elseif (preg_match('/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/', $text, $m)) {
            $parts = preg_split('/[\/\-]/', $m[1]);
            if (count($parts) === 3) {
                $result['date'] = "{$parts[2]}-{$parts[1]}-{$parts[0]}";
            }
        }

        // Reference: alphanumeric transaction IDs (e.g. TXN123, REF-456)
        if (preg_match('/(?:ref|txn|id)[:\s]*([A-Za-z0-9\-]{6,20})/i', $text, $m)) {
            $result['reference'] = trim($m[1]);
        } elseif (preg_match('/\b([A-Z]{2,4}[\d\-]{6,15})\b/', $text, $m)) {
            $result['reference'] = $m[1];
        }

        // Bank name: common patterns
        $bankPatterns = ['Commercial Bank', 'Awash Bank', 'Dashen', 'Bank of Abyssinia', 'CBE', 'NIB'];
        foreach ($bankPatterns as $bank) {
            if (stripos($text, $bank) !== false) {
                $result['bank'] = $bank;
                break;
            }
        }

        return $result;
    }
}
