<?php

return [

    /*
    |--------------------------------------------------------------------------
    | OCR Provider
    |--------------------------------------------------------------------------
    |
    | Supported: "ocr_space" (cloud API, no install), "tesseract" (local).
    | Use ocr_space on shared hosting. Get free API key at https://ocr.space/OCRAPI
    |
    */
    'provider' => env('OCR_PROVIDER', 'ocr_space'),

    /*
    |--------------------------------------------------------------------------
    | Confidence Threshold
    |--------------------------------------------------------------------------
    |
    | If OCR confidence is below this (0-1), set ocr_needs_review in metadata.
    |
    */
    'confidence_threshold' => (float) env('OCR_CONFIDENCE_THRESHOLD', 0.7),

    /*
    |--------------------------------------------------------------------------
    | OCR.space API (free tier: 1 MB max file, 25k req/month)
    |--------------------------------------------------------------------------
    */
    'ocr_space' => [
        'api_key'  => env('OCR_SPACE_API_KEY'),
        'language' => env('OCR_SPACE_LANGUAGE', 'eng'), // 3-letter code: eng, ara, etc.
    ],

    /*
    |--------------------------------------------------------------------------
    | Tesseract (local, optional)
    |--------------------------------------------------------------------------
    */
    'tesseract_path' => env('TESSERACT_PATH'),
    'tesseract_lang' => env('TESSERACT_LANG', 'eng'),

];
