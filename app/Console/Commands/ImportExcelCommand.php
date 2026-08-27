<?php

namespace App\Console\Commands;

use App\Models\Bank;
use App\Models\ImportJob;
use App\Models\Product;
use App\Services\ExcelImportService;
use App\Jobs\ProcessExcelImportJob;
use Illuminate\Console\Command;

class ImportExcelCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bank:import-excel 
                            {path : Path to the Excel or CSV file}
                            {--sheet= : Name of the worksheet to import}
                            {--bank= : Bank ID or Code}
                            {--product= : Product ID or Code}
                            {--queue : Process import in the background queue}
                            {--dry-run : Run validation and preview without database writes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import recovery files, agent roster, or bank contacts from an Excel spreadsheet or CSV';

    /**
     * Execute the console command.
     */
    public function handle(ExcelImportService $importer): int
    {
        $path = $this->argument('path');

        if (!file_exists($path)) {
            $this->error("File not found at path: {$path}");
            return Command::FAILURE;
        }

        $sheet = $this->option('sheet');
        $bankInput = $this->option('bank');
        $productInput = $this->option('product');
        $dryRun = $this->option('dry-run');
        $useQueue = $this->option('queue');

        $bankId = null;
        if ($bankInput) {
            $bank = is_numeric($bankInput) ? Bank::find($bankInput) : Bank::where('code', $bankInput)->first();
            $bankId = $bank?->id;
        }

        $productId = null;
        if ($productInput) {
            $product = is_numeric($productInput) ? Product::find($productInput) : Product::where('code', $productInput)->first();
            $productId = $product?->id;
        }

        $this->info("Inspecting workbook: {$path}");
        $sheetsInfo = $importer->inspectFile($path);

        $this->table(
            ['Sheet Name', 'Data Rows', 'Columns', 'Detected Type', 'Matched Bank', 'Matched Product'],
            array_map(fn($s) => [
                $s['sheet_name'],
                $s['total_rows'],
                $s['columns_count'],
                $s['detected_type'],
                $s['bank_name'] ?? '-',
                $s['product_name'] ?? '-',
            ], $sheetsInfo)
        );

        $selectedSheet = $sheet;
        if (!$selectedSheet) {
            if (count($sheetsInfo) === 1) {
                $selectedSheet = $sheetsInfo[0]['sheet_name'];
            } else {
                $selectedSheet = $this->choice(
                    'Which sheet would you like to import?',
                    array_column($sheetsInfo, 'sheet_name'),
                    0
                );
            }
        }

        $this->info("Processing sheet: '{$selectedSheet}'" . ($dryRun ? ' [DRY RUN]' : ''));

        $importJob = ImportJob::create([
            'file_name' => basename($path),
            'sheet_name' => $selectedSheet,
            'bank_id' => $bankId,
            'product_id' => $productId,
            'status' => 'processing',
        ]);

        if ($useQueue && !$dryRun) {
            ProcessExcelImportJob::dispatch($path, $importJob, $selectedSheet, $bankId, $productId);
            $this->info("Import queued successfully with Job ID #{$importJob->id}.");
            return Command::SUCCESS;
        }

        $startTime = microtime(true);
        $result = $importer->importSheet($path, $selectedSheet, $bankId, $productId, $importJob, $dryRun);
        $duration = round(microtime(true) - $startTime, 2);

        $this->newLine();
        $this->info("Import Summary ({$duration}s):");
        $this->line(" - Total Rows:     {$result['total']}");
        $this->line(" - New Records:    {$result['imported']}");
        $this->line(" - Updated:        {$result['updated']}");
        $this->line(" - Failed:         {$result['failed']}");

        if (!empty($result['created_agents'])) {
            $this->warn("Auto-created " . count($result['created_agents']) . " placeholder agent accounts:");
            foreach ($result['created_agents'] as $ag) {
                $this->line("   * {$ag['name']} ({$ag['email']})");
            }
        }

        if (!empty($result['errors'])) {
            $this->error("Errors encountered:");
            foreach (array_slice($result['errors'], 0, 10) as $err) {
                $this->line("   * {$err}");
            }
        }

        return $result['failed'] > 0 && $result['imported'] === 0 ? Command::FAILURE : Command::SUCCESS;
    }
}
