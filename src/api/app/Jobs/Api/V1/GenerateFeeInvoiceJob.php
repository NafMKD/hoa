<?php

namespace App\Jobs\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Unit;
use App\Repositories\Api\V1\InvoiceRepository;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GenerateFeeInvoiceJob implements ShouldQueue
{
    use Queueable;
    public Collection $fees;

    /**
     * Create a new job instance.
     */
    public function __construct(Collection $fees)
    {
        $this->fees = $fees;
    }

    /**
     * Execute the job.
     */
    public function handle(InvoiceRepository $repository): void
    {
        // Resolve repository at runtime
        $repository = app(InvoiceRepository::class);

        try {
                        
            DB::transaction(function () use ($repository) {
                foreach ($this->fees as $fee) {
                    // Check if the category is valid for `administrational' invoicing 
                    if ($fee->category !== Controller::_FEE_CATEGORIES[0]) {
                        throw new RepositoryException('Fee category not valid for invoicing.');
                    }
                    // Get All Units
                    $units = Unit::all();
                    // Generate all invoices for this fee
                    $repository->generateInvoiceForFee($units, $fee);
                    Log::info("Invoice generated for Fee ID: {$fee->id}");
                }
                // Update recurring dates only if invoices were generated successfully
                $fee->last_recurring_date = now();
                $fee->next_recurring_date = now()->addMonths((int) $fee->recurring_period_months);
                $fee->save();
            });

        } catch (\Throwable $e) {
            Log::error("GenerateFeeInvoiceJob failed for this Fee: " . $e->getMessage());
            $this->fail($e);
        }
    }
}
