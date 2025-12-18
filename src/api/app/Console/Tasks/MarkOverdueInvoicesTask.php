<?php

namespace App\Console\Tasks;

use App\Jobs\Api\V1\MarkOverdueInvoices;
use App\Repositories\Api\V1\InvoiceRepository;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Log;

class MarkOverdueInvoicesTask
{

    public function __construct()
    {
    }

    /**
     * Execute the task.
     */
    public function handle(): void
    {
        Log::info('MarkOverdueInvoicesTask started.');

        try {
            MarkOverdueInvoices::dispatch();
            
        } catch (\Throwable $e) {
            Log::error('MarkOverdueInvoicesTask failed: ' . $e->getMessage());
        }
    }

    /**
     * Schedule this task.
     */
    public function schedule(Schedule $schedule): void
    {
        // $schedule
        //     ->call([$this, 'handle'])
        //     ->dailyAt('00:30'); // run shortly after recurring fees
        $schedule->call([$this, 'handle'])->everyMinute();

    }
}
