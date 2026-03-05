<?php

namespace App\Jobs\Api\V1;

use App\Models\Payment;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

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
    public function handle(): void
    {
        $payment = Payment::with('screenshot')->find($this->paymentId);
        if (!$payment || !$payment->screenshot) {
            Log::warning("ProcessPaymentOcrJob: Payment {$this->paymentId} or screenshot not found.");
            return;
        }

        // TODO: Implement OCR extraction (Group F)
        // For now, placeholder metadata to indicate job ran
        $metadata = $payment->reconciliation_metadata ?? [];
        $metadata['ocr_job_run_at'] = now()->toIso8601String();
        $payment->update(['reconciliation_metadata' => $metadata]);

        Log::info("ProcessPaymentOcrJob: Processed payment {$this->paymentId}.");
    }
}
