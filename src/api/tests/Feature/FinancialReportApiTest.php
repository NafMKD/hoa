<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialReportApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_homeowner_cannot_view_financial_reports(): void
    {
        $user = User::factory()->create(['role' => 'homeowner', 'status' => 'active']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/financial-reports/income-summary?'.http_build_query([
            'date_from' => '2026-01-01',
            'date_to' => '2026-01-31',
        ]));

        $response->assertStatus(403);
    }

    public function test_accountant_can_fetch_income_summary(): void
    {
        $user = User::factory()->create(['role' => 'accountant', 'status' => 'active']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/financial-reports/income-summary?'.http_build_query([
            'date_from' => '2026-01-01',
            'date_to' => '2026-01-31',
        ]));

        $response->assertOk();
        $response->assertJsonPath('status', 'success');
        $response->assertJsonStructure([
            'data' => [
                'period' => ['date_from', 'date_to'],
                'basis',
                'totals' => ['amount', 'payment_count'],
                'by_building',
            ],
        ]);
        $this->assertSame(0.0, (float) $response->json('data.totals.amount'));
    }

    public function test_profit_and_loss_reconciles_income_minus_expenses(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'status' => 'active']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/financial-reports/profit-and-loss?'.http_build_query([
            'date_from' => '2026-04-01',
            'date_to' => '2026-04-30',
        ]));

        $response->assertOk();
        $income = (float) $response->json('data.totals.total_income');
        $expenses = (float) $response->json('data.totals.total_expenses');
        $net = (float) $response->json('data.totals.net');
        $this->assertEqualsWithDelta($income - $expenses, $net, 0.001);
    }

    public function test_invalid_date_range_returns_400(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'status' => 'active']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/financial-reports/income-summary?'.http_build_query([
            'date_from' => '2026-02-01',
            'date_to' => '2026-01-01',
        ]));

        $response->assertStatus(422);
    }
}
