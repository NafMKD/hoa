<?php

return [

    /*
    |--------------------------------------------------------------------------
    | OCR Provider
    |--------------------------------------------------------------------------
    |
    | Supported: "tesseract"
    |
    */
    'provider' => env('OCR_PROVIDER', 'tesseract'),

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
    | Tesseract Executable Path
    |--------------------------------------------------------------------------
    |
    | Path to tesseract binary. Leave null for auto-detect.
    |
    */
    'tesseract_path' => env('TESSERACT_PATH'),

    /*
    |--------------------------------------------------------------------------
    | Tesseract Languages
    |--------------------------------------------------------------------------
    |
    | Languages for OCR (e.g. eng, amh for Amharic).
    |
    */
    'tesseract_lang' => env('TESSERACT_LANG', 'eng'),

];
