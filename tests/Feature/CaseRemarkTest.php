<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\CaseFile;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CaseRemarkTest extends TestCase
{
    use RefreshDatabase;

    protected User $agent;
    protected Bank $bank;
    protected Product $product;
    protected CaseFile $case;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'agent', 'guard_name' => 'web']);
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $this->agent = User::factory()->create(['name' => 'Field Agent Rahim', 'status' => 'active']);
        $this->agent->assignRole('agent');

        $this->bank = Bank::create(['name' => 'One Bank', 'code' => 'one_bank', 'is_active' => true]);
        $this->product = Product::create(['bank_id' => $this->bank->id, 'name' => 'Credit Card', 'code' => 'credit_card']);

        $this->case = CaseFile::create([
            'file_number' => 'CASE-REM-001',
            'bank_id' => $this->bank->id,
            'product_id' => $this->product->id,
            'customer_name' => 'Customer With Remarks',
            'customer_phone' => '01711-223344',
            'assigned_agent_id' => $this->agent->id,
            'outstanding_amount' => 60000.00,
            'status' => 'new',
        ]);
    }

    public function test_agent_can_log_remark_with_ptp(): void
    {
        $response = $this->actingAs($this->agent)->post(route('cases.remarks.store', $this->case->id), [
            'contact_status' => 'contacted',
            'communication_type' => 'phone',
            'contact_date' => now()->format('Y-m-d'),
            'ptp_committed' => 'yes',
            'ptp_date' => now()->addDays(5)->format('Y-m-d'),
            'ptp_amount' => 20000.00,
            'new_contact_no' => '01811-998877',
            'new_address' => 'House 45, Road 12, Dhanmondi, Dhaka',
            'remark' => 'Spoke with customer directly. Agreed to deposit 20k by next Monday.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('case_remarks', [
            'case_file_id' => $this->case->id,
            'agent_id' => $this->agent->id,
            'contact_status' => 'contacted',
            'communication_type' => 'phone',
            'ptp_committed' => true,
            'ptp_amount' => 20000.00,
            'new_contact_no' => '01811-998877',
            'new_address' => 'House 45, Road 12, Dhanmondi, Dhaka',
            'remark' => 'Spoke with customer directly. Agreed to deposit 20k by next Monday.',
        ]);

        $this->case->refresh();
        $this->assertEquals('01811-998877', $this->case->customer_secondary_phone);
        $this->assertEquals('in_progress', $this->case->status);
    }

    public function test_agent_can_log_uncontacted_remark(): void
    {
        $response = $this->actingAs($this->agent)->post(route('cases.remarks.store', $this->case->id), [
            'contact_status' => 'not_contacted',
            'contact_date' => now()->format('Y-m-d'),
            'ptp_committed' => 'no',
            'remark' => 'Customer phone switched off continuously for 3 days.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('case_remarks', [
            'case_file_id' => $this->case->id,
            'agent_id' => $this->agent->id,
            'contact_status' => 'not_contacted',
            'ptp_committed' => false,
            'remark' => 'Customer phone switched off continuously for 3 days.',
        ]);
    }
}