<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OcrService
{
    /**
     * Max file size for OCR.space free tier (1 MB).
     */
    public const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;

    /**
     * Extract text and parse transaction data from payment screenshot.
     * Uses OCR.space API when provider is "ocr_space" (no local OCR required).
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

        $provider = config('ocr.provider', 'ocr_space');
        if ($provider === 'ocr_space') {
            return $this->extractViaOcrSpace($imagePath, $result);
        }

        return $this->extractViaTesseract($imagePath, $result);
    }

    /**
     * Extract text using OCR.space API (https://ocr.space/OCRAPI).
     * Free tier: 1 MB max file size.
     */
    protected function extractViaOcrSpace(string $imagePath, array $result): array
    {
        $apiKey = config('ocr.ocr_space.api_key');
        if (empty($apiKey)) {
            Log::warning('OCR.space API key not configured.');
            return $result;
        }

        if (!file_exists($imagePath) || !is_readable($imagePath)) {
            Log::warning('OCR: File not found or not readable.', ['path' => $imagePath]);
            return $result;
        }

        $fileSize = filesize($imagePath);
        if ($fileSize === false || $fileSize > self::MAX_IMAGE_SIZE_BYTES) {
            Log::warning('OCR: File exceeds 1 MB limit (OCR.space free tier).', [
                'path' => $imagePath,
                'size' => $fileSize,
            ]);
            return $result;
        }

        try {
            $response = Http::timeout(30)
                ->withHeaders(['apikey' => $apiKey])
                ->attach(
                    'file',
                    file_get_contents($imagePath),
                    basename($imagePath)
                )
                ->post('https://api.ocr.space/parse/image', [
                    'language' => config('ocr.ocr_space.language', 'eng'),
                    'isOverlayRequired' => 'false',
                ]);

            if (!$response->successful()) {
                Log::warning('OCR.space API error.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return $result;
            }

            $json = $response->json();
            $exitCode = (int) ($json['OCRExitCode'] ?? 0);
            if ($exitCode !== 1) {
                Log::warning('OCR.space parsing failed.', [
                    'OCRExitCode' => $json['OCRExitCode'] ?? null,
                    'ErrorMessage' => $json['ErrorMessage'] ?? null,
                ]);
                return $result;
            }

            $parsedResults = $json['ParsedResults'] ?? [];
            $rawText = '';
            foreach ($parsedResults as $page) {
                if (!empty($page['ParsedText'])) {
                    $rawText .= $page['ParsedText'] . "\n";
                }
            }
            $rawText = trim($rawText);
            $result['raw_text'] = $rawText;
            $result['confidence'] = 0.85;

            $parsed = $this->parseTransactionData($rawText);
            $result = array_merge($result, $parsed);
        } catch (\Throwable $e) {
            Log::warning('OCR.space extraction failed: ' . $e->getMessage(), ['path' => $imagePath]);
            $result['confidence'] = 0.0;
        }

        return $result;
    }

    /**
     * Extract text using local Tesseract (optional, for environments where it is installed).
     */
    protected function extractViaTesseract(string $imagePath, array $result): array
    {
        if (!class_exists(\thiagoalessio\TesseractOCR\TesseractOCR::class)) {
            Log::warning('Tesseract OCR not installed. Set OCR_PROVIDER=ocr_space and OCR_SPACE_API_KEY for cloud OCR.');
            return $result;
        }

        try {
            $ocr = new \thiagoalessio\TesseractOCR\TesseractOCR($imagePath);
            $ocr->lang(config('ocr.tesseract_lang', 'eng'));
            if ($path = config('ocr.tesseract_path')) {
                $ocr->executable($path);
            }
            $rawText = $ocr->run();
            $result['raw_text'] = $rawText;
            $result['confidence'] = 0.85;
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

        if (preg_match('/(?:ETB|Birr|USD|\$)?\s*([\d,.\s]+(?:\.\d{2})?)/', $text, $m)) {
            $cleaned = preg_replace('/[\s,]/', '', $m[1]);
            if (is_numeric($cleaned)) {
                $result['amount'] = (float) $cleaned;
            }
        }

        if (preg_match('/(\d{4}-\d{2}-\d{2})/', $text, $m)) {
            $result['date'] = $m[1];
        } elseif (preg_match('/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/', $text, $m)) {
            $parts = preg_split('/[\/\-]/', $m[1]);
            if (count($parts) === 3) {
                $result['date'] = "{$parts[2]}-{$parts[1]}-{$parts[0]}";
            }
        }

        if (preg_match('/(?:ref|txn|id)[:\s]*([A-Za-z0-9\-]{6,20})/i', $text, $m)) {
            $result['reference'] = trim($m[1]);
        } elseif (preg_match('/\b([A-Z]{2,4}[\d\-]{6,15})\b/', $text, $m)) {
            $result['reference'] = $m[1];
        }

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
