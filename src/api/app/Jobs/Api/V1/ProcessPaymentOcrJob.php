<?php

namespace App\Jobs\Api\V1;

use App\Models\Payment;
use App\Services\OcrService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessPaymentOcrJob implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public int $tries = 3;

    /**
     * Create a new job instance.
     *
     * @param int $paymentId
     */
    public function __construct(
        protected int $paymentId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(OcrService $ocrService): void
    {
        $payment = Payment::with('screenshot')->find($this->paymentId);
        if (!$payment || !$payment->screenshot) {
            Log::warning("ProcessPaymentOcrJob: Payment {$this->paymentId} or screenshot not found.");
            return;
        }

        $filePath = Storage::disk('public')->path($payment->screenshot->file_path);
        if (!file_exists($filePath)) {
            Log::warning("ProcessPaymentOcrJob: File not found for payment {$this->paymentId}.");
            return;
        }

        $extracted = $ocrService->extractFromPaymentScreenshot($filePath);
        Log::info("ProcessPaymentOcrJob: Extracted data: " . json_encode($extracted));

        $metadata = $payment->reconciliation_metadata ?? [];
        $metadata['ocr_raw_text'] = $extracted['raw_text'];
        $metadata['ocr_amount'] = $extracted['amount'];
        $metadata['ocr_date'] = $extracted['date'];
        $metadata['ocr_reference'] = $extracted['reference'];
        $metadata['ocr_bank'] = $extracted['bank'];
        $metadata['ocr_confidence'] = $extracted['confidence'];
        $metadata['ocr_job_run_at'] = now()->toIso8601String();

        $threshold = config('ocr.confidence_threshold', 0.7);
        if ($extracted['confidence'] < $threshold) {
            $metadata['ocr_needs_review'] = true;
        }

        $payment->update(['reconciliation_metadata' => $metadata]);

        Log::info("ProcessPaymentOcrJob: Processed payment {$this->paymentId}.", [
            'confidence' => $extracted['confidence'],
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("ProcessPaymentOcrJob failed for payment {$this->paymentId}: " . $exception->getMessage());
    }
}
