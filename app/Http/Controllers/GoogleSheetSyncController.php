<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\CaseFile;
use App\Models\CaseRemark;
use App\Models\Collection;
use App\Services\GoogleSheetSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class GoogleSheetSyncController extends Controller
{
    public function __construct(
        protected GoogleSheetSyncService $syncService
    ) {}

    /**
     * Display Google Sheet Sync Dashboard.
     */
    public function index(): View
    {
        $defaultUrl = config('services.google_sheet.default_url', 'https://docs.google.com/spreadsheets/d/1t3Db-kneeUqejDIcc_Y-q8rVRpYhJOGhaDFS9cXQ7dc/edit?usp=sharing');
        $banks = Bank::with('products')->where('is_active', true)->get();
        $totalCases = CaseFile::count();
        $totalRemarks = CaseRemark::count();
        $totalCollections = Collection::count();

        // Sample Apps Script Code for user's Google Sheet
        $appScriptCode = $this->generateAppsScriptCode(url('/api/sync/google-sheet/webhook'));

        return view('sync.google_sheet', compact(
            'defaultUrl',
            'banks',
            'totalCases',
            'totalRemarks',
            'totalCollections',
            'appScriptCode'
        ));
    }

    /**
     * Inspect Google Sheet without writing to DB.
     */
    public function inspect(Request $request): JsonResponse
    {
        $request->validate([
            'sheet_url' => 'required|url',
        ]);

        try {
            $data = $this->syncService->fetchCsvRows($request->input('sheet_url'));
            return response()->json([
                'success' => true,
                'total_rows' => $data['total_rows'],
                'spreadsheet_id' => $data['spreadsheet_id'],
                'preview_rows' => array_slice($data['rows'], 0, 8),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Sync data from Google Sheet to Database.
     */
    public function sync(Request $request): RedirectResponse
    {
        $request->validate([
            'sheet_url' => 'required|url',
            'bank_id' => 'nullable|exists:banks,id',
            'product_id' => 'nullable|exists:products,id',
        ]);

        try {
            $result = $this->syncService->importSheetData(
                $request->input('sheet_url'),
                $request->input('bank_id'),
                $request->input('product_id'),
                auth()->id()
            );

            return redirect()->route('google-sheet.index')->with(
                'success',
                "Google Sheet Synced successfully! Imported {$result['imported']} new files, updated {$result['updated']} existing files."
            );
        } catch (\Exception $e) {
            return redirect()->route('google-sheet.index')->with(
                'error',
                "Failed to sync Google Sheet: " . $e->getMessage()
            );
        }
    }

    /**
     * Push latest remarks and collections to Google Apps Script Webhook.
     */
    public function pushUpdates(Request $request): RedirectResponse
    {
        $request->validate([
            'webhook_url' => 'required|url',
        ]);

        $webhookUrl = $request->input('webhook_url');

        // Fetch recent remarks
        $remarks = CaseRemark::with(['case', 'agent'])->latest()->take(50)->get()->map(function ($r) {
            return [
                'type' => 'remark',
                'file_number' => $r->case?->file_number,
                'customer_name' => $r->case?->customer_name,
                'agent_name' => $r->agent?->name,
                'contact_status' => $r->contact_status,
                'communication_type' => $r->communication_type,
                'contact_date' => $r->contact_date?->toDateString(),
                'ptp_committed' => $r->ptp_committed ? 'YES' : 'NO',
                'ptp_date' => $r->ptp_date?->toDateString(),
                'ptp_amount' => $r->ptp_amount,
                'new_contact_no' => $r->new_contact_no,
                'new_address' => $r->new_address,
                'remark' => $r->remark,
                'logged_at' => $r->created_at->toDateTimeString(),
            ];
        });

        $success = $this->syncService->pushToGoogleSheetWebhook($webhookUrl, [
            'event' => 'bulk_sync',
            'remarks' => $remarks->toArray(),
            'timestamp' => now()->toIso8601String(),
        ]);

        if ($success) {
            return back()->with('success', 'Successfully pushed recent field logs to your Google Sheet webhook!');
        }

        return back()->with('error', 'Could not push to Google Sheet webhook. Please verify your Apps Script Web App URL.');
    }

    /**
     * Webhook receiver from Google Sheet onEdit trigger.
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        // Process incoming row payload
        if (isset($payload['file_number'])) {
            $case = CaseFile::where('file_number', $payload['file_number'])->first();
            if ($case) {
                if (isset($payload['status'])) $case->status = $payload['status'];
                if (isset($payload['outstanding_amount'])) $case->outstanding_amount = (float)$payload['outstanding_amount'];
                $case->save();
            }
        }

        return response()->json(['status' => 'received', 'timestamp' => now()]);
    }

    protected function generateAppsScriptCode(string $webhookUrl): string
    {
        return <<<JAVASCRIPT
/**
 * 2-Way Live Sync Script for Bank Recovery System
 * Paste this into: Extensions > Apps Script in your Google Sheet
 */

const LARAVEL_WEBHOOK_URL = "{$webhookUrl}";

function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const row = e.range.getRow();
  
  if (row <= 1) return; // Skip headers
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowValues = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const payload = {};
  headers.forEach((h, i) => {
    payload[h] = rowValues[i];
  });
  
  // Send row update to Laravel
  try {
    UrlFetchApp.fetch(LARAVEL_WEBHOOK_URL, {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log("Sync error: " + err.message);
  }
}

// Receive pushed remarks and collections from Laravel
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let remarkSheet = ss.getSheetByName("Field_Remarks");
    
    if (!remarkSheet) {
      remarkSheet = ss.insertSheet("Field_Remarks");
      remarkSheet.appendRow([
        "Logged At", "File No", "Customer", "Agent", "Contact Status", 
        "Comm Type", "PTP", "PTP Date", "PTP Amount", "New Contact", "New Address", "Remark"
      ]);
    }
    
    if (data.remarks && Array.isArray(data.remarks)) {
      data.remarks.forEach(r => {
        remarkSheet.appendRow([
          r.logged_at, r.file_number, r.customer_name, r.agent_name, r.contact_status,
          r.communication_type, r.ptp_committed, r.ptp_date, r.ptp_amount, r.new_contact_no, r.new_address, r.remark
        ]);
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}
JAVASCRIPT;
    }
}