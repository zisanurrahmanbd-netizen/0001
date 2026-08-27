<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\CaseFile;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CaseScopingTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $manager1;
    protected User $manager2;
    protected User $agent1;
    protected User $agent2;
    protected User $agent3;
    protected Bank $bank;
    protected Product $product;
    protected CaseFile $caseAgent1;
    protected CaseFile $caseAgent2;
    protected CaseFile $caseAgent3;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'manager', 'guard_name' => 'web']);
        Role::create(['name' => 'agent', 'guard_name' => 'web']);

        $this->admin = User::factory()->create(['name' => 'Admin', 'status' => 'active']);
        $this->admin->assignRole('admin');

        $this->manager1 = User::factory()->create(['name' => 'Manager Dhaka', 'status' => 'active']);
        $this->manager1->assignRole('manager');

        $this->manager2 = User::factory()->create(['name' => 'Manager Ctg', 'status' => 'active']);
        $this->manager2->assignRole('manager');

        $this->agent1 = User::factory()->create(['name' => 'Agent 1', 'manager_id' => $this->manager1->id, 'status' => 'active']);
        $this->agent1->assignRole('agent');

        $this->agent2 = User::factory()->create(['name' => 'Agent 2', 'manager_id' => $this->manager1->id, 'status' => 'active']);
        $this->agent2->assignRole('agent');

        $this->agent3 = User::factory()->create(['name' => 'Agent 3', 'manager_id' => $this->manager2->id, 'status' => 'active']);
        $this->agent3->assignRole('agent');

        $this->bank = Bank::create(['name' => 'One Bank', 'code' => 'one_bank', 'is_active' => true]);
        $this->product = Product::create(['bank_id' => $this->bank->id, 'name' => 'Credit Card', 'code' => 'credit_card']);

        $this->caseAgent1 = CaseFile::create([
            'file_number' => 'CASE-001',
            'bank_id' => $this->bank->id,
            'product_id' => $this->product->id,
            'customer_name' => 'Customer Agent 1',
            'assigned_agent_id' => $this->agent1->id,
            'assigned_manager_id' => $this->manager1->id,
            'status' => 'in_progress',
        ]);

        $this->caseAgent2 = CaseFile::create([
            'file_number' => 'CASE-002',
            'bank_id' => $this->bank->id,
            'product_id' => $this->product->id,
            'customer_name' => 'Customer Agent 2',
            'assigned_agent_id' => $this->agent2->id,
            'assigned_manager_id' => $this->manager1->id,
            'status' => 'in_progress',
        ]);

        $this->caseAgent3 = CaseFile::create([
            'file_number' => 'CASE-003',
            'bank_id' => $this->bank->id,
            'product_id' => $this->product->id,
            'customer_name' => 'Customer Agent 3',
            'assigned_agent_id' => $this->agent3->id,
            'assigned_manager_id' => $this->manager2->id,
            'status' => 'in_progress',
        ]);
    }

    public function test_admin_can_see_all_cases(): void
    {
        $scopedCases = CaseFile::forUser($this->admin)->get();
        $this->assertCount(3, $scopedCases);

        $response = $this->actingAs($this->admin)->get(route('cases.index'));
        $response->assertStatus(200);
        $response->assertSee('CASE-001');
        $response->assertSee('CASE-002');
        $response->assertSee('CASE-003');
    }

    public function test_manager_sees_only_own_team_cases(): void
    {
        $scopedCases = CaseFile::forUser($this->manager1)->get();
        $this->assertCount(2, $scopedCases);
        $this->assertTrue($scopedCases->contains('file_number', 'CASE-001'));
        $this->assertTrue($scopedCases->contains('file_number', 'CASE-002'));
        $this->assertFalse($scopedCases->contains('file_number', 'CASE-003'));

        $response = $this->actingAs($this->manager1)->get(route('cases.index'));
        $response->assertStatus(200);
        $response->assertSee('CASE-001');
        $response->assertSee('CASE-002');
        $response->assertDontSee('CASE-003');
    }

    public function test_agent_sees_only_own_assigned_case(): void
    {
        $scopedCases = CaseFile::forUser($this->agent1)->get();
        $this->assertCount(1, $scopedCases);
        $this->assertTrue($scopedCases->contains('file_number', 'CASE-001'));
        $this->assertFalse($scopedCases->contains('file_number', 'CASE-002'));
        $this->assertFalse($scopedCases->contains('file_number', 'CASE-003'));

        $response = $this->actingAs($this->agent1)->get(route('cases.index'));
        $response->assertStatus(200);
        $response->assertSee('CASE-001');
        $response->assertDontSee('CASE-002');
        $response->assertDontSee('CASE-003');
    }

    public function test_agent_cannot_view_unassigned_case_detail(): void
    {
        // Agent 1 tries to view Case 3 (assigned to Agent 3)
        $response = $this->actingAs($this->agent1)->get(route('cases.show', $this->caseAgent3->id));
        $response->assertStatus(404);
    }
}