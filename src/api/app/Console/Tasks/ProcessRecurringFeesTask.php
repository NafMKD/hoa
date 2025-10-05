<?php

namespace App\Console\Tasks;

use App\Jobs\Api\V1\GenerateFeeInvoiceJob;
use App\Repositories\Api\V1\FeeRepository;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Log;

class ProcessRecurringFeesTask
{
    protected FeeRepository $fees;

    public function __construct(FeeRepository $fees)
    {
        $this->fees = $fees;
    }

    /**
     * Execute the task.
     */
    public function handle(): void
    {
        Log::info('ProcessRecurringFeesTask started.');
        try {
            $dueFees = $this->fees->processRecurringFees(); // returns fees whose next_recurring_date <= today

            // If no fees are due, log and exit
            if ($dueFees->isEmpty()) {
                Log::info('ProcessRecurringFeesTask: No due fees found.');
                return;
            }
            
            // Dispatch a job for each due fee to generate invoices
            GenerateFeeInvoiceJob::dispatch($dueFees);

            Log::info('ProcessRecurringFeesTask: dispatched ' . count($dueFees) . ' jobs.');
        } catch (\Throwable $e) {
            Log::error('ProcessRecurringFeesTask failed: ' . $e->getMessage());
        }
    }

    /**
     * Schedule this task.
     */
    public function schedule(Schedule $schedule): void
    {
        $schedule->call([$this, 'handle'])->everyMinute(); // run daily at midnight
    }
}
