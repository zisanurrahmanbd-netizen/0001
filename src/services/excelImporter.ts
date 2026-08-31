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

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatExcelDate(val: any, headerName?: string): any {
  if (val === null || val === undefined || val === '') return '';

  // If already a JS Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    const d = val.getUTCDate();
    const m = MONTH_NAMES[val.getUTCMonth()];
    const y = val.getUTCFullYear();
    return `${d < 10 ? '0' + d : d}-${m}-${y}`;
  }

  // Check if header is a date-related column
  const isDateColumn = headerName ? /(date|alloc|expir|dob|disburs|time|period)/i.test(headerName) : false;

  // If numeric or numeric string (Excel serial date)
  const num = typeof val === 'number' ? val : (typeof val === 'string' && /^\d+(\.\d+)?$/.test(val.trim()) ? Number(val) : null);
  
  if (num !== null && (isDateColumn || (num >= 25000 && num <= 65000 && Number.isInteger(num)))) {
    try {
      // Excel 1900 leap year bug offset: 25569 = Jan 1, 1970 UTC
      const dateObj = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(dateObj.getTime())) {
        const d = dateObj.getUTCDate();
        const m = MONTH_NAMES[dateObj.getUTCMonth()];
        const y = dateObj.getUTCFullYear();
        return `${d < 10 ? '0' + d : d}-${m}-${y}`;
      }
    } catch (_) {}
  }

  // If ISO string like 2026-07-12T00:00:00.000Z or YYYY-MM-DD
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    const parts = val.split(/[-T]/);
    if (parts.length >= 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (m >= 0 && m < 12) {
        return `${d < 10 ? '0' + d : d}-${MONTH_NAMES[m]}-${y}`;
      }
    }
  }

  return val;
}

function cleanNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).replace(/[^0-9.-]/g, '');
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function findRowValue(row: Record<string, any>, candidateKeys: string[]): any {
  if (!row) return undefined;

  // 1. Direct match (case-sensitive)
  for (const k of candidateKeys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return row[k];
    }
  }

  // 2. Case-insensitive and normalized match (ignoring spaces, underscores, dots, hyphens, slashes)
  const normalizedRowKeys: { origKey: string; normKey: string }[] = Object.keys(row).map(k => ({
    origKey: k,
    normKey: k.toUpperCase().replace(/[^A-Z0-9]/g, '')
  }));

  for (const c of candidateKeys) {
    const normCandidate = c.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const found = normalizedRowKeys.find(item => item.normKey === normCandidate);
    if (found) {
      const val = row[found.origKey];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return val;
      }
    }
  }

  // 3. Substring key matching
  for (const c of candidateKeys) {
    const normCandidate = c.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normCandidate.length < 3) continue;
    const found = normalizedRowKeys.find(item => item.normKey.includes(normCandidate) || (item.normKey.length >= 3 && normCandidate.includes(item.normKey)));
    if (found) {
      const val = row[found.origKey];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return val;
      }
    }
  }

  return undefined;
}

export class ExcelImporter {
  public static async inspectFile(file: File): Promise<{ workbook: XLSX.WorkBook; result: InspectResult }> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

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
    const rawPreviewRows = data.slice(1, 6);

    // Format any serial dates or date objects in the preview rows
    const previewRows = rawPreviewRows.map(row => 
      row.map((cell, colIdx) => formatExcelDate(cell, headers[colIdx]))
    );

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
      // 1. File Number / Case Identifier
      const rawFileNo = findRowValue(row, ['FILE_NO', 'FILE_NUMBER', 'CASE_NO', 'CASE_NUMBER', 'SL', 'SERIAL', 'ID', 'LOAN_ID', 'NT', 'APPLICATION_NO']);
      const fileNumber = rawFileNo ? String(rawFileNo).trim() : `IMP-${Date.now()}-${idx + 1}`;

      // 2. Account Number / Card Number
      const rawAccount = findRowValue(row, ['CARD_NO', 'CARD_NUMBER', 'ACCOUNT_NO', 'ACCOUNT_NUMBER', 'ACC_NO', 'ACCOUNT', 'DEALER_CODE', 'LOAN_ACC', 'LOAN_ACCOUNT', 'A/C', 'A/C_NO', 'CONTRACT_NO', 'AGREEMENT_NO', 'CLIENT_ID']);
      const accountNum = rawAccount ? String(rawAccount).trim() : '';

      // 3. Customer / Borrower Name
      const rawCustomer = findRowValue(row, ['CUSTOMER_NAME', 'CLIENT_NAME', 'BORROWER_NAME', 'PROPRIETOR_NAME', 'NAME', 'CUSTOMER', 'BORROWER', 'CLIENT', 'DEALER_NAME', 'SHOP_NAME', 'ACCOUNT_NAME']);
      const customerName = rawCustomer ? String(rawCustomer).trim() : 'Customer Name';

      // 4. Primary Phone
      const rawPhone = findRowValue(row, ['MOBILE_NO', 'MOBILE', 'PHONE', 'CONTACT_NO', 'CONTACT_NO_1', 'PHONE_NUMBER', 'CELL_NO', 'MOBILE_NUMBER', 'TEL', 'PHONE_RES', 'PRIMARY_PHONE']);
      const phone = rawPhone ? String(rawPhone).trim() : '';

      // 5. Secondary Phone / Office Phone
      const rawSecPhone = findRowValue(row, ['PHONE_OFFICE', 'OFFICE_PHONE', 'CONTACT_NO_2', 'ALT_PHONE', 'SECONDARY_PHONE', 'EMERGENCY_CONTACT', 'OFFICE_MOBILE', 'RES_PHONE']);
      const secPhone = rawSecPhone ? String(rawSecPhone).trim() : '';

      // 6. Present Residence Address
      const rawPresAddr = findRowValue(row, ['PRESENT_ADDRESS', 'SHOP_ADDRESS', 'ADDRESS', 'RESIDENCE_ADDRESS', 'CURRENT_ADDRESS', 'PRESENT_ADDR', 'RESIDENCE', 'LOCATION', 'CLIENT_ADDRESS']);
      const presentAddr = rawPresAddr ? String(rawPresAddr).trim() : '';

      // 7. Permanent Origin Address
      const rawPermAddr = findRowValue(row, ['PERMANENT_ADDRESS', 'WAREHOUSE_ADDRESS', 'PERM_ADDRESS', 'PERMANENT_ADDR', 'ORIGIN_ADDRESS', 'VILLAGE_ADDRESS']);
      const permAddr = rawPermAddr ? String(rawPermAddr).trim() : '';

      // 8. Outstanding Amount (BDT)
      const rawOutstanding = findRowValue(row, ['OUTSTANDING', 'TOTAL_OUTSTANDING', 'OUTSTANDING_AMOUNT', 'TOTAL_OS', 'OS_AMOUNT', 'PRINCIPAL_OUTSTANDING', 'TOTAL_DUE', 'CURRENT_OUTSTANDING', 'NET_OUTSTANDING', 'BALANCE', 'POS', 'TOS']);
      const outstanding = cleanNumber(rawOutstanding);

      // 9. Overdue Amount (BDT)
      const rawOverdue = findRowValue(row, ['OVERDUE', 'OVERDUE_AMOUNT', 'OVERDUE_90_PLUS', 'INTEREST_OVERDUE', 'OD_AMOUNT', 'TOTAL_OVERDUE', 'MINIMUM_DUE', 'MIN_DUE']);
      const overdue = cleanNumber(rawOverdue);

      // 10. Minimum Payment / EMI
      const rawEmi = findRowValue(row, ['EMI', 'EMI_AMOUNT', 'MINIMUM_DUE', 'MIN_DUE', 'MONTHLY_INSTALLMENT', 'INSTALLMENT_AMOUNT']);
      const minPay = cleanNumber(rawEmi);

      // 11. Agent Name
      const rawAgent = findRowValue(row, ['AGENT_NAME', 'AGENT', 'AGENT_ID', 'OFFICER_NAME', 'RECOVERY_AGENT', 'FIELD_EXECUTIVE', 'FO_NAME', 'ASSIGNED_AGENT', 'EXECUTIVE_NAME']);
      const agentName = rawAgent ? String(rawAgent).trim() : '';

      // 12. Allocation Date
      const rawAlloc = findRowValue(row, ['DATE_OF_ALLOCATION', 'ALLOCATION_DATE', 'ALLOC_DATE', 'ASSIGN_DATE', 'START_DATE', 'DATE_ALLOCATED', 'ALLOCATED_ON']);
      const formattedAlloc = rawAlloc ? String(formatExcelDate(rawAlloc, 'DATE_OF_ALLOCATION')) : new Date().toISOString().split('T')[0];

      // 13. Expiry Date
      const rawExpiry = findRowValue(row, ['WORK_ORDER_EXPIRY_DATE', 'EXPIRY_DATE', 'EXPIRY', 'EXPIRE_DATE', 'END_DATE', 'CONTRACT_EXPIRY', 'WO_EXPIRY_DATE', 'VALIDITY_DATE']);
      const formattedExpiry = rawExpiry ? String(formatExcelDate(rawExpiry, 'WORK_ORDER_EXPIRY_DATE')) : new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];

      // 14. Status / Classification
      const rawStatus = findRowValue(row, ['LEGAL_STATUS', 'STATUS', 'CLASSIFICATION', 'BUCKET', 'DPD_STATUS', 'LAP_STATUS']);
      const legalStatus = rawStatus ? String(rawStatus).trim() : 'Normal Recovery';

      // 15. Collect ALL columns into extra_attributes, converting dates & formatting
      const extraAttributes: Record<string, any> = {};
      Object.keys(row).forEach(key => {
        extraAttributes[key] = formatExcelDate(row[key], key);
      });

      return {
        file_number: fileNumber,
        account_number: accountNum,
        customer_name: customerName,
        customer_phone: phone,
        customer_secondary_phone: secPhone,
        customer_address_present: presentAddr,
        customer_address_permanent: permAddr,
        outstanding_amount: outstanding,
        overdue_amount: overdue,
        minimum_payment: minPay,
        agent_name: agentName,
        allocation_date: formattedAlloc,
        expiry_date: formattedExpiry,
        legal_status: legalStatus,
        bank_id: bankId,
        product_id: productId,
        extra_attributes: extraAttributes,
      };
    });
  }
}