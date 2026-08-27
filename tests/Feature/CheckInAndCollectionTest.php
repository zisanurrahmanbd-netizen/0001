<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\CaseFile;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CheckInAndCollectionTest extends TestCase
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

        $this->agent = User::factory()->create(['name' => 'Test Agent', 'status' => 'active']);
        $this->agent->assignRole('agent');

        $this->bank = Bank::create(['name' => 'One Bank', 'code' => 'one_bank', 'is_active' => true]);
        $this->product = Product::create(['bank_id' => $this->bank->id, 'name' => 'Credit Card', 'code' => 'credit_card']);

        $this->case = CaseFile::create([
            'file_number' => 'CASE-CHK-001',
            'bank_id' => $this->bank->id,
            'product_id' => $this->product->id,
            'customer_name' => 'Customer With Location',
            'customer_phone' => '01711-000000',
            'assigned_agent_id' => $this->agent->id,
            'outstanding_amount' => 50000.00,
            'status' => 'new',
            'present_address_visited' => false,
            'permanent_address_visited' => false,
        ]);
    }

    public function test_agent_can_log_gps_check_in(): void
    {
        $response = $this->actingAs($this->agent)->post(route('cases.check-in', $this->case->id), [
            'address_type' => 'present',
            'latitude' => 23.8103320,
            'longitude' => 90.4125180,
            'accuracy' => 12.5,
            'address_text' => 'Gulshan 2, Dhaka',
            'notes' => 'Customer met in person, agreed to pay next week.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('check_ins', [
            'case_file_id' => $this->case->id,
            'agent_id' => $this->agent->id,
            'address_type' => 'present',
            'notes' => 'Customer met in person, agreed to pay next week.',
        ]);

        $this->case->refresh();
        $this->assertTrue($this->case->present_address_visited);
        $this->assertEquals('visited', $this->case->status);
        $this->assertNotNull($this->case->last_visit_at);
    }

    public function test_agent_can_record_payment_collection(): void
    {
        $response = $this->actingAs($this->agent)->post(route('cases.collections', $this->case->id), [
            'amount' => 15000.00,
            'payment_method' => 'cash',
            'receipt_number' => 'REC-998811',
            'notes' => 'Partial payment received in cash.',
            'collected_at' => now()->format('Y-m-d H:i:s'),
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('collections', [
            'case_file_id' => $this->case->id,
            'agent_id' => $this->agent->id,
            'amount' => 15000.00,
            'payment_method' => 'cash',
            'receipt_number' => 'REC-998811',
        ]);

        $this->case->refresh();
        $this->assertEquals(15000.00, (float) $this->case->total_collected_amount);
    }

    public function test_full_collection_settles_case(): void
    {
        $this->actingAs($this->agent)->post(route('cases.collections', $this->case->id), [
            'amount' => 50000.00,
            'payment_method' => 'bkash',
            'receipt_number' => 'REC-SETTLE-001',
            'notes' => 'Full settlement amount received.',
            'collected_at' => now()->format('Y-m-d H:i:s'),
        ]);

        $this->case->refresh();
        $this->assertEquals(50000.00, (float) $this->case->total_collected_amount);
        $this->assertEquals('settled', $this->case->status);
    }
}