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

export const INITIAL_CONTACTS: BankContact[] = [
  { id: 1, bank_id: 1, name: 'Mr. Tanzim Ahmed', designation: 'Recovery Manager', department: 'Cards Recovery', phone: '01711-500001', email: 'tanzim.ahmed@onebank.com.bd', branch: 'Head Office, Dhaka' },
  { id: 2, bank_id: 1, name: 'Ms. Fatima Khanam', designation: 'Senior Recovery Officer', department: 'Retail Loans', phone: '01711-500002', email: 'fatima.k@onebank.com.bd', branch: 'Motijheel Branch' },
  { id: 3, bank_id: 2, name: 'Mr. Rizwan Mahmud', designation: 'Cards Collection Head', department: 'NEXUS Cards', phone: '01912-600001', email: 'rizwan.m@dutchbanglabank.com', branch: 'Principal Branch, Dhaka' },
  { id: 4, bank_id: 2, name: 'Ms. Razia Sultana', designation: 'Field Recovery Officer', department: 'Agent Banking', phone: '01912-600002', email: 'razia.s@dutchbanglabank.com', branch: 'Chittagong Regional' },
  { id: 5, bank_id: 3, name: 'Mr. Anwar Hossain', designation: 'Dealer Credit Manager', department: 'Credit Control', phone: '01612-700001', email: 'anwar.h@asianpaints.com', branch: 'Dhaka Office' },
];

export const INITIAL_CASES: CaseFile[] = [
  {
    id: 1,
    file_number: 'ONE-CC-2024-00001',
    bank_id: 1,
    product_id: 1,
    account_number: 'CC4521087612',
    customer_name: 'Mohammad Rafiqul Islam',
    customer_phone: '01711-100001',
    customer_address_present: 'House 12, Road 5, Banani, Dhaka-1213',
    customer_address_permanent: 'Vill. Rajabari, P.O. Brahmanbaria Sadar',
    present_address_visited: false,
    permanent_address_visited: false,
    outstanding_amount: 85000,
    overdue_amount: 25000,
    minimum_payment: 8500,
    status: 'in_progress',
    assigned_agent_id: 4,
    assigned_manager_id: 2,
    allocation_date: '2026-07-15',
    expiry_date: '2026-09-15',
    total_collected_amount: 0,
  },
  {
    id: 2,
    file_number: 'ONE-CC-2024-00002',
    bank_id: 1,
    product_id: 1,
    account_number: 'CC4521099887',
    customer_name: 'Nasima Begum',
    customer_phone: '01811-200002',
    customer_address_present: 'Flat 4B, Building 7, Gulshan 2, Dhaka',
    customer_address_permanent: 'Vill. Lakshmipura, Comilla District',
    present_address_visited: true,
    permanent_address_visited: false,
    outstanding_amount: 42500,
    overdue_amount: 12000,
    status: 'visited',
    assigned_agent_id: 5,
    assigned_manager_id: 2,
    allocation_date: '2026-07-30',
    expiry_date: '2026-09-30',
    total_collected_amount: 5000,
  },
  {
    id: 3,
    file_number: 'ONE-CC-2024-00003',
    bank_id: 1,
    product_id: 1,
    account_number: 'CC4521022340',
    customer_name: 'Aminul Haque Chowdhury',
    customer_phone: '01911-300003',
    customer_address_present: 'Road 15, House 23, Dhanmondi, Dhaka',
    customer_address_permanent: 'Vill. Sujanagar, Pabna District',
    present_address_visited: true,
    permanent_address_visited: true,
    outstanding_amount: 120000,
    overdue_amount: 45000,
    status: 'legal',
    legal_status: 'Suit Filed at Artha Rin Court',
    assigned_agent_id: 6,
    assigned_manager_id: 2,
    allocation_date: '2026-06-01',
    expiry_date: '2026-08-25',
    total_collected_amount: 0,
  },
  {
    id: 4,
    file_number: 'ONE-PL-2024-00010',
    bank_id: 1,
    product_id: 2,
    account_number: 'PL2024008811',
    customer_name: 'Shahabuddin Ahmed',
    customer_phone: '01615-400010',
    customer_address_present: 'Plot 33, Block B, Bashundhara R/A, Dhaka',
    customer_address_permanent: 'Vill. Monoharpur, Narail District',
    present_address_visited: true,
    permanent_address_visited: true,
    outstanding_amount: 250000,
    overdue_amount: 75000,
    status: 'broken_promise',
    extra_attributes: { promised_amount: 50000, promise_date: '2026-08-20' },
    assigned_agent_id: 4,
    assigned_manager_id: 2,
    allocation_date: '2026-07-01',
    expiry_date: '2026-09-20',
    total_collected_amount: 0,
  },
  {
    id: 5,
    file_number: 'DBBL-CC-2024-00050',
    bank_id: 2,
    product_id: 3,
    account_number: 'NX5534100900',
    customer_name: 'Jahangir Alam Khan',
    customer_phone: '01712-500050',
    customer_address_present: 'OR Nizam Road, Chittagong-4100',
    customer_address_permanent: 'Vill. Boalkhali, Chittagong',
    present_address_visited: false,
    permanent_address_visited: false,
    outstanding_amount: 67000,
    overdue_amount: 22000,
    status: 'in_progress',
    assigned_agent_id: 7,
    assigned_manager_id: 3,
    allocation_date: '2026-08-10',
    expiry_date: '2026-10-10',
    total_collected_amount: 0,
  },
  {
    id: 6,
    file_number: 'DBBL-CC-2024-00051',
    bank_id: 2,
    product_id: 3,
    account_number: 'NX5534107760',
    customer_name: 'Sultana Razia',
    customer_phone: '01811-600051',
    customer_address_present: 'Agrabad C/A, Chittagong-4100',
    customer_address_permanent: 'Vill. Rangunia, Chittagong',
    present_address_visited: true,
    permanent_address_visited: true,
    outstanding_amount: 38500,
    overdue_amount: 8500,
    status: 'settled',
    assigned_agent_id: 8,
    assigned_manager_id: 3,
    allocation_date: '2026-07-05',
    expiry_date: '2026-09-05',
    total_collected_amount: 38500,
  },
  {
    id: 7,
    file_number: 'DBBL-ABL-2024-00100',
    bank_id: 2,
    product_id: 4,
    account_number: 'ABL2024001122',
    customer_name: 'Nurul Absar Miah',
    customer_phone: '01618-700100',
    customer_address_present: 'Halishahar, Chittagong-4225',
    customer_address_permanent: 'Vill. Sikalbaha, Chandanaish, Chittagong',
    present_address_visited: false,
    permanent_address_visited: false,
    outstanding_amount: 185000,
    overdue_amount: 60000,
    status: 'untraceable',
    availability_status: 'No Contact / Abroad',
    assigned_agent_id: 7,
    assigned_manager_id: 3,
    allocation_date: '2026-05-20',
    expiry_date: '2026-08-15',
    total_collected_amount: 0,
  },
  {
    id: 8,
    file_number: 'APB-DR-2024-00200',
    bank_id: 3,
    product_id: 5,
    account_number: 'DR2024200001',
    customer_name: 'Mahmud Brothers Trading',
    customer_phone: '01912-800200',
    customer_address_present: 'Kawran Bazar, Dhaka-1215',
    customer_address_permanent: 'Demra Road, Narayanganj',
    present_address_visited: true,
    permanent_address_visited: false,
    outstanding_amount: 320000,
    overdue_amount: 130000,
    status: 'disputed',
    assigned_agent_id: 5,
    assigned_manager_id: 2,
    allocation_date: '2026-06-15',
    expiry_date: '2026-09-06',
    total_collected_amount: 0,
  },
  {
    id: 9,
    file_number: 'APB-DR-2024-00201',
    bank_id: 3,
    product_id: 5,
    account_number: 'DR2024200002',
    customer_name: 'Rahim Paints & Hardware',
    customer_phone: '01812-900201',
    customer_address_present: 'Moghbazar, Dhaka-1217',
    customer_address_permanent: 'Savar, Dhaka District',
    present_address_visited: false,
    permanent_address_visited: false,
    outstanding_amount: 145000,
    overdue_amount: 45000,
    status: 'in_progress',
    assigned_agent_id: 6,
    assigned_manager_id: 2,
    allocation_date: '2026-08-15',
    expiry_date: '2026-10-15',
    total_collected_amount: 0,
  },
];

export const INITIAL_REMARKS: CaseRemark[] = [
  { id: 1, case_file_id: 1, user_id: 4, contact_status: 'contacted', promised_amount: 15000, promise_date: '2026-09-05', remarks: 'Customer agreed to pay partial amount on next salary date.', created_at: '2026-08-28T10:30:00Z' },
  { id: 2, case_file_id: 4, user_id: 4, contact_status: 'contacted', promised_amount: 50000, promise_date: '2026-08-20', remarks: 'Customer promised payment by 20th August but broke promise.', created_at: '2026-08-18T14:15:00Z' },
  { id: 3, case_file_id: 7, user_id: 7, contact_status: 'uncontacted', remarks: 'Phone numbers switched off. Neighbors stated customer went abroad.', created_at: '2026-08-22T09:00:00Z' }
];

export const INITIAL_CHECKINS: CheckIn[] = [
  { id: 1, case_file_id: 2, agent_id: 5, address_type: 'present', latitude: 23.7781, longitude: 90.4172, notes: 'Met customer at residence. Collected 5,000 BDT token payment.', visited_at: '2026-08-25T11:00:00Z' },
  { id: 2, case_file_id: 6, agent_id: 8, address_type: 'present', latitude: 22.3350, longitude: 91.8325, notes: 'Full settlement payment collected via demand draft.', visited_at: '2026-08-27T15:30:00Z' }
];

export const INITIAL_COLLECTIONS: Collection[] = [
  { id: 1, case_file_id: 2, agent_id: 5, amount: 5000, payment_method: 'cash', receipt_number: 'REC-2024-001', notes: 'Token recovery', collected_at: '2026-08-25T11:15:00Z' },
  { id: 2, case_file_id: 6, agent_id: 8, amount: 38500, payment_method: 'bank_deposit', receipt_number: 'REC-2024-002', notes: 'Full account closure payment', collected_at: '2026-08-27T15:45:00Z' }
];

// In-memory state with local storage persistence
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
    const savedCases = localStorage.getItem('recovery_cases');
    this.cases = savedCases ? JSON.parse(savedCases) : INITIAL_CASES;

    const savedRemarks = localStorage.getItem('recovery_remarks');
    this.remarks = savedRemarks ? JSON.parse(savedRemarks) : INITIAL_REMARKS;

    const savedCheckIns = localStorage.getItem('recovery_checkins');
    this.checkIns = savedCheckIns ? JSON.parse(savedCheckIns) : INITIAL_CHECKINS;

    const savedCollections = localStorage.getItem('recovery_collections');
    this.collections = savedCollections ? JSON.parse(savedCollections) : INITIAL_COLLECTIONS;

    const savedContacts = localStorage.getItem('recovery_contacts');
    this.contacts = savedContacts ? JSON.parse(savedContacts) : INITIAL_CONTACTS;
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

  public getContacts(bankId?: number): BankContact[] {
    let result = [...this.contacts];
    if (bankId) {
      result = result.filter(c => c.bank_id === bankId);
    }
    return result.map(c => ({
      ...c,
      bank: INITIAL_BANKS.find(b => b.id === c.bank_id)
    }));
  }

  public addContact(contact: Omit<BankContact, 'id'>): BankContact {
    const newContact: BankContact = {
      ...contact,
      id: Date.now()
    };
    this.contacts.push(newContact);
    this.saveState();
    return newContact;
  }

  public updateContact(id: number, updates: Partial<BankContact>): BankContact | null {
    const index = this.contacts.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.contacts[index] = { ...this.contacts[index], ...updates };
    this.saveState();
    return this.contacts[index];
  }

  public deleteContact(id: number): boolean {
    const before = this.contacts.length;
    this.contacts = this.contacts.filter(c => c.id !== id);
    this.saveState();
    return this.contacts.length < before;
  }

  public getCases(user: User): CaseFile[] {
    let list = [...this.cases];

    // Role-based scoping
    if (user.role === 'agent') {
      list = list.filter(c => c.assigned_agent_id === user.id);
    } else if (user.role === 'manager') {
      list = list.filter(c => c.assigned_manager_id === user.id);
    }

    return list.map(c => ({
      ...c,
      bank: INITIAL_BANKS.find(b => b.id === c.bank_id),
      product: INITIAL_PRODUCTS.find(p => p.id === c.product_id),
    }));
  }

  public getCaseById(id: number): CaseFile | undefined {
    const c = this.cases.find(item => item.id === id);
    if (!c) return undefined;
    return {
      ...c,
      bank: INITIAL_BANKS.find(b => b.id === c.bank_id),
      product: INITIAL_PRODUCTS.find(p => p.id === c.product_id),
    };
  }

  public updateCaseStatus(id: number, status: CaseFile['status'], extra?: Partial<CaseFile>): CaseFile | null {
    const idx = this.cases.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.cases[idx] = { ...this.cases[idx], status, ...extra, updated_at: new Date().toISOString() };
    this.saveState();
    return this.cases[idx];
  }

  public reassignCase(id: number, agentId: number, managerId?: number): CaseFile | null {
    const idx = this.cases.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.cases[idx].assigned_agent_id = agentId;
    if (managerId) this.cases[idx].assigned_manager_id = managerId;
    this.saveState();
    return this.cases[idx];
  }

  public addCheckIn(checkIn: Omit<CheckIn, 'id'>): CheckIn {
    const newCheckIn: CheckIn = {
      ...checkIn,
      id: Date.now(),
    };
    this.checkIns.push(newCheckIn);

    // Update case visited flag
    const c = this.cases.find(item => item.id === checkIn.case_file_id);
    if (c) {
      if (checkIn.address_type === 'present') c.present_address_visited = true;
      if (checkIn.address_type === 'permanent') c.permanent_address_visited = true;
      c.last_visit_at = checkIn.visited_at;
      if (c.status === 'new' || c.status === 'in_progress') {
        c.status = 'visited';
      }
    }

    this.saveState();
    return newCheckIn;
  }

  public getCheckInsByCase(caseId: number): CheckIn[] {
    return this.checkIns.filter(ci => ci.case_file_id === caseId).sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime());
  }

  public addRemark(remark: Omit<CaseRemark, 'id'>): CaseRemark {
    const newRemark: CaseRemark = {
      ...remark,
      id: Date.now()
    };
    this.remarks.push(newRemark);

    const c = this.cases.find(item => item.id === remark.case_file_id);
    if (c && remark.promised_amount && remark.promise_date) {
      c.status = 'in_progress';
      c.extra_attributes = {
        ...c.extra_attributes,
        promised_amount: remark.promised_amount,
        promise_date: remark.promise_date
      };
    }

    this.saveState();
    return newRemark;
  }

  public getRemarksByCase(caseId: number): CaseRemark[] {
    return this.remarks.filter(r => r.case_file_id === caseId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addCollection(collection: Omit<Collection, 'id'>): Collection {
    const newCol: Collection = {
      ...collection,
      id: Date.now()
    };
    this.collections.push(newCol);

    const c = this.cases.find(item => item.id === collection.case_file_id);
    if (c) {
      c.total_collected_amount += collection.amount;
      if (c.total_collected_amount >= c.outstanding_amount) {
        c.status = 'settled';
      }
    }

    this.saveState();
    return newCol;
  }

  public getCollectionsByCase(caseId: number): Collection[] {
    return this.collections.filter(c => c.case_file_id === caseId).sort((a, b) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime());
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
      },
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
}

export const dataService = new DataService();