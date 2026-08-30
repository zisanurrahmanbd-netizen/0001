<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\CaseFile;
use App\Models\Product;
use App\Models\User;
use App\Services\GoogleSheetSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class GoogleSheetSyncTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'agent', 'guard_name' => 'web']);

        $this->admin = User::factory()->create(['status' => 'active']);
        $this->admin->assignRole('admin');
    }

    public function test_google_sheet_page_renders_for_admin(): void
    {
        $response = $this->actingAs($this->admin)->get(route('google-sheet.index'));
        $response->assertStatus(200);
        $response->assertSee('Google Sheets 2-Way Live Sync');
    }

    public function test_google_sheet_sync_service_imports_cases(): void
    {
        $fakeCsv = "File No,Customer Name,Phone,Present Address,Total Outstanding,Total Overdue,Agent Name\n" .
                   "GS-TEST-001,Abdur Rahman,01711122233,Dhanmondi Dhaka,50000,15000,Rahim\n" .
                   "GS-TEST-002,Fatema Begum,01811122233,Gulshan Dhaka,75000,20000,Karim\n";

        Http::fake([
            'https://docs.google.com/spreadsheets/d/*/export*' => Http::response($fakeCsv, 200),
        ]);

        $service = app(GoogleSheetSyncService::class);
        $result = $service->importSheetData('https://docs.google.com/spreadsheets/d/test12345/edit?usp=sharing');

        $this->assertEquals(2, $result['imported']);
        $this->assertDatabaseHas('cases', [
            'file_number' => 'GS-TEST-001',
            'customer_name' => 'Abdur Rahman',
            'outstanding_amount' => 50000.00,
        ]);
        $this->assertDatabaseHas('cases', [
            'file_number' => 'GS-TEST-002',
            'customer_name' => 'Fatema Begum',
            'outstanding_amount' => 75000.00,
        ]);
    }

    public function test_google_sheet_webhook_receives_updates(): void
    {
        $bank = Bank::create(['name' => 'Test Bank', 'code' => 'test_bank', 'is_active' => true]);
        $product = Product::create(['bank_id' => $bank->id, 'name' => 'Loan', 'code' => 'loan']);
        $case = CaseFile::create([
            'file_number' => 'GS-WEBHOOK-001',
            'bank_id' => $bank->id,
            'product_id' => $product->id,
            'customer_name' => 'Webhook Customer',
            'outstanding_amount' => 100000.00,
            'status' => 'new',
        ]);

        $response = $this->postJson(route('api.google-sheet.webhook'), [
            'file_number' => 'GS-WEBHOOK-001',
            'status' => 'visited',
            'outstanding_amount' => 85000.00,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('cases', [
            'file_number' => 'GS-WEBHOOK-001',
            'status' => 'visited',
            'outstanding_amount' => 85000.00,
        ]);
    }
}