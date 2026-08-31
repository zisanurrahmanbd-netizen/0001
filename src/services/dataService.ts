import { supabase } from '../lib/supabase';
import { Bank, Product, CaseFile, CheckIn, Collection, CaseRemark, BankContact, User } from '../types';

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

class DataService {
  private cases: CaseFile[] = [];
  private remarks: CaseRemark[] = [];
  private checkIns: CheckIn[] = [];
  private collections: Collection[] = [];
  private contacts: BankContact[] = [];

  constructor() {
    this.loadState();
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

  public getBanks(): Bank[] {
    return INITIAL_BANKS;
  }

  public getProducts(): Product[] {
    return INITIAL_PRODUCTS;
  }

  public getContacts(): BankContact[] {
    return this.contacts.map(c => ({
      ...c,
      bank: INITIAL_BANKS.find(b => b.id === c.bank_id)
    }));
  }

  public addContact(contact: Omit<BankContact, 'id'>): BankContact {
    const newContact: BankContact = {
      ...contact,
      id: Date.now()
    };
    this.contacts.unshift(newContact);
    this.saveState();
    return newContact;
  }

  public updateContact(id: number, contact: Partial<BankContact>) {
    const existing = this.contacts.find(c => c.id === id);
    if (existing) {
      Object.assign(existing, contact);
      this.saveState();
    }
  }

  public deleteContact(id: number) {
    this.contacts = this.contacts.filter(c => c.id !== id);
    this.saveState();
  }

  public getCases(user: User): CaseFile[] {
    let list = [...this.cases];
    if (user.role === 'manager') {
      list = list.filter(c => c.assigned_manager_id === user.id);
    } else if (user.role === 'agent') {
      list = list.filter(c => c.assigned_agent_id === user.id);
    }

    return list.map(c => ({
      ...c,
      bank: INITIAL_BANKS.find(b => b.id === c.bank_id),
      product: INITIAL_PRODUCTS.find(p => p.id === c.product_id),
    }));
  }

  public getCaseById(id: number): CaseFile | undefined {
    const item = this.cases.find(c => c.id === id);
    if (!item) return undefined;
    return {
      ...item,
      bank: INITIAL_BANKS.find(b => b.id === item.bank_id),
      product: INITIAL_PRODUCTS.find(p => p.id === item.product_id),
    };
  }

  public reassignCase(caseId: number, agentId: number) {
    const item = this.cases.find(c => c.id === caseId);
    if (item) {
      item.assigned_agent_id = agentId;
      item.status = 'in_progress';
      this.saveState();
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
          const diffDays = Math.max(1, Math.floor((todayDate.getTime() - ptpDate.getTime()) / (1000 * 3600 * 24)));
          results.push({
            caseItem: c,
            remark: latestPtp,
            promisedAmount: latestPtp.promised_amount || c.overdue_amount,
            promiseDate: latestPtp.promise_date,
            isOverdue: true,
            daysDiff: diffDays
          });
        }
      }
    });
    return results;
  }

  public getDashboardMetrics(user: User) {
    const cases = this.getCases(user);
    const totalFiles = cases.length;
    const activeFiles = cases.filter(c => !['settled', 'closed'].includes(c.status)).length;
    
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 86400000);
    
    const expiringSoon = cases.filter(c => {
      if (!c.expiry_date || ['settled', 'closed'].includes(c.status)) return false;
      const exp = new Date(c.expiry_date);
      return exp >= now && exp <= sevenDaysLater;
    }).length;

    const expired = cases.filter(c => {
      if (!c.expiry_date || ['settled', 'closed'].includes(c.status)) return false;
      return new Date(c.expiry_date) < now;
    }).length;

    const settled = cases.filter(c => c.status === 'settled').length;
    const totalOutstanding = cases.reduce((acc, c) => acc + (c.outstanding_amount || 0), 0);
    const totalCollected = cases.reduce((acc, c) => acc + (c.total_collected_amount || 0), 0);

    const todayPtps = this.getTodayPtpAlerts(user);
    const missedPtps = this.getMissedPaymentAlerts(user);

    // Bank breakdown
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

  public importCases(newCases: Partial<CaseFile>[]): number {
    let imported = 0;
    newCases.forEach(item => {
      const existing = this.cases.find(c => c.file_number === item.file_number);
      if (existing) {
        Object.assign(existing, item, { updated_at: new Date().toISOString() });
      } else {
        const fullCase: CaseFile = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          file_number: item.file_number || `FILE-${Date.now()}`,
          bank_id: item.bank_id || 1,
          product_id: item.product_id || 1,
          customer_name: item.customer_name || 'Customer Name',
          customer_phone: item.customer_phone || '',
          customer_address_present: item.customer_address_present || '',
          customer_address_permanent: item.customer_address_permanent || '',
          present_address_visited: false,
          permanent_address_visited: false,
          outstanding_amount: Number(item.outstanding_amount) || 0,
          overdue_amount: Number(item.overdue_amount) || 0,
          status: 'new',
          total_collected_amount: 0,
          allocation_date: new Date().toISOString().split('T')[0],
          expiry_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
          extra_attributes: item.extra_attributes || {}
        };
        this.cases.push(fullCase);
      }
      imported++;
    });
    this.saveState();
    return imported;
  }

  public clearAllCases() {
    this.cases = [];
    this.remarks = [];
    this.checkIns = [];
    this.collections = [];
    this.saveState();
  }

  public clearAllContacts() {
    this.contacts = [];
    this.saveState();
  }
}

export const dataService = new DataService();