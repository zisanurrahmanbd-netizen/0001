<?php

namespace App\Services;

use App\Models\Bank;
use App\Models\CaseFile;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GoogleSheetSyncService
{
    /**
     * Parse Google Spreadsheet ID from any valid Google Sheet sharing URL.
     */
    public function extractSpreadsheetId(string $url): ?string
    {
        if (preg_match('/\/d\/([a-zA-Z0-9-_]+)/', $url, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Extract GID from Google Sheet URL if present.
     */
    public function extractGid(string $url): string
    {
        if (preg_match('/[#&?]gid=([0-9]+)/', $url, $matches)) {
            return $matches[1];
        }
        return '0';
    }

    /**
     * Build direct CSV export URL for a Google Sheet ID and GID.
     */
    public function buildCsvExportUrl(string $spreadsheetId, string $gid = '0'): string
    {
        return "https://docs.google.com/spreadsheets/d/{$spreadsheetId}/export?format=csv&gid={$gid}";
    }

    /**
     * Fetch and parse CSV data from Google Sheet.
     */
    public function fetchCsvRows(string $url): array
    {
        $spreadsheetId = $this->extractSpreadsheetId($url);
        if (!$spreadsheetId) {
            throw new \InvalidArgumentException("Invalid Google Sheet URL. Could not extract spreadsheet ID.");
        }

        $gid = $this->extractGid($url);
        $exportUrl = $this->buildCsvExportUrl($spreadsheetId, $gid);

        $response = Http::withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BankRecoverySystem/1.0',
        ])->timeout(30)->get($exportUrl);

        if (!$response->successful()) {
            throw new \RuntimeException("Failed to fetch Google Sheet data. Ensure the Google Sheet is shared with 'Anyone with the link can view/edit'. (HTTP Status: {$response->status()})");
        }

        $csvContent = $response->body();
        $lines = explode("\n", $csvContent);
        $rows = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;
            $row = str_getcsv($line);
            $rows[] = $row;
        }

        return [
            'spreadsheet_id' => $spreadsheetId,
            'gid' => $gid,
            'rows' => $rows,
            'total_rows' => count($rows),
        ];
    }

    /**
     * Import rows from Google Sheet into recovery case database.
     */
    public function importSheetData(string $url, ?int $bankId = null, ?int $productId = null, ?int $importedByUserId = null): array
    {
        $data = $this->fetchCsvRows($url);
        $rows = $data['rows'];

        if (empty($rows)) {
            return ['imported' => 0, 'updated' => 0, 'skipped' => 0, 'errors' => ['Sheet is empty']];
        }

        // Find header row (search first 15 rows for keywords)
        $headerIndex = -1;
        $headers = [];

        foreach (array_slice($rows, 0, 15) as $idx => $row) {
            $normalized = array_map(fn($col) => strtolower(trim((string)$col)), $row);
            $joined = implode(' ', $normalized);

            if (
                str_contains($joined, 'file') ||
                str_contains($joined, 'account') ||
                str_contains($joined, 'customer') ||
                str_contains($joined, 'agent') ||
                str_contains($joined, 'outstanding') ||
                str_contains($joined, 'borrower')
            ) {
                $headerIndex = $idx;
                $headers = $normalized;
                break;
            }
        }

        if ($headerIndex === -1) {
            $headerIndex = 0;
            $headers = array_map(fn($col) => strtolower(trim((string)$col)), $rows[0]);
        }

        // Resolve or create default Bank & Product if not specified
        $bank = $bankId ? Bank::find($bankId) : Bank::firstOrCreate(
            ['code' => 'google_sheet'],
            ['name' => 'Google Sheet Recovery', 'is_active' => true]
        );

        $product = $productId ? Product::find($productId) : Product::firstOrCreate(
            ['bank_id' => $bank->id, 'code' => 'general_recovery'],
            ['name' => 'General Recovery']
        );

        $importedCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;
        $errors = [];

        // Build Agent lookup map for fast association
        $agents = User::role('agent')->get()->keyBy(fn($u) => strtolower(trim($u->name)));

        for ($i = $headerIndex + 1; $i < count($rows); $i++) {
            $row = $rows[$i];
            if (empty(array_filter($row, fn($v) => trim((string)$v) !== ''))) {
                continue;
            }

            // Map row associative
            $mapped = [];
            foreach ($headers as $colIdx => $colName) {
                if (empty($colName)) continue;
                $mapped[$colName] = $row[$colIdx] ?? null;
            }

            // Extract file number / account number
            $fileNo = $this->findValue($mapped, ['file no', 'file_no', 'file number', 'file_number', 'account no', 'account_no', 'acc no', 'client id', 'card no', 'customer id']);
            $customerName = $this->findValue($mapped, ['customer name', 'customer_name', 'borrower name', 'client name', 'name', 'account name']);
            $phone = $this->findValue($mapped, ['phone', 'contact no', 'mobile', 'cell', 'customer phone', 'tel']);
            $presentAddress = $this->findValue($mapped, ['present address', 'address', 'customer address', 'location', 'residence']);
            $permanentAddress = $this->findValue($mapped, ['permanent address', 'home address', 'godown address']);
            $outstanding = $this->parseCurrency($this->findValue($mapped, ['total outstanding', 'outstanding', 'outstanding (৳)', 'balance', 'principal']));
            $overdue = $this->parseCurrency($this->findValue($mapped, ['total overdue', 'overdue', 'overdue (৳)', 'due amount', 'overdue amount']));
            $agentName = $this->findValue($mapped, ['agent name', 'agent', 'assigned agent', 'field agent', 'officer']);

            // Auto-generate file number if missing
            if (empty($fileNo)) {
                if (empty($customerName)) {
                    $skippedCount++;
                    continue;
                }
                $fileNo = 'GS-' . strtoupper(Str::slug(substr($customerName, 0, 12))) . '-' . ($i + 1);
            }

            // Match or create Agent
            $assignedAgentId = null;
            if (!empty($agentName)) {
                $cleanAgentName = strtolower(trim($agentName));
                if (isset($agents[$cleanAgentName])) {
                    $assignedAgentId = $agents[$cleanAgentName]->id;
                } else {
                    $slug = Str::slug($agentName);
                    $newAgent = User::firstOrCreate(
                        ['email' => "agent.{$slug}@recovery.local"],
                        [
                            'name' => trim($agentName),
                            'password' => bcrypt('password123'),
                            'status' => 'active',
                        ]
                    );
                    $newAgent->assignRole('agent');
                    $agents[$cleanAgentName] = $newAgent;
                    $assignedAgentId = $newAgent->id;
                }
            }

            // Upsert case
            $existing = CaseFile::where('file_number', $fileNo)->first();

            $caseData = [
                'bank_id' => $bank->id,
                'product_id' => $product->id,
                'customer_name' => $customerName ?: 'Borrower #' . $fileNo,
                'customer_phone' => $phone,
                'customer_address_present' => $presentAddress,
                'customer_address_permanent' => $permanentAddress,
                'outstanding_amount' => $outstanding,
                'overdue_amount' => $overdue,
                'assigned_agent_id' => $assignedAgentId,
                'extra_attributes' => $mapped,
            ];

            if ($existing) {
                $existing->update($caseData);
                $updatedCount++;
            } else {
                $caseData['file_number'] = $fileNo;
                $caseData['status'] = 'new';
                $caseData['allocation_date'] = now();
                CaseFile::create($caseData);
                $importedCount++;
            }
        }

        return [
            'imported' => $importedCount,
            'updated' => $updatedCount,
            'skipped' => $skippedCount,
            'errors' => $errors,
            'total_processed' => $importedCount + $updatedCount + $skippedCount,
        ];
    }

    /**
     * Push agent remark or payment log to Google Sheet Webhook (Google Apps Script).
     */
    public function pushToGoogleSheetWebhook(string $webhookUrl, array $payload): bool
    {
        try {
            $response = Http::timeout(10)->post($webhookUrl, $payload);
            return $response->successful();
        } catch (\Exception $e) {
            Log::warning("Google Sheet webhook push failed: " . $e->getMessage());
            return false;
        }
    }

    protected function findValue(array $row, array $possibleKeys): ?string
    {
        foreach ($possibleKeys as $key) {
            foreach ($row as $header => $val) {
                if (str_contains($header, $key)) {
                    $trimmed = trim((string)$val);
                    if ($trimmed !== '') return $trimmed;
                }
            }
        }
        return null;
    }

    protected function parseCurrency($val): float
    {
        if (empty($val)) return 0.0;
        $cleaned = preg_replace('/[^0-9.-]/', '', (string)$val);
        return is_numeric($cleaned) ? (float)$cleaned : 0.0;
    }
}