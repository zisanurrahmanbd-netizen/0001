import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { StatusBadge } from '../components/StatusBadge';
import { CaseFile, CheckIn, Collection, CaseRemark } from '../types';
import { 
  ArrowLeft, MapPin, Phone, Coins, Calendar, Clock, 
  MessageSquare, Receipt, Navigation, UserCheck, Building2
} from 'lucide-react';

export const CaseDetail: React.FC<{ caseId: number; onBack: () => void }> = ({ caseId, onBack }) => {
  const { user } = useAuth();
  const [caseItem, setCaseItem] = useState<CaseFile | undefined>();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [remarks, setRemarks] = useState<CaseRemark[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCol, setShowCol] = useState(false);
  const [showRem, setShowRem] = useState(false);
  const [showReassign, setShowReassign] = useState(false);

  const [addrType, setAddrType] = useState<'present' | 'permanent'>('present');
  const [checkNotes, setCheckNotes] = useState('');
  const [colAmt, setColAmt] = useState('');
  const [colMethod, setColMethod] = useState<'cash' | 'bank_deposit' | 'cheque'>('cash');
  const [colRec, setColRec] = useState('');

  const [remContact, setRemContact] = useState<'contacted' | 'uncontacted' | 'door_locked' | 'shifted'>('contacted');
  const [remPtpAmt, setRemPtpAmt] = useState('');
  const [remPtpDate, setRemPtpDate] = useState('');
  const [remText, setRemText] = useState('');
  const [selAgentId, setSelAgentId] = useState(4);

  const reload = () => {
    setCaseItem(dataService.getCaseById(caseId));
    setCheckIns(dataService.getCheckInsByCase(caseId));
    setRemarks(dataService.getRemarksByCase(caseId));
    setCollections(dataService.getCollectionsByCase(caseId));
  };

  useEffect(() => { reload(); }, [caseId]);

  if (!caseItem) return <div className="p-8 text-center"><button onClick={onBack}>Back</button></div>;

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    dataService.addCheckIn({
      case_file_id: caseItem.id,
      agent_id: user.id,
      address_type: addrType,
      latitude: 23.8103,
      longitude: 90.4125,
      notes: checkNotes,
      visited_at: new Date().toISOString(),
    });
    setShowCheckIn(false);
    setCheckNotes('');
    reload();
  };

  const handleCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !colAmt) return;
    dataService.addCollection({
      case_file_id: caseItem.id,
      agent_id: user.id,
      amount: Number(colAmt),
      payment_method: colMethod,
      receipt_number: colRec || ('REC-' + Date.now().toString().slice(-6)),
      collected_at: new Date().toISOString(),
    });
    setShowCol(false);
    setColAmt('');
    reload();
  };

  const handleRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !remText) return;
    dataService.addRemark({
      case_file_id: caseItem.id,
      user_id: user.id,
      contact_status: remContact,
      promised_amount: remPtpAmt ? Number(remPtpAmt) : undefined,
      promise_date: remPtpDate || undefined,
      remarks: remText,
      created_at: new Date().toISOString(),
    });
    setShowRem(false);
    setRemText('');
    reload();
  };

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.reassignCase(caseItem.id, selAgentId);
    setShowReassign(false);
    reload();
  };

  const agents = DEMO_USERS.filter(u => u.role === 'agent');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button onClick={onBack} className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Registry
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowCheckIn(true)} className="px-3.5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" /> GPS Check-In
          </button>
          <button onClick={() => setShowRem(true)} className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Log Remark / PTP
          </button>
          <button onClick={() => setShowCol(true)} className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" /> Record Payment
          </button>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button onClick={() => setShowReassign(true)} className="px-3.5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> Reassign
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-500 font-bold">{caseItem.file_number}</span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{caseItem.customer_name}</h2>
              </div>
              <StatusBadge status={caseItem.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                <span className="text-slate-400 font-bold text-[10px]">BANK / PRODUCT</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{caseItem.bank?.name}</p>
                <p className="text-slate-500">{caseItem.product?.name}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                <span className="text-slate-400 font-bold text-[10px]">ACCOUNT / CARD</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{caseItem.account_number || 'N/A'}</p>
                <p className="text-slate-500">Expiry: {caseItem.expiry_date || 'N/A'}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl text-xs space-y-1">
              <span className="font-bold flex items-center gap-1 text-emerald-500"><MapPin className="w-3.5 h-3.5" /> Present Residence Address</span>
              <p className="text-slate-600 dark:text-slate-400">{caseItem.customer_address_present || 'No address'}</p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl text-xs space-y-1">
              <span className="font-bold flex items-center gap-1 text-purple-500"><Building2 className="w-3.5 h-3.5" /> Permanent Origin Address</span>
              <p className="text-slate-600 dark:text-slate-400">{caseItem.customer_address_permanent || 'No address'}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white"><Clock className="w-4 h-4 text-emerald-500" /> Contact & Visit Timeline</h3>
            <div className="space-y-2">
              {remarks.map(r => (
                <div key={r.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-blue-500 text-[11px]">
                    <span>REMARK ({r.contact_status})</span>
                    <span className="text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{r.remarks}</p>
                  {r.promised_amount && <p className="text-emerald-500 font-bold">PTP: BDT {r.promised_amount.toLocaleString()} by {r.promise_date}</p>}
                </div>
              ))}
              {checkIns.map(ci => (
                <div key={ci.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-purple-500 text-[11px]">
                    <span>GPS VISIT ({ci.address_type})</span>
                    <span className="text-slate-400">{new Date(ci.visited_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{ci.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Financials */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white"><Coins className="w-4 h-4 text-emerald-500" /> Financial Balances</h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Outstanding</span>
              <p className="text-2xl font-black font-mono">BDT {caseItem.outstanding_amount.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Collected</span>
              <p className="text-2xl font-black text-emerald-500 font-mono">BDT {caseItem.total_collected_amount.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white"><Receipt className="w-4 h-4 text-emerald-500" /> Receipts</h3>
            {collections.map(c => (
              <div key={c.id} className="p-3 bg-emerald-500/10 rounded-2xl text-xs">
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                  <span>BDT {c.amount.toLocaleString()}</span>
                  <span className="font-mono text-[10px]">{c.receipt_number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleCheckIn} className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-sm w-full space-y-3 text-xs">
            <h3 className="font-bold text-sm">GPS Visit Check-In</h3>
            <select value={addrType} onChange={e => setAddrType(e.target.value as any)} className="w-full p-2 bg-slate-100 dark:bg-slate-950 rounded-xl">
              <option value="present">Present Residence</option>
              <option value="permanent">Permanent Origin</option>
            </select>
            <textarea required rows={3} value={checkNotes} onChange={e => setCheckNotes(e.target.value)} placeholder="Visit notes..." className="w-full p-2 bg-slate-100 dark:bg-slate-950 rounded-xl" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCheckIn(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-purple-600 text-white rounded-xl font-bold">Confirm Check-In</button>
            </div>
          </form>
        </div>
      )}

      {showCol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleCollection} className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-sm w-full space-y-3 text-xs">
            <h3 className="font-bold text-sm">Record Payment</h3>
            <input type="number" required value={colAmt} onChange={e => setColAmt(e.target.value)} placeholder="Amount (BDT)" className="w-full p-2 bg-slate-100 dark:bg-slate-950 rounded-xl font-bold" />
            <select value={colMethod} onChange={e => setColMethod(e.target.value as any)} className="w-full p-2 bg-slate-100 dark:bg-slate-950 rounded-xl">
              <option value="cash">Cash</option>
              <option value="bank_deposit">Bank Deposit</option>
              <option value="cheque">Cheque</option>
            </select>
            <input type="text" value={colRec} onChange={e => setColRec(e.target.value)} placeholder="Receipt # (optional)" className="w-full p-2 bg-slate-100 dark:bg-slate-950 rounded-xl" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCol(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold">Save Payment</button>
            </div>
          </form>
        </div>
      )}

      {showRem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleRemark} className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-sm w-full space-y-3 text-xs">
            <h3 className="font-bold text-sm">Log Contact Remark / PTP</h3>
            <select value={remContact} onChange={e => setRemContact(e.target.value as any)} className="w-full p-2 bg-slate-100 dark:bg-slate-950 rounded-xl">
              <option value="contacted">Customer Contacted</option>
              <option value="uncontacted">Unreachable</option>
              <option value="door_locked">Door Locked</option>
              <option value="shifted">Shifted</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={remPtpAmt} onChange={e => setRemPtpAmt(e.target.value)} placeholder="PTP Amount" className="w-full p-2 bg-slate-100 dark:bg-slate-950 rounded-xl" />
              <input type="date" value={remPtpDate} onChange={e => setRemPtpDate(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-950 rounded-xl" />
            </div>
            <textarea required rows={3} value={remText} onChange={e => setRemText(e.target.value)} placeholder="Customer conversation notes..." className="w-full p-2 bg-slate-100 dark:bg-slate-950 rounded-xl" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowRem(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold">Save Remark</button>
            </div>
          </form>
        </div>
      )}

      {showReassign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleReassign} className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-sm w-full space-y-3 text-xs">
            <h3 className="font-bold text-sm">Reassign Case File</h3>
            <select value={selAgentId} onChange={e => setSelAgentId(Number(e.target.value))} className="w-full p-2 bg-slate-100 dark:bg-slate-950 rounded-xl">
              {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.employee_id})</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowReassign(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold">Save Assignment</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};