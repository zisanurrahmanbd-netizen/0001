import * as XLSX from 'xlsx';
import { CaseFile } from '../types';

export interface InspectResult {
  fileName: string;
  sheets: {
    name: string;
    rowCount: number;
    headers: string[];
    detectedBank: string;
    detectedProduct: string;
  }[];
}

export interface PreviewResult {
  headers: string[];
  rows: any[][];
  mappedCount: number;
}

export class ExcelImporter {
  public static async inspectFile(file: File): Promise<{ workbook: XLSX.WorkBook; result: InspectResult }> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const sheets = workbook.SheetNames.map(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const headers: string[] = (data[0] || []).map(h => String(h || '').trim());
      const rowCount = Math.max(0, data.length - 1);

      // Detection heuristic
      let detectedBank = 'One Bank Limited';
      let detectedProduct = 'Credit Card';

      const sLower = sheetName.toLowerCase();
      if (sLower.includes('nexus') || sLower.includes('dbbl')) {
        detectedBank = 'Dutch-Bangla Bank Limited';
        detectedProduct = sLower.includes('agent') ? 'Agent Banking Loan' : 'NEXUS Credit Card';
      } else if (sLower.includes('paint') || sLower.includes('dealer') || sLower.includes('apb')) {
        detectedBank = 'Asian Paints Bangladesh';
        detectedProduct = 'Dealer Recovery';
      } else if (sLower.includes('loan') || sLower.includes('pl')) {
        detectedBank = 'One Bank Limited';
        detectedProduct = 'Personal Loan';
      }

      return {
        name: sheetName,
        rowCount,
        headers,
        detectedBank,
        detectedProduct,
      };
    });

    return {
      workbook,
      result: {
        fileName: file.name,
        sheets,
      }
    };
  }

  public static previewSheet(workbook: XLSX.WorkBook, sheetName: string): PreviewResult {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return { headers: [], rows: [], mappedCount: 0 };

    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const headers = (data[0] || []).map(h => String(h || '').trim());
    const previewRows = data.slice(1, 6);

    return {
      headers,
      rows: previewRows,
      mappedCount: Math.max(0, data.length - 1),
    };
  }

  public static parseSheetToCases(workbook: XLSX.WorkBook, sheetName: string, bankId: number, productId: number): Partial<CaseFile>[] {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];

    const jsonRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);
    
    return jsonRows.map((row, idx) => {
      // Find aliases for file number
      const fileNumber = row['FILE_NO'] || row['FILE_NUMBER'] || row['CASE_NO'] || row['SL'] || `IMP-${Date.now()}-${idx + 1}`;
      const accountNum = row['CARD_NO'] || row['CARD_NUMBER'] || row['ACCOUNT_NO'] || row['ACCOUNT_NUMBER'] || row['DEALER_CODE'] || '';
      const customerName = row['CUSTOMER_NAME'] || row['CLIENT_NAME'] || row['BORROWER_NAME'] || row['PROPRIETOR_NAME'] || row['NAME'] || 'Unknown Customer';
      const phone = row['MOBILE_NO'] || row['CONTACT_NO_1'] || row['PHONE_NUMBER'] || row['PHONE'] || '';
      const secPhone = row['PHONE_OFFICE'] || row['CONTACT_NO_2'] || row['OFFICE_PHONE'] || '';
      const presentAddr = row['PRESENT_ADDRESS'] || row['SHOP_ADDRESS'] || row['ADDRESS'] || '';
      const permAddr = row['PERMANENT_ADDRESS'] || row['WAREHOUSE_ADDRESS'] || '';
      const outstanding = Number(row['TOTAL_OUTSTANDING'] || row['OUTSTANDING_AMOUNT'] || row['TOTAL_OS'] || row['PRINCIPAL_OUTSTANDING'] || row['TOTAL_DUE'] || 0);
      const overdue = Number(row['OVERDUE_AMOUNT'] || row['MINIMUM_DUE'] || row['MIN_DUE'] || row['OVERDUE_90_PLUS'] || row['INTEREST_OVERDUE'] || 0);
      const minPay = Number(row['MINIMUM_DUE'] || row['MIN_DUE'] || row['EMI_AMOUNT'] || 0);

      // Collect all extra columns into extra_attributes
      const extraAttributes: Record<string, any> = {};
      Object.keys(row).forEach(key => {
        if (!['FILE_NO', 'CARD_NO', 'CUSTOMER_NAME', 'MOBILE_NO', 'PRESENT_ADDRESS', 'PERMANENT_ADDRESS', 'TOTAL_OUTSTANDING', 'OVERDUE_AMOUNT'].includes(key)) {
          extraAttributes[key] = row[key];
        }
      });

      return {
        file_number: String(fileNumber),
        account_number: String(accountNum),
        customer_name: String(customerName),
        customer_phone: String(phone),
        customer_secondary_phone: String(secPhone),
        customer_address_present: String(presentAddr),
        customer_address_permanent: String(permAddr),
        outstanding_amount: outstanding,
        overdue_amount: overdue,
        minimum_payment: minPay,
        bank_id: bankId,
        product_id: productId,
        extra_attributes: extraAttributes,
      };
    });
  }
}