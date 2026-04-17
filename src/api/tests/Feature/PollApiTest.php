<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PollApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_cannot_list_polls(): void
    {
        $this->getJson('/api/v1/polls')->assertUnauthorized();
    }

    public function test_tenant_cannot_list_polls(): void
    {
        $user = User::factory()->create(['role' => 'tenant', 'status' => 'active']);

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/polls')->assertForbidden();
    }

    public function test_admin_can_create_draft_poll(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);

        $start = now()->addDay();
        $end = now()->addWeek();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/polls', [
            'title' => 'Budget approval',
            'description' => 'Annual vote',
            'eligible_scope' => ['type' => 'all'],
            'start_at' => $start->toIso8601String(),
            'end_at' => $end->toIso8601String(),
            'options' => [
                ['option_text' => 'Yes'],
                ['option_text' => 'No'],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.status', 'draft');
        $response->assertJsonPath('data.title', 'Budget approval');
    }
}
