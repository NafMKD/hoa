<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentRepository
{
    protected $invoiceRepository;

    public function __construct(InvoiceRepository $invoiceRepository)
    {
        $this->invoiceRepository = $invoiceRepository;
    }

    /**
     * Retrieve all payments with pagination.
     *
     * @param int $perPage
     * @param array $filters
     * @return Collection|LengthAwarePaginator
     */
    public function all(?int $perPage = null, array $filters): Collection|LengthAwarePaginator
    {
        $query = Payment::query();

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%");
            });
        }

        $query->orderBy('created_at', 'desc');

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * Create a new payment.
     *
     * @param array<string, mixed> $data
     * @return Payment
     * @throws RepositoryException
     */
    public function create(array $data): Payment
    {
        DB::beginTransaction();
        try {
            // Check if the invoice already has a payment that is pending.
            if ($this->hasPendingPayment($data['invoice_id'])) {
                throw new RepositoryException('A pending payment already exists for this invoice.');
            }

            // Check if the payment amount exceeds the outstanding invoice amount.
            if ($this->exceedsOutstandingAmount($data['invoice_id'], $data['amount'])) {
                throw new RepositoryException('Payment amount exceeds the outstanding invoice amount.');
            }

            $data['type'] = Controller::_PAYMENT_TYPE[0];
            $data['status'] = Controller::_PAYMENT_STATUSES[0];
            $data['reference'] = strtoupper($data['reference']);
            $payment = Payment::create($data);

            DB::commit();
            return $payment;
        } catch (RepositoryException $e) {
            DB::rollBack();
            Log::info('Failed to create payment: ' . $e->getMessage());
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::info('Failed to create payment: ' . $e->getMessage());
            throw new RepositoryException('Failed to create payment: ');
        }
    }

    /**
     * Complete a payment (mark as confirmed).
     * 
     * @param Payment $payment
     * @return Payment
     * @throws RepositoryException
     */
    public function confirm(Payment $payment): Payment
    {
        try {
            $this->invoiceRepository->setAsPaid($payment->invoice, $payment);

            return $payment->refresh();
        } catch(RepositoryException $e) {
            throw $e;
        } catch (\Exception $e) {
            throw new RepositoryException('Failed to confirm payment: ' . $e->getMessage());
        }
    }

    /**
     * Complete a payment (mark as refunded). 
     * 
     * @param Payment $payment
     * @return Payment
     * @throws RepositoryException
     */
    public function refund(Payment $payment): Payment
    {
        try {
            $this->invoiceRepository->setAsRefunded($payment->invoice, $payment);

            return $payment->refresh();
        } catch (\Exception $e) {
            throw new RepositoryException('Failed to refund payment: ' . $e->getMessage());
        }
    }

    /**
     * Complete a payment (mark as failed).
     * 
     * @param Payment $payment
     * @return Payment
     * @throws RepositoryException
     */
    public function fail(Payment $payment): Payment
    {
        try {
            $payment->update([          
                'status' => Controller::_PAYMENT_STATUSES[2], // failed
                'processed_by' => Controller::_PAYMENT_PROCESSED_BY[1],
                'processed_at' => now()
            ]); 
            return $payment->refresh();
        } catch (\Exception $e) {   
            throw new RepositoryException('Failed to mark payment as failed: ' . $e->getMessage());
        }
    }

    /**
     * Add payment receipt number
     * 
     * @param Payment $payment
     * @param string $paymentNumber
     * 
     * @return Payment
     */
    public function addReceiptNumber(Payment $payment, string $paymentNumber): Payment
    {
        try {
            $payment->receipt_number = strtoupper($paymentNumber);
            $payment->save();

            return $payment->refresh();
        } catch (\Exception $e) {
            throw new RepositoryException('Failed to add receipt number: ' . $e->getMessage());
        }
    }


    /**
     * Delete a payment (soft delete).
     *
     * @param Payment $payment
     * @return bool
     * @throws RepositoryException
     */
    public function delete(Payment $payment): bool
    {
        try {
            return DB::transaction(function () use ($payment) {
            
                // TODO: Add any pre-deletion checks here
                return $payment->delete();
            });
        } catch (\Exception $e) {
            throw new RepositoryException('Failed to delete payment: ' . $e->getMessage());
        }
    }


    /**
     * Check if a payment with pending status exists for a given invoice.
     * 
     * @param int $invoiceId
     * @return bool
     */
    public function hasPendingPayment(int $invoiceId): bool
    {
        return Payment::where('invoice_id', $invoiceId)
                      ->where('status', 'pending')
                      ->exists();
    }

    /**
     * Check if the payment amount exceeds the outstanding invoice amount.
     * 
     * @param int $invoiceId
     * @param float $amount
     * @return bool
     */
    public function exceedsOutstandingAmount(int $invoiceId, float $amount): bool
    {
        $invoice = Invoice::find($invoiceId);
        $outstandingAmount = $invoice->final_amount_due;
        return $amount > $outstandingAmount;
    }
}
