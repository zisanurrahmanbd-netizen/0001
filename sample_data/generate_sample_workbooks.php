<?php

require __DIR__ . "/../vendor/autoload.php";

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

$outDir = __DIR__;

function applyHeaderStyle($sheet, $colEnd, $row = 1) {
    $sheet->getStyle("A{$row}:{$colEnd}{$row}")->applyFromArray([
        "font" => ["bold" => true, "color" => ["rgb" => "FFFFFF"]],
        "fill" => [
            "fillType" => Fill::FILL_SOLID,
            "startColor" => ["rgb" => "1E293B"]
        ],
        "alignment" => ["horizontal" => Alignment::HORIZONTAL_CENTER, "vertical" => Alignment::VERTICAL_CENTER],
        "borders" => ["allBorders" => ["borderStyle" => Border::BORDER_THIN, "color" => ["rgb" => "334155"]]]
    ]);
    $sheet->getRowDimension($row)->setRowHeight(25);
}

// 1. One Bank Workbook
$ss1 = new Spreadsheet();

// Sheet 1: OneBank_CreditCard
$s1 = $ss1->getActiveSheet();
$s1->setTitle("OneBank_CreditCard");
$headers1 = ["CARD NO", "ACCOUNT NO", "CLIENT NAME", "CONTACT NO", "ALT CONTACT", "PRESENT ADDRESS", "PERMANENT ADDRESS", "TOTAL OUTSTANDING", "MINIMUM DUE", "STATUS", "LEGAL STATUS", "AVAILABILITY STATUS", "AGENT", "ALLOCATION DATE", "EXPIRY DATE"];
$s1->fromArray([$headers1], null, "A1");

$data1 = [
    ["CC4521000101", "AC990011", "Tanvir Hasan", "01711-889901", "01811-998801", "Dhanmondi 32, Dhaka", "Pabna Sadar", 65000, 18000, "in_progress", null, "Available", "Md. Abdur Rahim", "2024-01-10", "2024-03-31"],
    ["CC4521000102", "AC990012", "Salma Khatun", "01711-889902", "01811-998802", "Uttara Sector 7, Dhaka", "Mymensingh", 45000, 12000, "visited", null, "Available", "Md. Karim Uddin", "2024-01-15", "2024-04-15"],
    ["CC4521000103", "AC990013", "Babul Miah", "01711-889903", null, "Mirpur 10, Dhaka", "Comilla", 110000, 35000, "legal", "Artha Rin Notice Sent", "Shifted", "Nasrin Akter", "2023-11-01", "2024-01-31"],
    ["CC4521000104", "AC990014", "Farhana Yesmin", "01711-889904", "01911-778804", "Mohakhali DOHS, Dhaka", "Sylhet", 32000, 9500, "settled", null, "Available", "Md. Abdur Rahim", "2024-02-01", "2024-04-30"],
    ["CC4521000105", "AC990015", "Kamrul Islam", "01711-889905", null, "Badda Link Road, Dhaka", "Brahmanbaria", 92000, 28000, "broken_promise", null, "At Home", "Md. Karim Uddin", "2024-01-20", "2024-03-20"],
];
$s1->fromArray($data1, null, "A2");
applyHeaderStyle($s1, "O");

// Sheet 2: OneBank_Loan
$s2 = $ss1->createSheet();
$s2->setTitle("OneBank_Loan");
$headers2 = ["LOAN A/C NO", "BORROWER NAME", "MOBILE NO", "GUARANTOR MOBILE", "PRESENT ADDRESS", "PERMANENT ADDRESS", "TOTAL OUTSTANDING", "OVERDUE AMOUNT", "MIN RECOVERY", "STATUS", "LEGAL STATUS", "AVAILABILITY STATUS", "AGENT", "ALLOCATION DATE", "EXPIRY DATE"];
$s2->fromArray([$headers2], null, "A1");

$data2 = [
    ["LN-ONE-2024-01", "Abdul Jalil", "01811-123401", "01911-567801", "Keraniganj, Dhaka", "Munshiganj", 180000, 60000, 30000, "in_progress", null, "Available", "Md. Abdur Rahim", "2024-01-05", "2024-04-05"],
    ["LN-ONE-2024-02", "Rasheda Akter", "01811-123402", null, "Tongi, Gazipur", "Netrokona", 320000, 110000, 50000, "legal", "Suit 45/2023", "Untraceable", "Nasrin Akter", "2023-10-01", "2024-01-15"],
];
$s2->fromArray($data2, null, "A2");
applyHeaderStyle($s2, "O");

foreach ([$s1, $s2] as $sheet) {
    foreach (range("A", "O") as $col) {
        $sheet->getColumnDimension($col)->setAutoSize(true);
    }
}

$writer1 = new Xlsx($ss1);
$writer1->save("$outDir/OneBank_Recovery_Workbook.xlsx");
echo "Created: OneBank_Recovery_Workbook.xlsx\n";


// 2. DBBL Workbook
$ss2 = new Spreadsheet();
$dbblSheet1 = $ss2->getActiveSheet();
$dbblSheet1->setTitle("DBBL_AgentBanking");
$headersDBBL1 = ["OUTLET / A/C NO", "ACCOUNT NO", "CUSTOMER NAME", "PHONE NO", "NOMINEE PHONE", "OUTLET ADDRESS", "PERMANENT ADDRESS", "TOTAL OUTSTANDING", "OVERDUE AMOUNT", "MINIMUM PAYABLE", "STATUS", "LEGAL STATUS", "AVAILABILITY STATUS", "FIELD AGENT", "ALLOCATION DATE", "EXPIRY DATE"];
$dbblSheet1->fromArray([$headersDBBL1], null, "A1");

$dbblData1 = [
    ["DBBL-AB-101", "AB987001", "Hasanur Rashid", "01611-334401", "01711-223301", "Khatunganj, Chittagong", "Anwara, Ctg", 210000, 75000, 35000, "in_progress", null, "Shop Open", "Jahangir Alam", "2024-01-10", "2024-04-10"],
    ["DBBL-AB-102", "AB987002", "Momena Begum", "01611-334402", null, "Pahartali, Chittagong", "Hathazari, Ctg", 85000, 25000, 15000, "visited", null, "Available", "Sultana Begum", "2024-01-25", "2024-04-25"],
    ["DBBL-AB-103", "AB987003", "Zakir Hossain", "01611-334403", "01811-445503", "Chawkbazar, Chittagong", "Patiya, Ctg", 145000, 50000, 20000, "untraceable", null, "Closed / Shifted", "Jahangir Alam", "2023-11-15", "2024-02-15"],
];
$dbblSheet1->fromArray($dbblData1, null, "A2");
applyHeaderStyle($dbblSheet1, "P");

$dbblSheet2 = $ss2->createSheet();
$dbblSheet2->setTitle("DBBL_BranchLoan");
$headersDBBL2 = ["LOAN A/C NO", "CUSTOMER NAME", "CONTACT NO", "GUARANTOR CONTACT", "PRESENT ADDRESS", "PERMANENT ADDRESS", "TOTAL OUTSTANDING", "OVERDUE AMOUNT", "MINIMUM PAYMENT", "STATUS", "LEGAL STATUS", "AVAILABILITY", "ASSIGNED AGENT", "ALLOCATION DATE", "EXPIRY DATE"];
$dbblSheet2->fromArray([$headersDBBL2], null, "A1");

$dbblData2 = [
    ["DBBL-LN-801", "Mizanur Rahman", "01712-990001", "01812-990001", "Nasirabad H/S, Chittagong", "Raozan, Ctg", 450000, 150000, 75000, "disputed", null, "Available", "Sultana Begum", "2023-12-01", "2024-03-01"],
    ["DBBL-LN-802", "Shahida Parvin", "01712-990002", null, "Muradpur, Chittagong", "Fatikchhari, Ctg", 120000, 40000, 20000, "settled", null, "Available", "Jahangir Alam", "2024-01-01", "2024-03-31"],
];
$dbblSheet2->fromArray($dbblData2, null, "A2");
applyHeaderStyle($dbblSheet2, "O");

foreach ([$dbblSheet1, $dbblSheet2] as $sheet) {
    foreach (range("A", "P") as $col) {
        $sheet->getColumnDimension($col)->setAutoSize(true);
    }
}

$writer2 = new Xlsx($ss2);
$writer2->save("$outDir/DBBL_Recovery_Workbook.xlsx");
echo "Created: DBBL_Recovery_Workbook.xlsx\n";


// 3. Asian Paints Dealer Recovery Workbook
$ss3 = new Spreadsheet();
$apSheet = $ss3->getActiveSheet();
$apSheet->setTitle("AsianPaints_Dealer");
$headersAP = ["DEALER CODE", "DEALER NAME", "DEALER PHONE", "OWNER MOBILE", "SHOP ADDRESS", "GODOWN ADDRESS", "OUTSTANDING AMOUNT", "OVERDUE AMOUNT", "COMMITMENT AMOUNT", "STATUS", "LEGAL STATUS", "SHOP STATUS", "TERRITORY OFFICER", "ALLOCATION DATE", "EXPIRY DATE"];
$apSheet->fromArray([$headersAP], null, "A1");

$apData = [
    ["AP-DLR-501", "Al-Madina Color & Paint Mart", "01912-112233", "01712-112233", "Mirpur 1, Dhaka", "Aminbazar, Savar", 380000, 160000, 80000, "in_progress", null, "Shop Open", "Md. Karim Uddin", "2024-01-15", "2024-04-15"],
    ["AP-DLR-502", "Bismillah Hardware & Paint Store", "01912-445566", "01812-445566", "Chasara, Narayanganj", "Fatullah, Narayanganj", 520000, 240000, 100000, "legal", "138 NI Act Case Filed", "Disputed", "Md. Abdur Rahim", "2023-11-01", "2024-02-01"],
    ["AP-DLR-503", "Chowdhury Enterprise", "01912-778899", null, "EPZ Gate, Savar", "Ashulia, Dhaka", 290000, 95000, 50000, "visited", null, "Shop Open", "Nasrin Akter", "2024-02-01", "2024-05-01"],
];
$apSheet->fromArray($apData, null, "A2");
applyHeaderStyle($apSheet, "O");

foreach (range("A", "O") as $col) {
    $apSheet->getColumnDimension($col)->setAutoSize(true);
}

$writer3 = new Xlsx($ss3);
$writer3->save("$outDir/AsianPaints_Dealer_Workbook.xlsx");
echo "Created: AsianPaints_Dealer_Workbook.xlsx\n";

echo "All sample workbooks generated successfully.\n";
