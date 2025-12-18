<?php

namespace App\Jobs\Api\V1;

use App\Repositories\Api\V1\InvoiceRepository;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MarkOverdueInvoices implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(InvoiceRepository $repository): void
    {
        $repository = app(InvoiceRepository::class);

        try {
            $overdueInvoices = $repository->getOverdueInvoices();

            if ($overdueInvoices->isEmpty()) {
                Log::info("No overdue invoices found to mark.");
                return;
            }
            
            $count = 0;
            
            foreach ($overdueInvoices as $invoice) {
                $repository->markInvoiceAsOverdue($invoice);            
                Log::info("Marked Invoice ID: {$invoice->id} as overdue.");
                $count++;
            }
        } catch (\Throwable $e) {
            Log::error("MarkOverdueInvoices job failed: " . $e->getMessage());
            // Handle exception, possibly log it
            $this->fail($e);
        }

    }
}
