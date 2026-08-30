<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessExcelImportJob;
use App\Models\Bank;
use App\Models\ImportJob;
use App\Models\Product;
use App\Services\ExcelImportService;
use App\Services\TemplateGeneratorService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExcelImportController extends Controller
{
    public function __construct(
        protected ExcelImportService $importer,
        protected TemplateGeneratorService $templateGenerator
    ) {}

    public function index(Request $request): View
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            abort(403, 'Unauthorized access to Excel import system.');
        }

        $importJobs = ImportJob::with(['user', 'bank', 'product'])
            ->latest()
            ->paginate(15);

        $banks = Bank::where('is_active', true)->orderBy('name')->get();
        $products = Product::orderBy('name')->get();
        $availableTemplates = $this->templateGenerator->getAvailableTemplates();

        return view('imports.index', compact('importJobs', 'banks', 'products', 'availableTemplates'));
    }

    public function inspect(Request $request): JsonResponse
    {
        $request->validate([
            'excel_file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:51200'], // max 50MB
        ]);

        $file = $request->file('excel_file');
        $path = $file->store('temp_imports');
        $fullPath = Storage::path($path);

        try {
            $sheetsInfo = $this->importer->inspectFile($fullPath);

            return response()->json([
                'success' => true,
                'temp_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'sheets' => $sheetsInfo,
            ]);
        } catch (Exception $e) {
            Storage::delete($path);
            return response()->json([
                'success' => false,
                'error' => 'Failed to parse workbook: ' . $e->getMessage(),
            ], 422);
        }
    }

    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'temp_path' => ['required', 'string'],
            'sheet_name' => ['required', 'string'],
            'bank_id' => ['nullable', 'exists:banks,id'],
            'product_id' => ['nullable', 'exists:products,id'],
        ]);

        $fullPath = Storage::path($request->input('temp_path'));
        if (!file_exists($fullPath)) {
            return response()->json(['error' => 'Temporary file expired. Please upload again.'], 404);
        }

        try {
            $result = $this->importer->importSheet(
                $fullPath,
                $request->input('sheet_name'),
                $request->input('bank_id'),
                $request->input('product_id'),
                null,
                true // dry run
            );

            return response()->json([
                'success' => true,
                'preview' => $result,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $request->validate([
            'excel_file' => ['nullable', 'file', 'mimes:xlsx,xls,csv', 'max:51200'],
            'temp_path' => ['nullable', 'string'],
            'sheet_name' => ['nullable', 'string'],
            'bank_id' => ['nullable', 'exists:banks,id'],
            'product_id' => ['nullable', 'exists:products,id'],
            'queue' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();

        // Determine file path
        if ($request->hasFile('excel_file')) {
            $file = $request->file('excel_file');
            $originalName = $file->getClientOriginalName();
            $storedPath = $file->store('imports');
            $fullPath = Storage::path($storedPath);
        } elseif ($request->filled('temp_path')) {
            $tempPath = $request->input('temp_path');
            $fullPath = Storage::path($tempPath);
            $originalName = basename($tempPath);
        } else {
            return back()->withErrors(['excel_file' => 'Please provide an Excel file to import.']);
        }

        $sheetName = $request->input('sheet_name');
        $bankId = $request->input('bank_id');
        $productId = $request->input('product_id');
        $useQueue = $request->boolean('queue', false);

        $importJob = ImportJob::create([
            'user_id' => $user->id,
            'file_name' => $originalName,
            'sheet_name' => $sheetName,
            'bank_id' => $bankId,
            'product_id' => $productId,
            'status' => 'pending',
        ]);

        if ($useQueue) {
            ProcessExcelImportJob::dispatch($fullPath, $importJob, $sheetName, $bankId, $productId);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'queued' => true,
                    'job_id' => $importJob->id,
                    'message' => "Import job #{$importJob->id} queued for background processing.",
                ]);
            }

            return redirect()->route('imports.index')
                ->with('info', "Import job #{$importJob->id} is processing in the background.");
        }

        // Run synchronously
        try {
            $result = $this->importer->importSheet(
                $fullPath,
                $sheetName,
                $bankId,
                $productId,
                $importJob,
                false
            );

            $msg = "Import completed: {$result['imported']} new records created, {$result['updated']} updated.";
            if (!empty($result['created_agents'])) {
                $msg .= " (" . count($result['created_agents']) . " placeholder agent accounts auto-provisioned).";
            }

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'queued' => false,
                    'job_id' => $importJob->id,
                    'result' => $result,
                    'message' => $msg,
                ]);
            }

            return redirect()->route('imports.index')->with('success', $msg);
        } catch (Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
            }

            return back()->withErrors(['excel_file' => 'Import failed: ' . $e->getMessage()]);
        }
    }

    public function jobStatus(int $jobId): JsonResponse
    {
        $job = ImportJob::with(['user', 'bank', 'product'])->findOrFail($jobId);

        return response()->json([
            'id' => $job->id,
            'status' => $job->status,
            'file_name' => $job->file_name,
            'sheet_name' => $job->sheet_name,
            'total_rows' => $job->total_rows,
            'imported_rows' => $job->imported_rows,
            'updated_rows' => $job->updated_rows,
            'failed_rows' => $job->failed_rows,
            'error_log' => $job->error_log,
            'created_at' => $job->created_at->diffForHumans(),
            'updated_at' => $job->updated_at->diffForHumans(),
        ]);
    }

    /**
     * Download pre-configured Excel template for any bank/product or master workbook.
     */
    public function downloadTemplate(string $type): StreamedResponse
    {
        return $this->templateGenerator->downloadTemplate($type);
    }

    /**
     * Build and download a custom Excel template with user-selected columns.
     */
    public function customTemplate(Request $request): StreamedResponse
    {
        $request->validate([
            'bank_name' => 'required|string|max:100',
            'product_name' => 'required|string|max:100',
            'columns' => 'required|array|min:3',
        ]);

        $bankName = $request->input('bank_name');
        $productName = $request->input('product_name');
        $headers = array_map(fn($col) => strtoupper(trim($col)), $request->input('columns'));

        // Generate sample row for instructions
        $sampleRow = [];
        foreach ($headers as $h) {
            $upper = strtoupper($h);
            if (str_contains($upper, 'NO') || str_contains($upper, 'ID') || str_contains($upper, 'A/C')) {
                $sampleRow[] = 'ACC-2026-001';
            } elseif (str_contains($upper, 'NAME')) {
                $sampleRow[] = 'Md. Sample Customer';
            } elseif (str_contains($upper, 'PHONE') || str_contains($upper, 'MOBILE') || str_contains($upper, 'CONTACT')) {
                $sampleRow[] = '01711-223344';
            } elseif (str_contains($upper, 'ADDRESS')) {
                $sampleRow[] = 'House 12, Road 5, Dhanmondi, Dhaka';
            } elseif (str_contains($upper, 'OUTSTANDING') || str_contains($upper, 'DUE') || str_contains($upper, 'AMOUNT')) {
                $sampleRow[] = '150000.00';
            } elseif (str_contains($upper, 'STATUS')) {
                $sampleRow[] = 'active';
            } elseif (str_contains($upper, 'DATE')) {
                $sampleRow[] = date('Y-m-d');
            } elseif (str_contains($upper, 'AGENT')) {
                $sampleRow[] = 'Md. Abdur Rahim';
            } else {
                $sampleRow[] = 'Sample Data';
            }
        }

        return $this->templateGenerator->generateCustomTemplate($bankName, $productName, $headers, [$sampleRow]);
    }
}
