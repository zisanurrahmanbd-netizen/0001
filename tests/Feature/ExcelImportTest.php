<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\CaseFile;
use App\Models\Product;
use App\Models\User;
use App\Services\ExcelImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ExcelImportTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $agent;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'manager', 'guard_name' => 'web']);
        Role::create(['name' => 'agent', 'guard_name' => 'web']);

        $this->admin = User::factory()->create(['email' => 'admin@test.local', 'status' => 'active']);
        $this->admin->assignRole('admin');

        $this->agent = User::factory()->create([
            'name' => 'Md. Abdur Rahim',
            'email' => 'agent.rahim@test.local',
            'status' => 'active',
        ]);
        $this->agent->assignRole('agent');
    }

    public function test_excel_importer_service_can_inspect_sample_workbook(): void
    {
        $filePath = base_path('sample_data/OneBank_Recovery_Workbook.xlsx');
        if (!file_exists($filePath)) {
            $this->markTestSkipped('Sample workbook does not exist');
        }

        $service = app(ExcelImportService::class);
        $sheets = $service->inspectFile($filePath);

        $this->assertNotEmpty($sheets);
        $sheetNames = array_column($sheets, 'sheet_name');
        $this->assertContains('OneBank_CreditCard', $sheetNames);
        $this->assertContains('OneBank_Loan', $sheetNames);
    }

    public function test_excel_importer_service_can_import_sheet(): void
    {
        $filePath = base_path('sample_data/OneBank_Recovery_Workbook.xlsx');
        if (!file_exists($filePath)) {
            $this->markTestSkipped('Sample workbook does not exist');
        }

        $service = app(ExcelImportService::class);
        $summary = $service->importSheet($filePath, 'OneBank_CreditCard');

        $this->assertGreaterThan(0, $summary['imported']);
        $this->assertDatabaseHas('banks', ['name' => 'One Bank Limited']);
        $this->assertDatabaseHas('products', ['code' => 'credit_card']);
        $this->assertDatabaseHas('cases', ['file_number' => 'CC4521000101']);
    }
}