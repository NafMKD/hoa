<?php

namespace App\Repositories\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BankStatementBatch;
use App\Models\BankTransaction;
use App\Models\Payment;
use App\Models\ReconciliationEscalation;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReconciliationRepository
{
    public function __construct(
        protected PaymentRepository $paymentRepository
    ) {}

    /**
     * Run reconciliation for a batch.
     *
     * @param int $batchId
     * @return void
     */
    public function reconcileBatch(int $batchId): void
    {
        $transactions = BankTransaction::where('batch_id', $batchId)
            ->where('status', 'unmatched')
            ->get();

        foreach ($transactions as $transaction) {
            $this->matchTransaction($transaction);
        }

        BankStatementBatch::find($batchId)?->update(['status' => 'completed']);
    }

    /**
     * Attempt to match a bank transaction to a pending payment.
     *
     * @param BankTransaction $transaction
     * @return void
     */
    protected function matchTransaction(BankTransaction $transaction): void
    {
        $candidates = $this->findMatchingPayments($transaction);

        if ($candidates->isEmpty()) {
            $this->escalate($transaction, null, 'No matching payment found');
            return;
        }

        if ($candidates->count() > 1) {
            $this->escalate($transaction, null, 'Multiple matching payments');
            return;
        }

        $payment = $candidates->first();
        $this->linkAndConfirm($transaction, $payment);
    }

    /**
     * Find pending payments that match the bank transaction.
     *
     * @param BankTransaction $transaction
     * @return Collection<int, Payment>
     */
    protected function findMatchingPayments(BankTransaction $transaction): Collection
    {
        $tolerance = config('reconciliation.amount_tolerance', 0.01);
        $dateDays = config('reconciliation.date_tolerance_days', 7);

        $dateFrom = Carbon::parse($transaction->transaction_date)->subDays($dateDays);
        $dateTo = Carbon::parse($transaction->transaction_date)->addDays($dateDays);

        return Payment::where('status', Controller::_PAYMENT_STATUSES[0]) // pending
            ->where('type', Controller::_PAYMENT_TYPE[1]) // telegram
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->whereRaw('ABS(amount - ?) <= ?', [$transaction->amount, $tolerance])
            ->get()
            ->filter(function (Payment $payment) use ($transaction) {
                return $this->referenceMatches($payment, $transaction);
            });
    }

    /**
     * Check if payment reference matches transaction (exact or fuzzy).
     *
     * @param Payment $payment
     * @param BankTransaction $transaction
     * @return bool
     */
    protected function referenceMatches(Payment $payment, BankTransaction $transaction): bool
    {
        $paymentRef = $payment->reference ?? '';
        $ocrRef = $payment->reconciliation_metadata['ocr_reference'] ?? null;
        $bankRef = $transaction->reference ?? '';
        $bankDesc = $transaction->description ?? '';

        $refs = array_filter([$paymentRef, $ocrRef, $bankRef, $bankDesc]);
        if (empty($refs)) {
            return true; // No reference to match
        }

        foreach ($refs as $a) {
            foreach ($refs as $b) {
                if ($a !== $b && (stripos($a, $b) !== false || stripos($b, $a) !== false)) {
                    return true;
                }
            }
        }

        return similar_text($paymentRef, $bankRef) / max(strlen($paymentRef), strlen($bankRef), 1)
            >= config('reconciliation.reference_similarity_threshold', 0.85);
    }

    /**
     * Link transaction to payment and confirm.
     *
     * @param BankTransaction $transaction
     * @param Payment $payment
     * @return void
     */
    protected function linkAndConfirm(BankTransaction $transaction, Payment $payment): void
    {
        DB::transaction(function () use ($transaction, $payment) {
            $transaction->update([
                'matched_payment_id' => $payment->id,
                'status'             => 'matched',
            ]);
            $payment->update(['bank_transaction_id' => $transaction->id]);
            $this->paymentRepository->confirm($payment);
        });

        Log::info("Reconciliation: Matched bank transaction {$transaction->id} to payment {$payment->id}");
    }

    /**
     * Create escalation for manual review.
     *
     * @param BankTransaction $transaction
     * @param int|null $paymentId
     * @param string $reason
     * @return void
     */
    protected function escalate(BankTransaction $transaction, ?int $paymentId, string $reason): void
    {
        $transaction->update(['status' => 'escalated']);

        ReconciliationEscalation::create([
            'payment_id'          => $paymentId,
            'bank_transaction_id' => $transaction->id,
            'reason'              => $reason,
            'status'              => 'pending',
        ]);
    }
}
