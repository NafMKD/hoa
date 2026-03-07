<?php

namespace Tests\Feature;

use App\Http\Controllers\Controller;
use App\Models\BankStatementBatch;
use App\Models\BankTransaction;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\ReconciliationEscalation;
use App\Models\User;
use App\Repositories\Api\V1\ReconciliationRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReconciliationMatchTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Invoice $invoice;
    private Payment $payment;
    private BankStatementBatch $batch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);

        $this->invoice = Invoice::factory()->create([
            'total_amount'  => 5000,
            'amount_paid'   => 0,
            'penalty_amount' => 0,
            'status'        => Controller::_INVOICE_STATUSES[0],
        ]);

        $this->payment = Payment::create([
            'invoice_id'    => $this->invoice->id,
            'amount'        => 5000,
            'method'        => Controller::_PAYMENT_METHODS[1],
            'reference'     => 'TGRAM-TEST-001',
            'status'        => Controller::_PAYMENT_STATUSES[0],
            'type'          => Controller::_PAYMENT_TYPE[1],
            'payment_date'  => now()->toDateString(),
        ]);

        $this->batch = BankStatementBatch::create([
            'admin_id'    => $this->admin->id,
            'file_path'   => 'test/test.csv',
            'file_name'   => 'test.csv',
            'row_count'   => 1,
            'status'      => 'processing',
            'uploaded_at'  => now(),
        ]);
    }

    public function test_single_match_auto_confirms_payment(): void
    {
        BankTransaction::create([
            'batch_id'         => $this->batch->id,
            'amount'           => 5000,
            'reference'        => 'TGRAM-TEST-001',
            'transaction_date' => now()->toDateString(),
            'description'      => 'Transfer from customer',
            'status'           => 'unmatched',
        ]);

        $repo = app(ReconciliationRepository::class);
        $repo->reconcileBatch($this->batch->id);

        $this->payment->refresh();
        $this->batch->refresh();
        $txn = BankTransaction::where('batch_id', $this->batch->id)->first();

        $this->assertEquals('confirmed', $this->payment->status);
        $this->assertEquals('matched', $txn->status);
        $this->assertEquals($this->payment->id, $txn->matched_payment_id);
        $this->assertEquals($txn->id, $this->payment->bank_transaction_id);
        $this->assertEquals('completed', $this->batch->status);
    }

    public function test_no_match_creates_escalation(): void
    {
        BankTransaction::create([
            'batch_id'         => $this->batch->id,
            'amount'           => 99999,
            'reference'        => 'UNRELATED-REF',
            'transaction_date' => now()->subMonths(6)->toDateString(),
            'description'      => 'Unknown transfer',
            'status'           => 'unmatched',
        ]);

        $repo = app(ReconciliationRepository::class);
        $repo->reconcileBatch($this->batch->id);

        $txn = BankTransaction::where('batch_id', $this->batch->id)->first();
        $this->assertEquals('escalated', $txn->status);

        $escalation = ReconciliationEscalation::where('bank_transaction_id', $txn->id)->first();
        $this->assertNotNull($escalation);
        $this->assertEquals('pending', $escalation->status);
    }

    public function test_escalation_resolve_confirm_via_api(): void
    {
        $escalation = ReconciliationEscalation::create([
            'payment_id'          => $this->payment->id,
            'bank_transaction_id' => null,
            'reason'              => 'Manual review needed',
            'status'              => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/reconciliation/escalations/{$escalation->id}/resolve", [
                'action'           => 'confirm',
                'resolution_notes' => 'Verified manually',
            ]);

        $response->assertOk();

        $escalation->refresh();
        $this->payment->refresh();

        $this->assertEquals('resolved', $escalation->status);
        $this->assertEquals($this->admin->id, $escalation->resolved_by);
        $this->assertEquals('confirmed', $this->payment->status);
    }

    public function test_escalation_resolve_fail_via_api(): void
    {
        $escalation = ReconciliationEscalation::create([
            'payment_id'          => $this->payment->id,
            'bank_transaction_id' => null,
            'reason'              => 'Suspicious payment',
            'status'              => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/reconciliation/escalations/{$escalation->id}/resolve", [
                'action'           => 'fail',
                'resolution_notes' => 'Fraudulent screenshot',
            ]);

        $response->assertOk();

        $this->payment->refresh();
        $this->assertEquals('failed', $this->payment->status);
    }
}
