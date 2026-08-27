<?php

namespace App\Jobs;

use App\Models\ImportJob;
use App\Services\ExcelImportService;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessExcelImportJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 600; // 10 minutes for large spreadsheets

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $filePath,
        public ImportJob $importJob,
        public ?string $sheetName = null,
        public ?int $bankId = null,
        public ?int $productId = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(ExcelImportService $importer): void
    {
        try {
            $this->importJob->update(['status' => 'processing']);

            $result = $importer->importSheet(
                $this->filePath,
                $this->sheetName,
                $this->bankId,
                $this->productId,
                $this->importJob,
                false // not a dry run
            );

            Log::info("Excel import completed successfully for job {$this->importJob->id}", $result);
        } catch (Exception $e) {
            Log::error("Excel import failed for job {$this->importJob->id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            $this->importJob->update([
                'status' => 'failed',
                'error_log' => array_merge($this->importJob->error_log ?? [], [$e->getMessage()]),
            ]);
        }
    }
}
