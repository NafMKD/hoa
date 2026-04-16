<?php

namespace Tests\Feature;

use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseCategoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_expense_categories(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/expense-categories');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'code', 'is_system', 'is_active'],
            ],
        ]);
    }

    public function test_secretary_cannot_create_expense_category(): void
    {
        $user = User::factory()->create(['role' => 'secretary', 'status' => 'active']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/expense-categories', [
            'name' => 'Custom',
            'code' => 'custom_cat',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_cannot_delete_system_payroll_category(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);

        $payroll = ExpenseCategory::query()->where('code', 'payroll')->first();
        $this->assertNotNull($payroll);

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/v1/expense-categories/'.$payroll->id);

        $response->assertStatus(400);
        $this->assertStringContainsString('System expense categories', $response->json('message'));
    }
}
