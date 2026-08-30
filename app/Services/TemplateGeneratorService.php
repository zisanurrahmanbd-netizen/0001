<?php

namespace App\Services;

use App\Models\Bank;
use App\Models\Product;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TemplateGeneratorService
{
    /**
     * Pre-defined column configurations for all banks and products.
     */
    protected array $standardTemplates = [
        'one_bank_credit_card' => [
            'title' => 'OneBank_CreditCard',
            'bank' => 'One Bank Limited',
            'product' => 'Credit Card Recovery',
            'theme_color' => '16A34A', // Emerald
            'headers' => [
                'CARD NO', 'CLIENT NAME', 'CONTACT NO', 'ALT CONTACT',
                'PRESENT ADDRESS', 'PERMANENT ADDRESS', 'TOTAL OUTSTANDING',
                'MINIMUM DUE', 'BUCKET STATUS', 'LEGAL STATUS', 'AGENT NAME',
                'ALLOCATION DATE', 'EXPIRY DATE', 'CARD TYPE', 'EXPIRY BATCH'
            ],
            'samples' => [
                [
                    '4181-XXXX-XXXX-1001', 'Shahabuddin Ahmed', '01711-223344', '01811-998877',
                    'Flat 4B, House 12, Road 7, Dhanmondi, Dhaka', 'Vill: Puran Bazar, PS: Chandpur Sadar, Dist: Chandpur',
                    '185000.00', '45000.00', 'active', 'None', 'Md. Abdur Rahim',
                    '2026-08-01', '2026-09-30', 'Visa Gold', 'Batch-Aug-2026'
                ],
                [
                    '4181-XXXX-XXXX-1002', 'Nasima Akhter', '01911-334455', '01611-887766',
                    'House 34, Sector 4, Uttara, Dhaka', 'Vill: Ramnagar, Dist: Cumilla',
                    '92000.00', '18000.00', 'visited', 'None', 'Karim Ullah',
                    '2026-08-01', '2026-09-30', 'MasterCard Classic', 'Batch-Aug-2026'
                ]
            ]
        ],
        'one_bank_loan' => [
            'title' => 'OneBank_Loan',
            'bank' => 'One Bank Limited',
            'product' => 'Personal & SME Loan Recovery',
            'theme_color' => '16A34A',
            'headers' => [
                'LOAN A/C NO', 'BORROWER NAME', 'MOBILE NO', 'GUARANTOR MOBILE',
                'PRESENT ADDRESS', 'PERMANENT ADDRESS', 'TOTAL OUTSTANDING',
                'OVERDUE AMOUNT', 'LOAN STATUS', 'LEGAL CASE NO', 'AGENT',
                'ALLOCATION DATE', 'EXPIRY DATE', 'LOAN SCHEME', 'BRANCH NAME'
            ],
            'samples' => [
                [
                    'ONE-PL-2026-0001', 'Rafiqul Islam Chowdhury', '01712-345678', '01812-345678',
                    'Plot 14, Block C, Mirpur 2, Dhaka', 'Vill: Char Fasson, Bhola',
                    '450000.00', '125000.00', 'active', 'None', 'Nasrin Sultana',
                    '2026-07-15', '2026-10-15', 'Personal Auto Loan', 'Principal Branch'
                ]
            ]
        ],
        'dbbl_credit_card' => [
            'title' => 'DBBL_Credit_Card',
            'bank' => 'Dutch-Bangla Bank PLC',
            'product' => 'Credit Card Recovery',
            'theme_color' => '2563EB', // Blue
            'headers' => [
                'CARD NO', 'CUSTOMER NAME', 'PHONE NO', 'ALT PHONE',
                'PRESENT ADDRESS', 'PERMANENT ADDRESS', 'TOTAL OUTSTANDING',
                'MIN DUE', 'STATUS', 'LEGAL STATUS', 'AGENT NAME',
                'ALLOCATION DATE', 'EXPIRY DATE', 'BRANCH CODE'
            ],
            'samples' => [
                [
                    '4628-XXXX-XXXX-9001', 'Jahangir Alam Khan', '01819-445566', '01719-445566',
                    'Road 5, Block B, Halishahar, Chattogram', 'Vill: Mirsarai, Chattogram',
                    '67000.00', '22000.00', 'in_progress', 'None', 'Jahangir Alam',
                    '2026-08-10', '2026-09-10', '012-CTG'
                ]
            ]
        ],
        'dbbl_write_off' => [
            'title' => 'DBBL_Write_Off',
            'bank' => 'Dutch-Bangla Bank PLC',
            'product' => 'Write-Off & Bad Debt Recovery',
            'theme_color' => '2563EB',
            'headers' => [
                'ACCOUNT NO', 'BORROWER NAME', 'CONTACT NO', 'GUARANTOR CONTACT',
                'PRESENT ADDRESS', 'PERMANENT ADDRESS', 'TOTAL OUTSTANDING',
                'OVERDUE AMOUNT', 'STATUS', 'LEGAL CASE NO', 'AGENT NAME',
                'ALLOCATION DATE', 'EXPIRY DATE', 'WRITE OFF YEAR'
            ],
            'samples' => [
                [
                    'DBBL-WO-88001', 'Kamrul Hassan', '01618-998811', '01718-998811',
                    'Shop 15, Badamtoli, Sadarghat, Dhaka', 'Vill: Shariatpur Sadar',
                    '520000.00', '520000.00', 'legal', 'Artha Rin Case #45/2023', 'Sultana Razia',
                    '2026-06-01', '2026-12-31', '2022'
                ]
            ]
        ],
        'dbbl_loan_branch' => [
            'title' => 'DBBL_Loan_Branch',
            'bank' => 'Dutch-Bangla Bank PLC',
            'product' => 'Branch Loan Recovery',
            'theme_color' => '2563EB',
            'headers' => [
                'ACCOUNT NO', 'CUSTOMER NAME', 'PHONE NO', 'NOMINEE PHONE',
                'PRESENT ADDRESS', 'PERMANENT ADDRESS', 'TOTAL OUTSTANDING',
                'OVERDUE AMOUNT', 'STATUS', 'AGENT NAME', 'ALLOCATION DATE', 'EXPIRY DATE', 'BRANCH NAME'
            ],
            'samples' => [
                [
                    'DBBL-BR-110022', 'Moniruzzaman Tuhin', '01713-112233', '01813-112233',
                    'House 8, Road 2, Agrabad, Chattogram', 'Vill: Patiya, Chattogram',
                    '310000.00', '85000.00', 'active', 'Jahangir Alam',
                    '2026-08-01', '2026-09-30', 'Agrabad Branch'
                ]
            ]
        ],
        'dbbl_agent_banking' => [
            'title' => 'DBBL_Agent_Banking',
            'bank' => 'Dutch-Bangla Bank PLC',
            'product' => 'Agent Banking Recovery',
            'theme_color' => '2563EB',
            'headers' => [
                'OUTLET / A/C NO', 'CUSTOMER NAME', 'PHONE NO', 'ALT CONTACT',
                'OUTLET ADDRESS', 'PERMANENT ADDRESS', 'TOTAL OUTSTANDING',
                'OVERDUE AMOUNT', 'STATUS', 'AGENT NAME', 'ALLOCATION DATE', 'EXPIRY DATE', 'OUTLET NAME'
            ],
            'samples' => [
                [
                    'DBBL-AG-554433', 'Golam Kibria', '01914-778899', '01714-778899',
                    'Bazar Road, Sonaimuri, Noakhali', 'Vill: Sonaimuri, Noakhali',
                    '95000.00', '35000.00', 'active', 'Md. Abdur Rahim',
                    '2026-08-01', '2026-10-31', 'Sonaimuri Agent Outlet'
                ]
            ]
        ],
        'asian_paints_dealer' => [
            'title' => 'Asian_Paints_Dealer',
            'bank' => 'Asian Paints Limited',
            'product' => 'Dealer Outstanding Recovery',
            'theme_color' => 'D97706', // Amber
            'headers' => [
                'DEALER CODE', 'DEALER NAME', 'CONTACT PERSON', 'PHONE NUMBER',
                'SHOP ADDRESS', 'GODOWN ADDRESS', 'OUTSTANDING AMOUNT',
                'OVERDUE AMOUNT', 'STATUS', 'LEGAL STATUS', 'ASSIGNED AGENT',
                'ALLOCATION DATE', 'EXPIRY DATE', 'TERRITORY', 'REGION'
            ],
            'samples' => [
                [
                    'AP-DLR-0044', 'M/S Bismillah Hardware & Paint', 'Haji Nurul Islam', '01715-667788',
                    'Shop 12, Paint Market, Nawabpur Road, Dhaka', 'Godown #3, Keraniganj, Dhaka',
                    '850000.00', '320000.00', 'active', 'None', 'Md. Abdur Rahim',
                    '2026-08-01', '2026-11-30', 'Dhaka South', 'Central'
                ]
            ]
        ],
        'universal_recovery' => [
            'title' => 'Universal_Recovery_Sheet',
            'bank' => 'General / Custom Bank',
            'product' => 'Universal Case File Format',
            'theme_color' => '4F46E5', // Indigo
            'headers' => [
                'FILE NO', 'ACCOUNT NO', 'CUSTOMER NAME', 'PHONE', 'ALT PHONE',
                'PRESENT ADDRESS', 'PERMANENT ADDRESS', 'TOTAL OUTSTANDING',
                'TOTAL OVERDUE', 'STATUS', 'LEGAL STATUS', 'AGENT NAME',
                'ALLOCATION DATE', 'EXPIRY DATE', 'NOTES'
            ],
            'samples' => [
                [
                    'FILE-2026-0001', 'ACC-998877', 'Kazi Mahbubur Rahman', '01711-001122', '01811-001122',
                    'Flat 2A, Road 15, Banani, Dhaka', 'Vill: Gopalganj Sadar',
                    '150000.00', '40000.00', 'new', 'None', 'Md. Abdur Rahim',
                    '2026-08-01', '2026-09-30', 'First allocation'
                ]
            ]
        ]
    ];

    /**
     * Get list of all available templates.
     */
    public function getAvailableTemplates(): array
    {
        return $this->standardTemplates;
    }

    /**
     * Generate and stream a single template Excel file.
     */
    public function downloadTemplate(string $templateKey): StreamedResponse
    {
        if ($templateKey === 'master_workbook') {
            return $this->generateMasterWorkbook();
        }

        $tpl = $this->standardTemplates[$templateKey] ?? $this->standardTemplates['universal_recovery'];
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle($tpl['title']);

        $this->styleWorksheet($sheet, $tpl['headers'], $tpl['samples'], $tpl['theme_color']);

        return $this->streamSpreadsheet($spreadsheet, "{$tpl['title']}_Template.xlsx");
    }

    /**
     * Generate Master Workbook containing all bank tabs.
     */
    public function generateMasterWorkbook(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $first = true;

        foreach ($this->standardTemplates as $tpl) {
            $sheet = $first ? $spreadsheet->getActiveSheet() : $spreadsheet->createSheet();
            $first = false;
            $sheet->setTitle(substr($tpl['title'], 0, 31));
            $this->styleWorksheet($sheet, $tpl['headers'], $tpl['samples'], $tpl['theme_color']);
        }

        $spreadsheet->setActiveSheetIndex(0);
        return $this->streamSpreadsheet($spreadsheet, "Master_Bank_Recovery_Workbook_Template.xlsx");
    }

    /**
     * Generate custom on-demand template for new bank / custom columns.
     */
    public function generateCustomTemplate(string $bankName, string $productName, array $headers, array $samples = []): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheetTitle = preg_replace('/[^A-Za-z0-9_]/', '_', "{$bankName}_{$productName}");
        $sheet->setTitle(substr($sheetTitle, 0, 31));

        $this->styleWorksheet($sheet, $headers, $samples, '0D9488'); // Teal theme

        $filename = "{$sheetTitle}_Template.xlsx";
        return $this->streamSpreadsheet($spreadsheet, $filename);
    }

    /**
     * Apply professional formatting, header color, borders, auto-width to worksheet.
     */
    protected function styleWorksheet(Worksheet $sheet, array $headers, array $samples, string $hexColor = '16A34A'): void
    {
        // 1. Write Header Row
        foreach ($headers as $colIdx => $header) {
            $colLetter = Coordinate::stringFromColumnIndex($colIdx + 1);
            $sheet->setCellValue("{$colLetter}1", $header);
        }

        $highestCol = Coordinate::stringFromColumnIndex(count($headers));

        // 2. Style Header Row
        $sheet->getStyle("A1:{$highestCol}1")->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11,
                'name' => 'Calibri',
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $hexColor],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => false,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000'],
                ],
            ],
        ]);

        $sheet->getRowDimension(1)->setRowHeight(28);

        // 3. Write Sample Data Rows
        $rowNum = 2;
        foreach ($samples as $sampleRow) {
            foreach ($sampleRow as $colIdx => $val) {
                $colLetter = Coordinate::stringFromColumnIndex($colIdx + 1);
                $sheet->setCellValue("{$colLetter}{$rowNum}", $val);
            }

            // Light gray styling for sample rows
            $sheet->getStyle("A{$rowNum}:{$highestCol}{$rowNum}")->applyFromArray([
                'font' => [
                    'color' => ['rgb' => '1E293B'],
                    'size' => 10,
                    'name' => 'Calibri',
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'CBD5E1'],
                    ],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ]);

            $sheet->getRowDimension($rowNum)->setRowHeight(22);
            $rowNum++;
        }

        // 4. Auto-fit column widths
        for ($c = 1; $c <= count($headers); $c++) {
            $colLetter = Coordinate::stringFromColumnIndex($c);
            $sheet->getColumnDimension($colLetter)->setAutoSize(true);
        }

        // 5. Freeze top row
        $sheet->freezePane('A2');
    }

    /**
     * Stream spreadsheet download response.
     */
    protected function streamSpreadsheet(Spreadsheet $spreadsheet, string $filename): StreamedResponse
    {
        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0, must-revalidate',
            'Pragma' => 'public',
        ]);
    }
}