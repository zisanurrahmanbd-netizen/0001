<?php

namespace App\Services;

use App\Models\Bank;
use App\Models\BankContact;
use App\Models\CaseFile;
use App\Models\ImportJob;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ExcelImportService
{
    /**
     * Inspect an Excel file and return metadata for all worksheets.
     */
    public function inspectFile(string $filePath): array
    {
        $spreadsheet = IOFactory::load($filePath);
        $sheetNames = $spreadsheet->getSheetNames();
        $sheetsInfo = [];

        foreach ($sheetNames as $sheetName) {
            $worksheet = $spreadsheet->getSheetByName($sheetName);
            $highestRow = $worksheet->getHighestDataRow();
            $highestColumn = $worksheet->getHighestDataColumn();
            
            // Read header row
            $headerRow = [];
            $columnCount = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);
            for ($col = 1; $col <= min($columnCount, 30); $col++) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col);
                $val = trim((string) $worksheet->getCell($colLetter . '1')->getValue());
                if (!empty($val)) {
                    $headerRow[$colLetter] = $val;
                }
            }

            $matchedConfigKey = $this->detectSheetConfig($sheetName, array_values($headerRow));
            $config = $matchedConfigKey ? config("bank_mappings.sheets.{$matchedConfigKey}") : null;

            $sheetsInfo[] = [
                'sheet_name' => $sheetName,
                'total_rows' => max(0, $highestRow - 1),
                'columns_count' => count($headerRow),
                'sample_headers' => array_values($headerRow),
                'matched_config' => $matchedConfigKey,
                'detected_type' => $config['type'] ?? 'cases',
                'bank_name' => $config['bank_name'] ?? null,
                'product_name' => $config['product_name'] ?? null,
            ];
        }

        return $sheetsInfo;
    }

    /**
     * Import a specific sheet from the Excel file.
     */
    public function importSheet(
        string $filePath,
        ?string $sheetName = null,
        ?int $bankId = null,
        ?int $productId = null,
        ?ImportJob $importJob = null,
        bool $dryRun = false
    ): array {
        $spreadsheet = IOFactory::load($filePath);

        if ($sheetName) {
            $worksheet = $spreadsheet->getSheetByName($sheetName);
            if (!$worksheet) {
                throw new Exception("Sheet '{$sheetName}' not found in the workbook.");
            }
        } else {
            $worksheet = $spreadsheet->getActiveSheet();
            $sheetName = $worksheet->getTitle();
        }

        $headers = $this->getWorksheetHeaders($worksheet);
        $configKey = $this->detectSheetConfig($sheetName, $headers);
        $config = $configKey ? config("bank_mappings.sheets.{$configKey}") : null;
        $sheetType = $config['type'] ?? 'cases';

        if ($importJob) {
            $importJob->update([
                'sheet_name' => $sheetName,
                'status' => 'processing',
                'total_rows' => max(0, $worksheet->getHighestDataRow() - 1),
            ]);
        }

        $result = match ($sheetType) {
            'agent_roster' => $this->importAgentRoster($worksheet, $config, $dryRun, $importJob),
            'bank_contacts' => $this->importBankContacts($worksheet, $config, $dryRun, $importJob),
            default => $this->importCases(
                $worksheet,
                $config,
                $bankId,
                $productId,
                $dryRun,
                $importJob
            ),
        };

        if ($importJob) {
            $importJob->update([
                'status' => $result['failed'] > 0 && $result['imported'] === 0 ? 'failed' : 'completed',
                'imported_rows' => $result['imported'],
                'updated_rows' => $result['updated'],
                'failed_rows' => $result['failed'],
                'error_log' => $result['errors'],
            ]);
        }

        return $result;
    }

    /**
     * Import standard unified recovery cases from sheet.
     */
    protected function importCases(
        Worksheet $worksheet,
        ?array $config,
        ?int $bankId,
        ?int $productId,
        bool $dryRun,
        ?ImportJob $importJob
    ): array {
        $bank = null;
        $product = null;

        if ($bankId) {
            $bank = Bank::find($bankId);
        } elseif (!empty($config['bank_code'])) {
            $bank = Bank::firstOrCreate(
                ['code' => $config['bank_code']],
                ['name' => $config['bank_name'] ?? ucfirst(str_replace('_', ' ', $config['bank_code']))]
            );
        }

        if ($productId) {
            $product = Product::find($productId);
        } elseif ($bank && !empty($config['product_code'])) {
            $product = Product::firstOrCreate(
                ['bank_id' => $bank->id, 'code' => $config['product_code']],
                ['name' => $config['product_name'] ?? ucfirst(str_replace('_', ' ', $config['product_code']))]
            );
        }

        // Fallback default bank and product if none detected
        if (!$bank) {
            $bank = Bank::firstOrCreate(['code' => 'general_bank'], ['name' => 'General / Unspecified Bank']);
        }
        if (!$product) {
            $product = Product::firstOrCreate(['bank_id' => $bank->id, 'code' => 'general_loan'], ['name' => 'General Loan Recovery']);
        }

        if ($importJob) {
            $importJob->update(['bank_id' => $bank->id, 'product_id' => $product->id]);
        }

        $highestRow = $worksheet->getHighestDataRow();
        $highestColumn = $worksheet->getHighestDataColumn();
        $columnCount = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);

        // Build header map
        $headerMap = []; // colIndex => Header Title
        $fieldMap = [];  // colIndex => canonical field name
        $columnAliases = $config['columns'] ?? config('bank_mappings.generic_case_columns');

        for ($col = 1; $col <= $columnCount; $col++) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col);
            $rawHeader = trim((string) $worksheet->getCell($colLetter . '1')->getValue());
            if (empty($rawHeader)) {
                continue;
            }
            $headerMap[$col] = $rawHeader;

            // Find canonical field match
            $matchedField = $this->matchColumnHeader($rawHeader, $columnAliases);
            if ($matchedField) {
                $fieldMap[$col] = $matchedField;
            }
        }

        $stats = [
            'total' => max(0, $highestRow - 1),
            'imported' => 0,
            'updated' => 0,
            'failed' => 0,
            'created_agents' => [],
            'errors' => [],
            'preview_rows' => [],
        ];

        // Cache existing agents & managers to avoid heavy queries in loop
        $userCache = User::all();

        for ($row = 2; $row <= $highestRow; $row++) {
            try {
                $rowData = [];
                $extraAttributes = [];

                for ($col = 1; $col <= $columnCount; $col++) {
                    if (!isset($headerMap[$col])) {
                        continue;
                    }
                    $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col);
                    $cell = $worksheet->getCell($colLetter . $row);
                    $val = $cell->getValue();

                    // Format date cells properly if formatted
                    if (ExcelDate::isDateTime($cell) && is_numeric($val)) {
                        $val = Carbon::instance(ExcelDate::excelToDateTimeObject((float) $val))->format('Y-m-d');
                    }

                    $val = is_string($val) ? trim($val) : $val;

                    if (isset($fieldMap[$col])) {
                        $field = $fieldMap[$col];
                        // If multiple columns map to same field, don't overwrite if non-empty
                        if (!isset($rowData[$field]) || empty($rowData[$field])) {
                            $rowData[$field] = $val;
                        }
                    } else {
                        if ($val !== null && $val !== '') {
                            $extraAttributes[$headerMap[$col]] = $val;
                        }
                    }
                }

                // Check for valid file_number / identifier
                $fileNumber = $rowData['file_number'] ?? $rowData['account_number'] ?? null;
                if (empty($fileNumber)) {
                    // Empty row or missing required identifier, skip
                    continue;
                }

                $fileNumber = (string) $fileNumber;
                $customerName = !empty($rowData['customer_name']) ? (string) $rowData['customer_name'] : 'Unknown Customer';

                // Agent handling: find or auto-create placeholder agent
                $assignedAgentId = null;
                $assignedManagerId = null;

                if (!empty($rowData['assigned_agent'])) {
                    $agentName = (string) $rowData['assigned_agent'];
                    $agentUser = $this->resolveOrProvisionAgent($agentName, $userCache, $stats['created_agents'], $dryRun);
                    if ($agentUser) {
                        $assignedAgentId = $agentUser->id;
                        $assignedManagerId = $agentUser->manager_id;
                    }
                }

                // Clean numbers
                $outstanding = $this->parseNumeric($rowData['outstanding_amount'] ?? 0);
                $overdue = $this->parseNumeric($rowData['overdue_amount'] ?? 0);
                $minimumPayment = isset($rowData['minimum_payment']) ? $this->parseNumeric($rowData['minimum_payment']) : null;

                // Clean dates
                $allocationDate = $this->parseDate($rowData['allocation_date'] ?? null);
                $expiryDate = $this->parseDate($rowData['expiry_date'] ?? null);

                // Prepare attributes for CaseFile
                $caseData = [
                    'file_number' => $fileNumber,
                    'bank_id' => $bank->id,
                    'product_id' => $product->id,
                    'account_number' => !empty($rowData['account_number']) ? (string) $rowData['account_number'] : $fileNumber,
                    'customer_name' => $customerName,
                    'customer_phone' => !empty($rowData['customer_phone']) ? (string) $rowData['customer_phone'] : null,
                    'customer_secondary_phone' => !empty($rowData['customer_secondary_phone']) ? (string) $rowData['customer_secondary_phone'] : null,
                    'customer_address_present' => !empty($rowData['customer_address_present']) ? (string) $rowData['customer_address_present'] : null,
                    'customer_address_permanent' => !empty($rowData['customer_address_permanent']) ? (string) $rowData['customer_address_permanent'] : null,
                    'outstanding_amount' => $outstanding,
                    'overdue_amount' => $overdue,
                    'minimum_payment' => $minimumPayment,
                    'status' => $this->normalizeStatus($rowData['status'] ?? 'new'),
                    'legal_status' => !empty($rowData['legal_status']) ? (string) $rowData['legal_status'] : null,
                    'availability_status' => !empty($rowData['availability_status']) ? (string) $rowData['availability_status'] : null,
                    'assigned_agent_id' => $assignedAgentId,
                    'assigned_manager_id' => $assignedManagerId,
                    'allocation_date' => $allocationDate,
                    'expiry_date' => $expiryDate,
                    'extra_attributes' => !empty($extraAttributes) ? $extraAttributes : null,
                ];

                if ($dryRun) {
                    if (count($stats['preview_rows']) < 10) {
                        $stats['preview_rows'][] = $caseData;
                    }
                    $stats['imported']++;
                    continue;
                }

                // Upsert by file_number
                $existingCase = CaseFile::where('file_number', $fileNumber)->first();

                if ($existingCase) {
                    $existingCase->update($caseData);
                    $stats['updated']++;
                } else {
                    CaseFile::create($caseData);
                    $stats['imported']++;
                }
            } catch (Exception $e) {
                $stats['failed']++;
                $stats['errors'][] = "Row {$row}: " . $e->getMessage();
            }
        }

        return $stats;
    }

    /**
     * Import Agent Roster reference sheet.
     */
    protected function importAgentRoster(
        Worksheet $worksheet,
        ?array $config,
        bool $dryRun,
        ?ImportJob $importJob
    ): array {
        $highestRow = $worksheet->getHighestDataRow();
        $highestColumn = $worksheet->getHighestDataColumn();
        $columnCount = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);

        $columnAliases = $config['columns'] ?? [];
        $fieldMap = [];

        for ($col = 1; $col <= $columnCount; $col++) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col);
            $rawHeader = trim((string) $worksheet->getCell($colLetter . '1')->getValue());
            if (!empty($rawHeader)) {
                $matchedField = $this->matchColumnHeader($rawHeader, $columnAliases);
                if ($matchedField) {
                    $fieldMap[$col] = $matchedField;
                }
            }
        }

        $stats = [
            'total' => max(0, $highestRow - 1),
            'imported' => 0,
            'updated' => 0,
            'failed' => 0,
            'errors' => [],
            'preview_rows' => [],
        ];

        for ($row = 2; $row <= $highestRow; $row++) {
            try {
                $rowData = [];
                for ($col = 1; $col <= $columnCount; $col++) {
                    if (!isset($fieldMap[$col])) {
                        continue;
                    }
                    $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col);
                    $val = trim((string) $worksheet->getCell($colLetter . $row)->getValue());
                    $rowData[$fieldMap[$col]] = $val;
                }

                $name = $rowData['name'] ?? null;
                if (empty($name)) {
                    continue;
                }

                $email = !empty($rowData['email']) ? $rowData['email'] : Str::slug($name, '.') . '@recovery.local';
                $phone = $rowData['phone'] ?? null;
                $empId = $rowData['employee_id'] ?? null;
                $managerName = $rowData['manager_name'] ?? null;
                $status = strtolower($rowData['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active';

                // Look up manager if specified
                $managerId = null;
                if (!empty($managerName)) {
                    $mgr = User::role(['manager', 'admin'])->where('name', 'LIKE', "%{$managerName}%")->first();
                    if (!$mgr && !$dryRun) {
                        // Create manager placeholder
                        $mgrEmail = !empty($rowData['manager_email']) ? $rowData['manager_email'] : Str::slug($managerName, '.') . '@recovery.local';
                        $mgr = User::firstOrCreate(
                            ['email' => $mgrEmail],
                            [
                                'name' => $managerName,
                                'password' => Hash::make('password123'),
                                'status' => 'active',
                            ]
                        );
                        if (!$mgr->hasRole('manager')) {
                            $mgr->assignRole('manager');
                        }
                    }
                    if ($mgr) {
                        $managerId = $mgr->id;
                    }
                }

                $userData = [
                    'name' => $name,
                    'email' => $email,
                    'phone' => $phone,
                    'employee_id' => $empId,
                    'manager_id' => $managerId,
                    'status' => $status,
                ];

                if ($dryRun) {
                    if (count($stats['preview_rows']) < 10) {
                        $stats['preview_rows'][] = $userData;
                    }
                    $stats['imported']++;
                    continue;
                }

                $user = User::where('email', $email)
                    ->orWhere(function ($q) use ($empId) {
                        if ($empId) {
                            $q->where('employee_id', $empId);
                        }
                    })->first();

                if ($user) {
                    $user->update($userData);
                    if (!$user->hasRole(['agent', 'manager', 'admin'])) {
                        $user->assignRole('agent');
                    }
                    $stats['updated']++;
                } else {
                    $userData['password'] = Hash::make('password123');
                    $newUser = User::create($userData);
                    $newUser->assignRole('agent');
                    $stats['imported']++;
                }
            } catch (Exception $e) {
                $stats['failed']++;
                $stats['errors'][] = "Row {$row}: " . $e->getMessage();
            }
        }

        return $stats;
    }

    /**
     * Import Bank Contacts Directory reference sheet.
     */
    protected function importBankContacts(
        Worksheet $worksheet,
        ?array $config,
        bool $dryRun,
        ?ImportJob $importJob
    ): array {
        $highestRow = $worksheet->getHighestDataRow();
        $highestColumn = $worksheet->getHighestDataColumn();
        $columnCount = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);

        $columnAliases = $config['columns'] ?? [];
        $fieldMap = [];

        for ($col = 1; $col <= $columnCount; $col++) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col);
            $rawHeader = trim((string) $worksheet->getCell($colLetter . '1')->getValue());
            if (!empty($rawHeader)) {
                $matchedField = $this->matchColumnHeader($rawHeader, $columnAliases);
                if ($matchedField) {
                    $fieldMap[$col] = $matchedField;
                }
            }
        }

        $stats = [
            'total' => max(0, $highestRow - 1),
            'imported' => 0,
            'updated' => 0,
            'failed' => 0,
            'errors' => [],
            'preview_rows' => [],
        ];

        $currentBank = null;

        for ($row = 2; $row <= $highestRow; $row++) {
            try {
                $rowData = [];
                for ($col = 1; $col <= $columnCount; $col++) {
                    if (!isset($fieldMap[$col])) {
                        continue;
                    }
                    $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col);
                    $val = trim((string) $worksheet->getCell($colLetter . $row)->getValue());
                    $rowData[$fieldMap[$col]] = $val;
                }

                $bankName = $rowData['bank_name'] ?? null;
                $contactName = $rowData['name'] ?? null;

                if (!empty($bankName)) {
                    $code = Str::slug($bankName, '_');
                    $currentBank = Bank::firstOrCreate(['code' => $code], ['name' => $bankName]);
                }

                if (empty($contactName) || !$currentBank) {
                    continue;
                }

                $contactData = [
                    'bank_id' => $currentBank->id,
                    'name' => $contactName,
                    'designation' => $rowData['designation'] ?? null,
                    'department' => $rowData['department'] ?? null,
                    'phone' => $rowData['phone'] ?? null,
                    'email' => $rowData['email'] ?? null,
                    'branch' => $rowData['branch'] ?? null,
                    'notes' => $rowData['notes'] ?? null,
                ];

                if ($dryRun) {
                    if (count($stats['preview_rows']) < 10) {
                        $stats['preview_rows'][] = $contactData;
                    }
                    $stats['imported']++;
                    continue;
                }

                $existing = BankContact::where('bank_id', $currentBank->id)
                    ->where('name', $contactName)
                    ->first();

                if ($existing) {
                    $existing->update($contactData);
                    $stats['updated']++;
                } else {
                    BankContact::create($contactData);
                    $stats['imported']++;
                }
            } catch (Exception $e) {
                $stats['failed']++;
                $stats['errors'][] = "Row {$row}: " . $e->getMessage();
            }
        }

        return $stats;
    }

    /**
     * Resolve existing agent or auto-create a placeholder account.
     */
    protected function resolveOrProvisionAgent(
        string $agentName,
        &$userCache,
        array &$createdAgents,
        bool $dryRun
    ): ?User {
        $cleanName = trim($agentName);
        if (empty($cleanName)) {
            return null;
        }

        // Try exact/fuzzy match in user cache
        $agent = $userCache->first(function ($u) use ($cleanName) {
            return strcasecmp($u->name, $cleanName) === 0
                || strcasecmp($u->employee_id ?? '', $cleanName) === 0
                || stripos($u->name, $cleanName) !== false;
        });

        if ($agent) {
            return $agent;
        }

        if ($dryRun) {
            // Fake user object for dry run
            $fakeUser = new User([
                'name' => $cleanName,
                'email' => Str::slug($cleanName, '.') . '@recovery.local',
                'status' => 'active',
            ]);
            $fakeUser->id = 99999;
            return $fakeUser;
        }

        // Auto-provision placeholder agent
        $slug = Str::slug($cleanName, '.');
        $email = $slug . '@recovery.local';

        // Check if email already taken
        $counter = 1;
        while (User::where('email', $email)->exists()) {
            $email = "{$slug}{$counter}@recovery.local";
            $counter++;
        }

        $newAgent = User::create([
            'name' => $cleanName,
            'email' => $email,
            'password' => Hash::make('password123'),
            'status' => 'active',
        ]);
        $newAgent->assignRole('agent');

        $userCache->push($newAgent);
        $createdAgents[] = ['name' => $cleanName, 'email' => $email];

        return $newAgent;
    }

    /**
     * Detect sheet configuration from name or headers.
     */
    public function detectSheetConfig(string $sheetName, array $headers): ?string
    {
        $sheetConfigs = config('bank_mappings.sheets', []);

        // 1. Direct name regex pattern match
        foreach ($sheetConfigs as $key => $conf) {
            if (!empty($conf['name_patterns'])) {
                foreach ($conf['name_patterns'] as $pattern) {
                    if (preg_match($pattern, $sheetName)) {
                        return $key;
                    }
                }
            }
            if (strcasecmp($conf['sheet_name'] ?? '', $sheetName) === 0) {
                return $key;
            }
        }

        // 2. Header pattern matching
        $normalizedHeaders = array_map(fn($h) => strtolower(trim($h)), $headers);

        foreach ($sheetConfigs as $key => $conf) {
            if (!empty($conf['identifier_columns'])) {
                foreach ($conf['identifier_columns'] as $idCol) {
                    if (in_array(strtolower($idCol), $normalizedHeaders)) {
                        return $key;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Match a column header against configured aliases.
     */
    protected function matchColumnHeader(string $rawHeader, array $columnAliases): ?string
    {
        $normalized = strtolower(trim($rawHeader));

        foreach ($columnAliases as $field => $aliases) {
            foreach ($aliases as $alias) {
                if ($normalized === strtolower(trim($alias))) {
                    return $field;
                }
            }
        }

        return null;
    }

    protected function getWorksheetHeaders(Worksheet $worksheet): array
    {
        $highestColumn = $worksheet->getHighestDataColumn();
        $columnCount = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);
        $headers = [];

        for ($col = 1; $col <= $columnCount; $col++) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col);
            $val = trim((string) $worksheet->getCell($colLetter . '1')->getValue());
            if (!empty($val)) {
                $headers[] = $val;
            }
        }

        return $headers;
    }

    protected function parseNumeric(mixed $value): float
    {
        if (is_numeric($value)) {
            return (float) $value;
        }

        if (is_string($value)) {
            // Remove currency symbols, commas, spaces
            $cleaned = preg_replace('/[^\d\.\-]/', '', $value);
            return is_numeric($cleaned) ? (float) $cleaned : 0.00;
        }

        return 0.00;
    }

    protected function parseDate(mixed $value): ?string
    {
        if (empty($value)) {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value->format('Y-m-d');
        }

        if (is_numeric($value)) {
            try {
                return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $value))->format('Y-m-d');
            } catch (Exception $e) {
                return null;
            }
        }

        if (is_string($value)) {
            try {
                return Carbon::parse($value)->format('Y-m-d');
            } catch (Exception $e) {
                return null;
            }
        }

        return null;
    }

    protected function normalizeStatus(string $rawStatus): string
    {
        $s = strtolower(trim($rawStatus));

        if (str_contains($s, 'settle') || str_contains($s, 'paid') || str_contains($s, 'recovered')) {
            return 'settled';
        }
        if (str_contains($s, 'visit')) {
            return 'visited';
        }
        if (str_contains($s, 'legal') || str_contains($s, 'court') || str_contains($s, 'artha')) {
            return 'legal';
        }
        if (str_contains($s, 'untrace') || str_contains($s, 'skip') || str_contains($s, 'missing')) {
            return 'untraceable';
        }
        if (str_contains($s, 'dispute')) {
            return 'disputed';
        }
        if (str_contains($s, 'broken') || str_contains($s, 'ptp')) {
            return 'broken_promise';
        }
        if (str_contains($s, 'progress') || str_contains($s, 'follow')) {
            return 'in_progress';
        }
        if (str_contains($s, 'close')) {
            return 'closed';
        }

        return 'new';
    }
}
