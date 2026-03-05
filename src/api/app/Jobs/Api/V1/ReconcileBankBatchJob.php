<?php

namespace App\Jobs\Api\V1;

use App\Models\BankStatementBatch;
use App\Repositories\Api\V1\ReconciliationRepository;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ReconcileBankBatchJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     *
     * @param int $batchId
     */
    public function __construct(
        protected int $batchId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(ReconciliationRepository $repository): void
    {
        try {
            $repository->reconcileBatch($this->batchId);
        } catch (\Throwable $e) {
            Log::error("ReconcileBankBatchJob failed for batch {$this->batchId}: " . $e->getMessage());
            BankStatementBatch::find($this->batchId)?->update(['status' => 'failed']);
            throw $e;
        }
    }
}
