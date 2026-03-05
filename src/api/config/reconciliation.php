<?php

return [

    /*
    |--------------------------------------------------------------------------
    | CSV Column Mapping
    |--------------------------------------------------------------------------
    |
    | Map CSV headers to database columns. Use header names from first row.
    | Supported: date, amount, reference, description
    |
    */
    'csv_columns' => [
        'date'        => env('RECONCILIATION_CSV_DATE', 'date'),
        'amount'      => env('RECONCILIATION_CSV_AMOUNT', 'amount'),
        'reference'   => env('RECONCILIATION_CSV_REFERENCE', 'reference'),
        'description' => env('RECONCILIATION_CSV_DESCRIPTION', 'description'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Matching Tolerance
    |--------------------------------------------------------------------------
    */
    'amount_tolerance' => (float) env('RECONCILIATION_AMOUNT_TOLERANCE', 0.01),
    'date_tolerance_days' => (int) env('RECONCILIATION_DATE_TOLERANCE_DAYS', 7),
    'reference_similarity_threshold' => (float) env('RECONCILIATION_REFERENCE_THRESHOLD', 0.85),

];
