import { supabase } from '../lib/supabase';
import { Bank, Product, CaseFile, CheckIn, Collection, CaseRemark, BankContact, User } from '../types';
import { PREBUILT_TEMPLATES } from './templateService';
import { loadGSheetSettings, pushUpdateToSheet } from './googleSheetsSync';

export const INITIAL_BANKS: Bank[] = [
  { id: 1, name: 'One Bank Limited', code: 'ONE', is_active: true },
  { id: 2, name: 'Dutch-Bangla Bank Limited', code: 'DBBL', is_active: true },
  { id: 3, name: 'Asian Paints Bangladesh', code: 'APB', is_active: true },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 1, bank_id: 1, name: 'Credit Card', code: 'ONE-CC', commission_rate: 15.0 },
  { id: 2, bank_id: 1, name: 'Personal Loan', code: 'ONE-PL', commission_rate: 10.0 },
  { id: 3, bank_id: 2, name: 'NEXUS Credit Card', code: 'DBBL-CC', commission_rate: 12.0 },
  { id: 4, bank_id: 2, name: 'Agent Banking Loan', code: 'DBBL-ABL', commission_rate: 8.0 },
  { id: 5, bank_id: 3, name: 'Dealer Recovery', code: 'APB-DR', commission_rate: 5.0 },
];

export function getAllSystemBanks(): Bank[] {
  const list = [...INITIAL_BANKS];
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('recoverypro_custom_templates') : null;
    const hidden = (() => {
      try {
        const h = typeof localStorage !== 'undefined' ? localStorage.getItem('recoverypro_hidden_prebuilts') : null;
        return h ? new Set<string>(JSON.parse(h)) : new Set<string>();
      } catch (_) { return new Set<string>(); }
    })();

    const allTpls: Record<string, any> = { ...PREBUILT_TEMPLATES };
    if (saved) {
      try {
        Object.assign(allTpls, JSON.parse(saved));
      } catch (_) {}
    }

    // Remove hidden prebuilts
    hidden.forEach((k: string) => delete allTpls[k]);

    Object.values(allTpls).forEach((t: any) => {
      if (!t?.bankName || typeof t.bankName !== 'string') return;
      const bName = t.bankName.trim();
      if (!bName) return;
      const exists = list.some(b => b.name.toLowerCase() === bName.toLowerCase());
      if (!exists) {
        let hash = 0;
        for (let i = 0; i < bName.length; i++) hash = ((hash << 5) - hash) + bName.charCodeAt(i);
        const newId = Math.abs(hash % 100000) + 100;
        const code = bName.split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().substring(0, 6) || 'BANK';
        list.push({
          id: newId,
          name: bName,
          code: code,
          is_active: true
        });
      }
    });
  } catch (_) {}
  return list;
}

export function getAllSystemProducts(): Product[] {
  const banks = getAllSystemBanks();
  const list = [...INITIAL_PRODUCTS];
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('recoverypro_custom_templates') : null;
    const hidden = (() => {
      try {
        const h = typeof localStorage !== 'undefined' ? localStorage.getItem('recoverypro_hidden_prebuilts') : null;
        return h ? new Set<string>(JSON.parse(h)) : new Set<string>();
      } catch (_) { return new Set<string>(); }
    })();

    const allTpls: Record<string, any> = { ...PREBUILT_TEMPLATES };
    if (saved) {
      try {
        Object.assign(allTpls, JSON.parse(saved));
      } catch (_) {}
    }

    // Remove hidden prebuilts
    hidden.forEach((k: string) => delete allTpls[k]);

    Object.values(allTpls).forEach((t: any) => {
      if (!t?.bankName || !t?.productName) return;
      const bName = String(t.bankName).trim();
      const pName = String(t.productName).trim();
      if (!bName || !pName) return;
      const bank = banks.find(b => b.name.toLowerCase() === bName.toLowerCase());
      if (!bank) return;
      const exists = list.some(p => p.bank_id === bank.id && p.name.toLowerCase() === pName.toLowerCase());
      if (!exists) {
        let hash = 0;
        const combined = `${bank.name}_${pName}`;
        for (let i = 0; i < combined.length; i++) hash = ((hash << 5) - hash) + combined.charCodeAt(i);
        const newProdId = Math.abs(hash % 100000) + 100;
        list.push({
          id: newProdId,
          bank_id: bank.id,
          name: pName,
          code: `${bank.code}-${pName.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase()}`,
          commission_rate: 10.0
        });
      }
    });
  } catch (_) {}
  return list;
}

// Clean Production Initial State (All Sample Mock Data Deleted Permanently)
export const INITIAL_CONTACTS: BankContact[] = [];
export const INITIAL_CASES: CaseFile[] = [];
export const INITIAL_REMARKS: CaseRemark[] = [];
export const INITIAL_CHECKINS: CheckIn[] = [];
export const INITIAL_COLLECTIONS: Collection[] = [];

export interface PtpAlertItem {
  caseItem: CaseFile;
  remark: CaseRemark;
  promisedAmount: number;
  promiseDate: string;
  isOverdue: boolean;
  daysDiff: number;
}

function cleanNum(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).replace(/[^0-9.-]/g, '');
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function findAttr(attrs: Record<string, any> | undefined, keys: string[]): any {
  if (!attrs) return undefined;
  for (const k of keys) {
    if (attrs[k] !== undefined && attrs[k] !== null && String(attrs[k]).trim() !== '') {
      return attrs[k];
    }
  }
  const normMap: Record<string, any> = {};
  Object.keys(attrs).forEach(k => {
    normMap[k.toUpperCase().replace(/[^A-Z0-9]/g, '')] = attrs[k];
  });
  for (const k of keys) {
    const norm = k.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normMap[norm] !== undefined && normMap[norm] !== null && String(normMap[norm]).trim() !== '') {
      return normMap[norm];
    }
  }
  return undefined;
}

export function enrichCase(c: CaseFile): CaseFile {
  const attrs = c.extra_attributes || {};

  // 1. Outstanding Amount
  let outstanding = c.outstanding_amount || 0;
  if (outstanding === 0) {
    const rawOut = findAttr(attrs, ['OUTSTANDING', 'TOTAL_OUTSTANDING', 'OUTSTANDING_AMOUNT', 'TOTAL_OS', 'OS_AMOUNT', 'BALANCE', 'POS', 'PRINCIPAL_OUTSTANDING']);
    if (rawOut) outstanding = cleanNum(rawOut);
  }

  // 2. Overdue Amount
  let overdue = c.overdue_amount || 0;
  if (overdue === 0) {
    const rawOd = findAttr(attrs, ['OVERDUE', 'OVERDUE_AMOUNT', 'OVERDUE_90_PLUS', 'INTEREST_OVERDUE', 'MINIMUM_DUE', 'MIN_DUE']);
    if (rawOd) overdue = cleanNum(rawOd);
  }

  // 3. EMI / Minimum Payment
  let emi = c.minimum_payment || 0;
  if (!emi) {
    const rawEmi = findAttr(attrs, ['EMI', 'EMI_AMOUNT', 'MINIMUM_DUE', 'MIN_DUE', 'MONTHLY_INSTALLMENT']);
    if (rawEmi) emi = cleanNum(rawEmi);
  }

  // 4. Account / Loan Number
  let accountNo = c.account_number || '';
  if (!accountNo) {
    const rawAcc = findAttr(attrs, ['LOAN_ACCOUNT', 'LOAN_ACC', 'ACCOUNT_NO', 'ACCOUNT_NUMBER', 'CARD_NO', 'CARD_NUMBER', 'ACC_NO', 'DEALER_CODE', 'A/C', 'A/C_NO', 'CONTRACT_NO']);
    if (rawAcc) accountNo = String(rawAcc);
  }

  // 5. Allocation Date
  let allocDate = c.allocation_date;
  const rawAlloc = findAttr(attrs, ['DATE_OF_ALLOCATION', 'ALLOCATION_DATE', 'ALLOC_DATE', 'DATE_ALLOCATED']);
  if (rawAlloc) allocDate = String(rawAlloc);

  // 6. Expiry Date
  let expDate = c.expiry_date;
  const rawExp = findAttr(attrs, ['WORK_ORDER_EXPIRY_DATE', 'EXPIRY_DATE', 'EXPIRY', 'EXPIRE_DATE']);
  if (rawExp) expDate = String(rawExp);

  // 7. Bank Classification Status (e.g. DF, BL, SS, SMA, STD)
  let bankStatus = c.legal_status;
  const rawStat = findAttr(attrs, ['STATUS', 'LOAN_STATUS', 'CLASSIFICATION', 'BUCKET', 'DPD_STATUS', 'LAP_STATUS']);
  if (rawStat) {
    bankStatus = String(rawStat);
  }

  // 8. Collector / Bank Officer Name
  let collectorName = c.collector_name || '';
  if (!collectorName) {
    const rawColl = findAttr(attrs, ['COLLECTOR_NAME', 'COLLECTOR', 'BANK_COLLECTOR', 'BANK_OFFICER', 'OFFICER_NAME', 'CONTACT_PERSON', 'RELATIONSHIP_OFFICER', 'RO_NAME', 'BANK_MANAGER', 'PORTFOLIO_OFFICER', 'COORDINATOR', 'RM_NAME']);
    if (rawColl) collectorName = String(rawColl).trim();
  }

  return {
    ...c,
    outstanding_amount: outstanding,
    overdue_amount: overdue,
    minimum_payment: emi,
    account_number: accountNo,
    collector_name: collectorName,
    allocation_date: allocDate,
    expiry_date: expDate,
    legal_status: bankStatus,
    bank: getAllSystemBanks().find(b => b.id === c.bank_id) || INITIAL_BANKS.find(b => b.id === c.bank_id),
    product: getAllSystemProducts().find(p => p.id === c.product_id) || INITIAL_PRODUCTS.find(p => p.id === c.product_id),
  };
}

function mapCaseToDb(c: CaseFile): any {
  return {
    id: c.id,
    file_number: c.file_number,
    bank_id: c.bank_id,
    product_id: c.product_id,
    account_number: c.account_number || '',
    customer_name: c.customer_name,
    customer_phone: c.customer_phone || '',
    customer_secondary_phone: c.customer_secondary_phone || '',
    customer_address_present: c.customer_address_present || '',
    customer_address_permanent: c.customer_address_permanent || '',
    present_address_visited: Boolean(c.present_address_visited),
    permanent_address_visited: Boolean(c.permanent_address_visited),
    outstanding_amount: Number(c.outstanding_amount) || 0,
    overdue_amount: Number(c.overdue_amount) || 0,
    minimum_payment: c.minimum_payment ? Number(c.minimum_payment) : null,
    status: c.status || 'new',
    legal_status: c.legal_status || 'Normal Recovery',
    availability_status: c.availability_status || null,
    collector_name: c.collector_name || '',
    assigned_agent_id: c.assigned_agent_id ? Number(c.assigned_agent_id) : null,
    agent_name: c.agent_name || '',
    assigned_manager_id: c.assigned_manager_id ? Number(c.assigned_manager_id) : null,
    allocation_date: c.allocation_date || null,
    expiry_date: c.expiry_date || null,
    last_visit_at: c.last_visit_at || null,
    total_collected_amount: Number(c.total_collected_amount) || 0,
    extra_attributes: c.extra_attributes || {},
    created_at: c.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mapCaseFromDb(row: any): CaseFile {
  return enrichCase({
    id: Number(row.id),
    file_number: String(row.file_number || row.case_no || `FILE-${row.id}`),
    bank_id: Number(row.bank_id || 1),
    product_id: Number(row.product_id || 1),
    account_number: row.account_number || '',
    customer_name: row.customer_name || row.name || 'Customer',
    customer_phone: row.customer_phone || row.phone || '',
    customer_secondary_phone: row.customer_secondary_phone || '',
    customer_address_present: row.customer_address_present || row.present_address || '',
    customer_address_permanent: row.customer_address_permanent || row.permanent_address || '',
    present_address_visited: Boolean(row.present_address_visited),
    permanent_address_visited: Boolean(row.permanent_address_visited),
    outstanding_amount: Number(row.outstanding_amount) || 0,
    overdue_amount: Number(row.overdue_amount) || 0,
    minimum_payment: row.minimum_payment ? Number(row.minimum_payment) : undefined,
    status: row.status || 'new',
    legal_status: row.legal_status || 'Normal Recovery',
    availability_status: row.availability_status || undefined,
    assigned_agent_id: row.assigned_agent_id ? Number(row.assigned_agent_id) : undefined,
    agent_name: row.agent_name || '',
    collector_name: row.collector_name || '',
    assigned_manager_id: row.assigned_manager_id ? Number(row.assigned_manager_id) : undefined,
    allocation_date: row.allocation_date || undefined,
    expiry_date: row.expiry_date || undefined,
    last_visit_at: row.last_visit_at || undefined,
    total_collected_amount: Number(row.total_collected_amount) || 0,
    extra_attributes: typeof row.extra_attributes === 'object' && row.extra_attributes !== null ? row.extra_attributes : {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
}

class DataService {
  private cases: CaseFile[] = [];
  private remarks: CaseRemark[] = [];
  private checkIns: CheckIn[] = [];
  private collections: Collection[] = [];
  private contacts: BankContact[] = [];
  private listeners: Set<() => void> = new Set();
  private syncTimer: any = null;

  constructor() {
    this.loadState();
    // Initial sync with cloud
    this.syncWithCloud();
    // Auto-sync every 15 seconds across all logged-in devices
    if (typeof window !== 'undefined') {
      this.syncTimer = setInterval(() => {
        this.syncWithCloud();
      }, 15_000);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifySubscribers() {
    this.listeners.forEach(fn => {
      try { fn(); } catch (_) {}
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recovery_data_synced'));
    }
  }

  private loadState() {
    // Purge any legacy sample/demo mock data from previous browser caches
    const dataVersion = localStorage.getItem('recovery_clean_data_version');
    if (dataVersion !== '4.0_purged_eternal') {
      localStorage.removeItem('recovery_cases');
      localStorage.removeItem('recovery_remarks');
      localStorage.removeItem('recovery_checkins');
      localStorage.removeItem('recovery_collections');
      localStorage.removeItem('recovery_contacts');
      localStorage.setItem('recovery_clean_data_version', '4.0_purged_eternal');
    }

    const savedCases = localStorage.getItem('recovery_cases');
    this.cases = savedCases ? JSON.parse(savedCases) : [];

    const savedRemarks = localStorage.getItem('recovery_remarks');
    this.remarks = savedRemarks ? JSON.parse(savedRemarks) : [];

    const savedCheckIns = localStorage.getItem('recovery_checkins');
    this.checkIns = savedCheckIns ? JSON.parse(savedCheckIns) : [];

    const savedCollections = localStorage.getItem('recovery_collections');
    this.collections = savedCollections ? JSON.parse(savedCollections) : [];

    const savedContacts = localStorage.getItem('recovery_contacts');
    this.contacts = savedContacts ? JSON.parse(savedContacts) : [];
  }

  private saveState() {
    localStorage.setItem('recovery_cases', JSON.stringify(this.cases));
    localStorage.setItem('recovery_remarks', JSON.stringify(this.remarks));
    localStorage.setItem('recovery_checkins', JSON.stringify(this.checkIns));
    localStorage.setItem('recovery_collections', JSON.stringify(this.collections));
    localStorage.setItem('recovery_contacts', JSON.stringify(this.contacts));
  }

  // ── Two-Way Cloud Synchronization with Supabase ───────────────────────────
  public async syncWithCloud(forcePush = false): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      if (forcePush && this.cases.length > 0) {
        const pushRes = await this.pushCasesToCloud(this.cases);
        if (pushRes.error) {
          return { success: false, count: this.cases.length, error: `Push error: ${pushRes.error}` };
        }
      }

      // 1. Sync Cases from Supabase
      const { data: cloudCases, error: casesErr } = await supabase.from('cases').select('*');
      if (casesErr) {
        console.warn('Supabase fetch cases note:', casesErr);
        if (this.cases.length > 0) {
          const pushRes = await this.pushCasesToCloud(this.cases);
          if (pushRes.error) {
            return { success: false, count: this.cases.length, error: `Fetch: ${casesErr.message}, Push: ${pushRes.error}` };
          }
        }
        return { success: false, count: this.cases.length, error: casesErr.message };
      }

      if (Array.isArray(cloudCases)) {
        if (cloudCases.length > 0) {
          const map = new Map<string, CaseFile>();
          // Cloud records
          cloudCases.forEach(row => {
            const parsed = mapCaseFromDb(row);
            map.set(parsed.file_number, parsed);
          });
          // Merge local cases that might not have pushed yet
          this.cases.forEach(localC => {
            if (!map.has(localC.file_number)) {
              map.set(localC.file_number, localC);
            }
          });
          const merged = Array.from(map.values());
          if (merged.length !== this.cases.length || JSON.stringify(merged) !== JSON.stringify(this.cases)) {
            this.cases = merged;
            this.saveState();
            this.notifySubscribers();
          }

          // Also push any local cases that were not in cloud
          const unpushed = this.cases.filter(c => !cloudCases.some(cc => cc.file_number === c.file_number));
          if (unpushed.length > 0) {
            await this.pushCasesToCloud(unpushed);
          }
        } else if (this.cases.length > 0) {
          // If cloud is empty but local has cases (e.g. newly uploaded device), push to cloud
          const pushRes = await this.pushCasesToCloud(this.cases);
          if (pushRes.error) {
            return { success: false, count: this.cases.length, error: `Cloud push error: ${pushRes.error}` };
          }
        }
      }

      // 2. Sync Remarks from Supabase
      const { data: cloudRemarks, error: remErr } = await supabase.from('case_remarks').select('*');
      if (!remErr && Array.isArray(cloudRemarks) && cloudRemarks.length > 0) {
        this.remarks = cloudRemarks.map((r: any) => ({
          id: Number(r.id),
          case_file_id: Number(r.case_file_id || r.case_id),
          user_id: Number(r.user_id),
          contact_status: r.contact_status || 'contacted',
          promised_amount: r.promised_amount ? Number(r.promised_amount) : undefined,
          promise_date: r.promise_date || undefined,
          remarks: r.remarks || '',
          created_at: r.created_at || new Date().toISOString()
        }));
        this.saveState();
      }

      // 3. Sync CheckIns from Supabase
      const { data: cloudCheckins, error: ciErr } = await supabase.from('check_ins').select('*');
      if (!ciErr && Array.isArray(cloudCheckins) && cloudCheckins.length > 0) {
        this.checkIns = cloudCheckins.map((ci: any) => ({
          id: Number(ci.id),
          case_file_id: Number(ci.case_file_id || ci.case_id),
          agent_id: Number(ci.agent_id),
          address_type: ci.address_type || 'present',
          latitude: Number(ci.latitude),
          longitude: Number(ci.longitude),
          accuracy: ci.accuracy ? Number(ci.accuracy) : undefined,
          notes: ci.notes || '',
          visited_at: ci.visited_at || new Date().toISOString()
        }));
        this.saveState();
      }

      // 4. Sync Collections from Supabase
      const { data: cloudCols, error: colErr } = await supabase.from('collections').select('*');
      if (!colErr && Array.isArray(cloudCols) && cloudCols.length > 0) {
        this.collections = cloudCols.map((col: any) => ({
          id: Number(col.id),
          case_file_id: Number(col.case_file_id || col.case_id),
          agent_id: Number(col.agent_id),
          amount: Number(col.amount),
          payment_method: col.payment_method || 'cash',
          receipt_number: col.receipt_number || '',
          collected_at: col.collected_at || new Date().toISOString()
        }));
        this.saveState();
      }

      // 5. Sync Contacts from Supabase
      const { data: cloudContacts, error: conErr } = await supabase.from('bank_contacts').select('*');
      if (!conErr && Array.isArray(cloudContacts) && cloudContacts.length > 0) {
        this.contacts = cloudContacts.map((c: any) => ({
          id: Number(c.id),
          bank_id: Number(c.bank_id),
          name: c.name || '',
          designation: c.designation || '',
          department: c.department || '',
          phone: c.phone || '',
          email: c.email || '',
          branch: c.branch || '',
          notes: c.notes || '',
          created_at: c.created_at || new Date().toISOString()
        }));
        this.saveState();
      }

      // 6. Sync Templates from Supabase → localStorage (cloud is source of truth)
      try {
        const { data: cloudTemplates, error: tplErr } = await supabase.from('file_templates').select('*');
        if (!tplErr && Array.isArray(cloudTemplates)) {
          const remoteCustom: Record<string, any> = {};
          let remoteHiddenPrebuilts: string[] = [];

          cloudTemplates.forEach((t: any) => {
            try {
              if (t.template_key === '__hidden_prebuilts__') {
                // Special entry: list of built-in template keys hidden by user
                const val = typeof t.definition === 'string' ? JSON.parse(t.definition) : t.definition;
                remoteHiddenPrebuilts = Array.isArray(val) ? val : (val?.keys || []);
              } else {
                const def = typeof t.definition === 'string' ? JSON.parse(t.definition) : t.definition;
                remoteCustom[t.template_key] = def;
              }
            } catch (_) {}
          });

          // REPLACE local custom templates with cloud (cloud is source of truth — deletions propagate)
          if (Object.keys(remoteCustom).length > 0) {
            localStorage.setItem('recoverypro_custom_templates', JSON.stringify(remoteCustom));
          } else {
            localStorage.removeItem('recoverypro_custom_templates');
          }

          // Sync hidden prebuilts (built-in deletions) across devices
          if (remoteHiddenPrebuilts.length > 0) {
            localStorage.setItem('recoverypro_hidden_prebuilts', JSON.stringify(remoteHiddenPrebuilts));
          } else {
            localStorage.removeItem('recoverypro_hidden_prebuilts');
          }

          this.notifySubscribers(); // Trigger ExcelImporter to reload
        }
      } catch (_) {}


      return { success: true, count: this.cases.length };
    } catch (err: any) {
      console.warn('Cloud sync error:', err);
      return { success: false, count: this.cases.length, error: err?.message || String(err) };
    }
  }

  // Push a single custom template (or all) to Supabase file_templates table
  public async pushTemplateToCloud(templateKey: string, templateDef: any): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.from('file_templates').upsert(
        { template_key: templateKey, definition: templateDef, updated_at: new Date().toISOString() },
        { onConflict: 'template_key' }
      );
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err?.message || String(err) };
    }
  }

  // Push ALL custom templates currently saved in localStorage to Supabase
  public async pushAllTemplatesToCloud(): Promise<{ count: number; error?: string }> {
    try {
      const saved = localStorage.getItem('recoverypro_custom_templates');
      if (!saved) return { count: 0 };
      const customTemplates: Record<string, any> = JSON.parse(saved);
      const rows = Object.entries(customTemplates).map(([key, def]) => ({
        template_key: key,
        definition: def,
        updated_at: new Date().toISOString()
      }));
      if (rows.length === 0) return { count: 0 };
      const { error } = await supabase.from('file_templates').upsert(rows, { onConflict: 'template_key' });
      if (error) return { count: 0, error: error.message };
      return { count: rows.length };
    } catch (err: any) {
      return { count: 0, error: err?.message || String(err) };
    }
  }

  public async pushCasesToCloud(caseList: CaseFile[]): Promise<{ count: number; error?: string }> {
    if (!caseList || caseList.length === 0) return { count: 0 };
    try {
      // 1. Fetch existing case ids mapped by file_number to preserve exact id keys
      let existingMap = new Map<string, number>();
      try {
        const { data: existingRows } = await supabase.from('cases').select('id, file_number');
        if (Array.isArray(existingRows)) {
          existingRows.forEach((r: any) => {
            if (r.file_number && r.id) existingMap.set(String(r.file_number).trim(), Number(r.id));
          });
        }
      } catch (_) {}

      // Assign persistent IDs so cases_pkey never conflicts
      const dbRows = caseList.map((c, idx) => {
        const existingId = existingMap.get(String(c.file_number).trim());
        const finalId = existingId || c.id || (Date.now() + idx);
        c.id = finalId;
        return mapCaseToDb(c);
      });

      for (let i = 0; i < dbRows.length; i += 25) {
        const chunk = dbRows.slice(i, i + 25);
        const { error } = await supabase.from('cases').upsert(chunk, { onConflict: 'id' });
        if (error) {
          console.error('Error upserting chunk on id:', error);
          // Fallback to file_number
          const { error: err2 } = await supabase.from('cases').upsert(chunk, { onConflict: 'file_number' });
          if (err2) {
            return { count: 0, error: error.message || (error as any).details || JSON.stringify(error) };
          }
        }
      }
      this.saveState();
      return { count: caseList.length };
    } catch (err: any) {
      console.error('Pushing cases to cloud exception:', err);
      return { count: 0, error: err?.message || String(err) };
    }
  }

  public getBanks(): Bank[] {
    return getAllSystemBanks();
  }

  public getProducts(): Product[] {
    return getAllSystemProducts();
  }

  public getContacts(user?: User): BankContact[] {
    const banks = getAllSystemBanks();
    const all = this.contacts.map(c => ({
      ...c,
      bank: banks.find(b => b.id === c.bank_id) || INITIAL_BANKS.find(b => b.id === c.bank_id)
    }));

    if (user && user.role === 'agent') {
      const userCases = this.getCases(user);
      const userCollectors = new Set(
        userCases.map(c => (c.collector_name || '').toLowerCase().trim()).filter(Boolean)
      );
      const userBankIds = new Set(userCases.map(c => c.bank_id));

      return all.filter(contact => {
        // If contact name matches a collector assigned on this agent's cases
        if (contact.name && userCollectors.has(contact.name.toLowerCase().trim())) {
          return true;
        }
        // If no collector names are specified, show contacts from assigned banks
        if (userCollectors.size === 0 && userBankIds.has(contact.bank_id)) {
          return true;
        }
        return false;
      });
    }

    return all;
  }

  public getMissingCollectorContacts(): { collectorName: string; bankId: number; bankName: string; caseCount: number }[] {
    const contacts = this.getContacts();
    const contactNames = new Set(contacts.map(c => c.name.toLowerCase().trim()));

    const map = new Map<string, { collectorName: string; bankId: number; bankName: string; caseCount: number }>();
    
    this.cases.forEach(c => {
      const enriched = enrichCase(c);
      const collector = enriched.collector_name?.trim();
      if (collector && collector.length > 1 && collector.toLowerCase() !== 'unassigned' && collector.toLowerCase() !== 'n/a') {
        if (!contactNames.has(collector.toLowerCase())) {
          const key = `${collector.toLowerCase()}___${enriched.bank_id}`;
          const bankName = enriched.bank?.name || 'Bank';
          const existing = map.get(key);
          if (existing) {
            existing.caseCount += 1;
          } else {
            map.set(key, {
              collectorName: collector,
              bankId: enriched.bank_id,
              bankName,
              caseCount: 1,
            });
          }
        }
      }
    });

    return Array.from(map.values());
  }

  public addContact(contact: Omit<BankContact, 'id'>): BankContact {
    const newContact: BankContact = {
      ...contact,
      id: Date.now()
    };
    this.contacts.unshift(newContact);
    this.saveState();
    this.notifySubscribers();
    try {
      supabase.from('bank_contacts').insert([newContact]).then(() => {});
    } catch (_) {}
    return newContact;
  }

  public updateContact(id: number, contact: Partial<BankContact>) {
    const existing = this.contacts.find(c => c.id === id);
    if (existing) {
      Object.assign(existing, contact);
      this.saveState();
      this.notifySubscribers();
      try {
        supabase.from('bank_contacts').update(contact).eq('id', id).then(() => {});
      } catch (_) {}
    }
  }

  public deleteContact(id: number) {
    this.contacts = this.contacts.filter(c => c.id !== id);
    this.saveState();
    this.notifySubscribers();
    try {
      supabase.from('bank_contacts').delete().eq('id', id).then(() => {});
    } catch (_) {}
  }

  public getCases(user: User): CaseFile[] {
    let list = [...this.cases];
    if (user.role === 'manager') {
      list = list.filter(c => c.assigned_manager_id === user.id);
    } else if (user.role === 'agent') {
      list = list.filter(c => c.assigned_agent_id === user.id);
    }

    return list.map(c => enrichCase(c));
  }

  public getCaseById(id: number): CaseFile | undefined {
    const item = this.cases.find(c => c.id === id);
    if (!item) return undefined;
    return enrichCase(item);
  }

  // ── Google Sheets full-replace sync ─────────────────────────────────
  public replaceAllCasesFromSheet(caseDataList: Record<string, any>[]) {
    const banks = getAllSystemBanks();
    const products = getAllSystemProducts();
    const now = new Date().toISOString();

    const newCases: CaseFile[] = caseDataList.map((data, idx) => {
      // Resolve bank
      let bankId = 1;
      if (data.bank_name) {
        const bName = String(data.bank_name).trim().toLowerCase();
        const bank = banks.find(b => b.name.toLowerCase() === bName || b.code.toLowerCase() === bName);
        if (bank) bankId = bank.id;
        else {
          // Auto-create bank id from name hash
          let hash = 0;
          for (let i = 0; i < bName.length; i++) hash = ((hash << 5) - hash) + bName.charCodeAt(i);
          bankId = Math.abs(hash % 100000) + 100;
        }
      }

      // Resolve product
      let productId = 1;
      if (data.product_name) {
        const pName = String(data.product_name).trim().toLowerCase();
        const prod = products.find(p => p.bank_id === bankId && p.name.toLowerCase() === pName);
        if (prod) productId = prod.id;
        else {
          let hash = 0;
          const combined = `${bankId}_${pName}`;
          for (let i = 0; i < combined.length; i++) hash = ((hash << 5) - hash) + combined.charCodeAt(i);
          productId = Math.abs(hash % 100000) + 100;
        }
      }

      // Try to reuse existing case id by file number to preserve visit/remark references
      const existingCase = this.cases.find(c =>
        c.file_number.trim().toLowerCase() === String(data.file_number || '').trim().toLowerCase()
      );

      return {
        id: existingCase?.id ?? (Date.now() + idx),
        file_number: String(data.file_number || `GS-${idx + 1}`).trim(),
        bank_id: bankId,
        product_id: productId,
        account_number: data.account_number || '',
        customer_name: String(data.customer_name || 'Unknown').trim(),
        customer_phone: data.customer_phone || '',
        customer_secondary_phone: data.customer_secondary_phone || '',
        customer_address_present: data.customer_address_present || '',
        customer_address_permanent: data.customer_address_permanent || '',
        present_address_visited: existingCase?.present_address_visited ?? false,
        permanent_address_visited: existingCase?.permanent_address_visited ?? false,
        outstanding_amount: Number(data.outstanding_amount) || 0,
        overdue_amount: Number(data.overdue_amount) || 0,
        minimum_payment: data.minimum_payment ? Number(data.minimum_payment) : null,
        status: (data.status as any) || existingCase?.status || 'new',
        legal_status: data.legal_status || existingCase?.legal_status || 'Normal Recovery',
        availability_status: existingCase?.availability_status || null,
        agent_name: data.agent_name || existingCase?.agent_name || '',
        collector_name: data.collector_name || existingCase?.collector_name || '',
        assigned_agent_id: existingCase?.assigned_agent_id ?? null,
        assigned_manager_id: existingCase?.assigned_manager_id ?? null,
        allocation_date: data.allocation_date || existingCase?.allocation_date || null,
        expiry_date: data.expiry_date || existingCase?.expiry_date || null,
        last_visit_at: existingCase?.last_visit_at || null,
        total_collected_amount: existingCase?.total_collected_amount ?? 0,
        extra_attributes: { ...(existingCase?.extra_attributes || {}), ...(data.extra_attributes || {}) },
        created_at: existingCase?.created_at || now,
        updated_at: now,
      };
    });

    this.cases = newCases;
    this.saveState();
    this.notifySubscribers();
  }

  public reassignCase(caseId: number, agentId: number) {
    const item = this.cases.find(c => c.id === caseId);
    if (item) {
      item.assigned_agent_id = agentId;
      item.status = 'in_progress';
      this.saveState();
      this.notifySubscribers();
      try {
        supabase.from('cases').update({ assigned_agent_id: agentId, status: 'in_progress' }).eq('id', caseId).then(() => {});
      } catch (_) {}
    }
  }

  public updateCase(caseId: number, updates: Partial<CaseFile>) {
    const item = this.cases.find(c => c.id === caseId);
    if (item) {
      Object.assign(item, updates);
      if (updates.extra_attributes) {
        item.extra_attributes = {
          ...(item.extra_attributes || {}),
          ...updates.extra_attributes
        };
      }
      item.updated_at = new Date().toISOString();
      this.saveState();
      this.notifySubscribers();

      // ── Sync back to Supabase ───────────────────────────────────
      try {
        const dbPayload: any = {
          customer_phone: item.customer_phone,
          customer_secondary_phone: item.customer_secondary_phone,
          customer_address_present: item.customer_address_present,
          customer_address_permanent: item.customer_address_permanent,
          extra_attributes: item.extra_attributes,
          updated_at: item.updated_at
        };
        supabase.from('cases').update(dbPayload).eq('id', caseId).then(() => {});
      } catch (_) {}

      // ── Sync back to Google Sheet via Apps Script doPost ─────────
      try {
        const settings = loadGSheetSettings();
        if (settings.scriptUrl && item.file_number) {
          const sheetUpdates: Record<string, string> = {};
          if (updates.customer_phone !== undefined)             sheetUpdates['CUSTOMER_PHONE']    = item.customer_phone || '';
          if (updates.customer_secondary_phone !== undefined)   sheetUpdates['REF_PHONE']         = item.customer_secondary_phone || '';
          if (updates.customer_address_present !== undefined)   sheetUpdates['PRESENT_ADDRESS']   = item.customer_address_present || '';
          if (updates.customer_address_permanent !== undefined) sheetUpdates['PERMANENT_ADDRESS'] = item.customer_address_permanent || '';
          if (item.extra_attributes?.EMP_OFFICE_NAME !== undefined)   sheetUpdates['EMP_OFFICE_NAME']   = String(item.extra_attributes.EMP_OFFICE_NAME || '');
          if (item.extra_attributes?.POSITION !== undefined)          sheetUpdates['POSITION']          = String(item.extra_attributes.POSITION || '');
          if (item.extra_attributes?.EMP_OFFICE_ADDRESS !== undefined) sheetUpdates['EMP_OFFICE_ADDRESS'] = String(item.extra_attributes.EMP_OFFICE_ADDRESS || '');
          if (Object.keys(sheetUpdates).length > 0) {
            pushUpdateToSheet(settings.scriptUrl, item.file_number, sheetUpdates).catch(() => {});
          }
        }
      } catch (_) {}
    }
  }

  public addCheckIn(checkIn: Omit<CheckIn, 'id'>): CheckIn {
    const newCi: CheckIn = {
      ...checkIn,
      id: Date.now(),
    };
    this.checkIns.unshift(newCi);

    const item = this.cases.find(c => c.id === checkIn.case_file_id);
    if (item) {
      if (checkIn.address_type === 'present') item.present_address_visited = true;
      if (checkIn.address_type === 'permanent') item.permanent_address_visited = true;
      item.status = 'visited';
    }

    this.saveState();
    this.notifySubscribers();
    try {
      supabase.from('check_ins').insert([newCi]).then(() => {});
      if (item) {
        supabase.from('cases').update({
          present_address_visited: item.present_address_visited,
          permanent_address_visited: item.permanent_address_visited,
          status: 'visited'
        }).eq('id', item.id).then(() => {});
      }
    } catch (_) {}
    return newCi;
  }

  public getCheckInsByCase(caseId: number): CheckIn[] {
    return this.checkIns.filter(c => c.case_file_id === caseId);
  }

  public addRemark(remark: Omit<CaseRemark, 'id'>): CaseRemark {
    const newR: CaseRemark = {
      ...remark,
      id: Date.now(),
    };
    this.remarks.unshift(newR);

    const item = this.cases.find(c => c.id === remark.case_file_id);
    if (item && remark.promised_amount && remark.promise_date) {
      item.status = 'in_progress';
    }

    this.saveState();
    this.notifySubscribers();
    try {
      supabase.from('case_remarks').insert([newR]).then(() => {});
    } catch (_) {}
    return newR;
  }

  public getRemarksByCase(caseId: number): CaseRemark[] {
    return this.remarks.filter(r => r.case_file_id === caseId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addCollection(collection: Omit<Collection, 'id'>): Collection {
    const newCol: Collection = {
      ...collection,
      id: Date.now(),
    };
    this.collections.unshift(newCol);

    const item = this.cases.find(c => c.id === collection.case_file_id);
    if (item) {
      item.total_collected_amount = (item.total_collected_amount || 0) + collection.amount;
      if (item.total_collected_amount >= item.outstanding_amount) {
        item.status = 'settled';
      }
    }

    this.saveState();
    this.notifySubscribers();
    try {
      supabase.from('collections').insert([newCol]).then(() => {});
      if (item) {
        supabase.from('cases').update({
          total_collected_amount: item.total_collected_amount,
          status: item.status
        }).eq('id', item.id).then(() => {});
      }
    } catch (_) {}
    return newCol;
  }

  public getCollectionsByCase(caseId: number): Collection[] {
    return this.collections.filter(c => c.case_file_id === caseId).sort((a, b) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime());
  }

  // TODAY'S PROMISE TO PAY ALERTS
  public getTodayPtpAlerts(user: User): PtpAlertItem[] {
    const userCases = this.getCases(user).filter(c => !['settled', 'closed'].includes(c.status));
    const todayStr = new Date().toISOString().split('T')[0];

    const results: PtpAlertItem[] = [];
    userCases.forEach(c => {
      const caseRemarks = this.remarks.filter(r => r.case_file_id === c.id && r.promise_date);
      if (caseRemarks.length > 0) {
        const latestPtp = caseRemarks[0];
        if (latestPtp.promise_date === todayStr) {
          results.push({
            caseItem: c,
            remark: latestPtp,
            promisedAmount: latestPtp.promised_amount || c.overdue_amount,
            promiseDate: latestPtp.promise_date,
            isOverdue: false,
            daysDiff: 0
          });
        }
      }
    });
    return results;
  }

  // MISSED / OVERDUE PROMISE TO PAY ALERTS
  public getMissedPaymentAlerts(user: User): PtpAlertItem[] {
    const userCases = this.getCases(user).filter(c => !['settled', 'closed'].includes(c.status));
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(todayStr);

    const results: PtpAlertItem[] = [];
    userCases.forEach(c => {
      const caseRemarks = this.remarks.filter(r => r.case_file_id === c.id && r.promise_date);
      if (caseRemarks.length > 0) {
        const latestPtp = caseRemarks[0];
        if (latestPtp.promise_date && latestPtp.promise_date < todayStr) {
          const ptpDate = new Date(latestPtp.promise_date);
          const daysOverdue = Math.max(1, Math.floor((todayDate.getTime() - ptpDate.getTime()) / (1000 * 60 * 60 * 24)));

          results.push({
            caseItem: c,
            remark: latestPtp,
            promisedAmount: latestPtp.promised_amount || c.overdue_amount,
            promiseDate: latestPtp.promise_date,
            isOverdue: true,
            daysDiff: daysOverdue
          });
        }
      }
    });
    return results;
  }

  public getDashboardMetrics(user: User) {
    const cases = this.getCases(user);
    const totalFiles = cases.length;
    const activeFiles = cases.filter(c => ['new', 'in_progress', 'visited'].includes(c.status)).length;
    const settled = cases.filter(c => c.status === 'settled').length;
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringSoon = cases.filter(c => {
      if (!c.expiry_date || ['settled', 'closed'].includes(c.status)) return false;
      const exp = new Date(c.expiry_date);
      return exp >= now && exp <= thirtyDaysFromNow;
    }).length;

    const expired = cases.filter(c => {
      if (!c.expiry_date || ['settled', 'closed'].includes(c.status)) return false;
      const exp = new Date(c.expiry_date);
      return exp < now;
    }).length;

    const totalOutstanding = cases.reduce((acc, c) => acc + (c.outstanding_amount || 0), 0);
    const totalCollected = cases.reduce((acc, c) => acc + (c.total_collected_amount || 0), 0);

    const todayPtps = this.getTodayPtpAlerts(user);
    const missedPtps = this.getMissedPaymentAlerts(user);

    const bankBreakdown: Record<string, { count: number; outstanding: number }> = {};
    cases.forEach(c => {
      const bankName = c.bank?.name || 'Other';
      if (!bankBreakdown[bankName]) {
        bankBreakdown[bankName] = { count: 0, outstanding: 0 };
      }
      bankBreakdown[bankName].count += 1;
      bankBreakdown[bankName].outstanding += (c.outstanding_amount || 0);
    });

    return {
      summary: {
        total_files: totalFiles,
        active_files: activeFiles,
        expiring_soon_count: expiringSoon,
        expired_count: expired,
        settled_count: settled,
        total_outstanding: totalOutstanding,
        total_collected: totalCollected,
        online_agents_count: 5,
        total_agents_count: 5,
        today_ptp_count: todayPtps.length,
        missed_ptp_count: missedPtps.length,
      },
      todayPtps,
      missedPtps,
      charts: {
        files_by_bank: {
          labels: Object.keys(bankBreakdown),
          counts: Object.values(bankBreakdown).map(b => b.count),
          outstandings: Object.values(bankBreakdown).map(b => b.outstanding)
        }
      }
    };
  }

  public deleteCase(id: number) {
    const toDelete = this.cases.find(c => c.id === id);
    const fileNum = toDelete?.file_number;

    this.cases = this.cases.filter(c => c.id !== id);
    this.remarks = this.remarks.filter(r => r.case_file_id !== id);
    this.checkIns = this.checkIns.filter(ci => ci.case_file_id !== id);
    this.collections = this.collections.filter(col => col.case_file_id !== id);
    this.saveState();
    this.notifySubscribers();

    if (fileNum) {
      try {
        supabase.from('cases').delete().eq('file_number', fileNum).then(() => {});
      } catch (_) {}
    }
  }

  public deleteCases(ids: number[]) {
    const idSet = new Set(ids);
    const fileNumbers = this.cases.filter(c => idSet.has(c.id)).map(c => c.file_number);

    this.cases = this.cases.filter(c => !idSet.has(c.id));
    this.remarks = this.remarks.filter(r => !idSet.has(r.case_file_id));
    this.checkIns = this.checkIns.filter(ci => !idSet.has(ci.case_file_id));
    this.collections = this.collections.filter(col => !idSet.has(col.case_file_id));
    this.saveState();
    this.notifySubscribers();

    if (fileNumbers.length > 0) {
      try {
        supabase.from('cases').delete().in('file_number', fileNumbers).then(() => {});
      } catch (_) {}
    }
  }

  // Detect agents mentioned in uploaded files whose user accounts are not created yet
  public getUnregisteredAgents(existingUsers: User[] = []): { name: string; fileCount: number; sampleFiles: string[] }[] {
    const agentMap = new Map<string, { name: string; fileCount: number; sampleFiles: string[] }>();
    
    // Normalize existing user names and employee IDs
    const normalizedUsers = existingUsers.map(u => ({
      name: u.name.trim().toLowerCase(),
      empId: (u.employee_id || '').trim().toLowerCase(),
      email: (u.email || '').trim().toLowerCase(),
    }));

    this.cases.forEach(c => {
      const rawName = (c.agent_name || c.extra_attributes?.['AGENT_NAME'] || c.extra_attributes?.['AGENT'] || '').trim();
      if (!rawName) return;

      const lowerName = rawName.toLowerCase();
      const isRegistered = normalizedUsers.some(u => 
        u.name === lowerName || 
        (u.empId && u.empId === lowerName) ||
        u.email.includes(lowerName)
      );

      if (!isRegistered) {
        if (!agentMap.has(lowerName)) {
          agentMap.set(lowerName, {
            name: rawName,
            fileCount: 0,
            sampleFiles: []
          });
        }
        const record = agentMap.get(lowerName)!;
        record.fileCount += 1;
        if (record.sampleFiles.length < 3) {
          record.sampleFiles.push(c.file_number);
        }
      }
    });

    return Array.from(agentMap.values());
  }

  public importCases(newCases: Partial<CaseFile>[]): number {
    let imported = 0;
    
    // Try to get registered users for automatic agent_id matching
    let registeredUsers: User[] = [];
    try {
      const saved = localStorage.getItem('recovery_all_users');
      if (saved) registeredUsers = JSON.parse(saved);
    } catch (_) {}

    const casesToSync: CaseFile[] = [];

    newCases.forEach(item => {
      const existing = this.cases.find(c => c.file_number === item.file_number);
      const agentName = item.agent_name || item.extra_attributes?.['AGENT_NAME'] || item.extra_attributes?.['AGENT'] || '';
      
      // Auto-match assigned_agent_id if user exists
      let matchedAgentId: number | null | undefined = item.assigned_agent_id;
      if (!matchedAgentId && agentName) {
        const found = registeredUsers.find(u => 
          u.name.trim().toLowerCase() === agentName.trim().toLowerCase() ||
          (u.employee_id && u.employee_id.trim().toLowerCase() === agentName.trim().toLowerCase())
        );
        if (found) matchedAgentId = found.id;
      }

      if (existing) {
        Object.assign(existing, item, { 
          agent_name: agentName || existing.agent_name,
          assigned_agent_id: matchedAgentId || existing.assigned_agent_id,
          updated_at: new Date().toISOString() 
        });
        casesToSync.push(existing);
      } else {
        const fullCase: CaseFile = enrichCase({
          id: Date.now() + Math.floor(Math.random() * 10000),
          file_number: item.file_number || `FILE-${Date.now()}`,
          bank_id: item.bank_id || 1,
          product_id: item.product_id || 1,
          account_number: item.account_number || '',
          customer_name: item.customer_name || 'Customer Name',
          customer_phone: item.customer_phone || '',
          customer_secondary_phone: item.customer_secondary_phone || '',
          customer_address_present: item.customer_address_present || '',
          customer_address_permanent: item.customer_address_permanent || '',
          present_address_visited: false,
          permanent_address_visited: false,
          outstanding_amount: Number(item.outstanding_amount) || 0,
          overdue_amount: Number(item.overdue_amount) || 0,
          minimum_payment: item.minimum_payment,
          status: 'new',
          assigned_agent_id: matchedAgentId,
          agent_name: agentName,
          total_collected_amount: 0,
          allocation_date: item.allocation_date || new Date().toISOString().split('T')[0],
          expiry_date: item.expiry_date || new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
          extra_attributes: item.extra_attributes || {}
        });
        this.cases.push(fullCase);
        casesToSync.push(fullCase);
      }
      imported++;
    });

    this.saveState();
    this.notifySubscribers();

    // Asynchronously push all imported cases to Supabase Cloud
    this.pushCasesToCloud(casesToSync);

    return imported;
  }

  public clearAllCases() {
    this.cases = [];
    this.remarks = [];
    this.checkIns = [];
    this.collections = [];
    this.saveState();
    this.notifySubscribers();

    try {
      supabase.from('cases').delete().neq('id', 0).then(() => {});
      supabase.from('case_remarks').delete().neq('id', 0).then(() => {});
      supabase.from('check_ins').delete().neq('id', 0).then(() => {});
      supabase.from('collections').delete().neq('id', 0).then(() => {});
    } catch (_) {}
  }

  public clearAllContacts() {
    this.contacts = [];
    this.saveState();
    this.notifySubscribers();
    try {
      supabase.from('bank_contacts').delete().neq('id', 0).then(() => {});
    } catch (_) {}
  }
}

export const dataService = new DataService();