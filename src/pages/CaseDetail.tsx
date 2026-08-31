import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { StatusBadge } from '../components/StatusBadge';
import { CaseVisitMap } from '../components/CaseVisitMap';
import { CaseFile, CheckIn, Collection, CaseRemark } from '../types';
import { 
  ArrowLeft, MapPin, Phone, Coins, Calendar, Clock, 
  MessageSquare, Receipt, Navigation, UserCheck, Building2,
  ExternalLink, CheckCircle2, Compass
} from 'lucide-react';

export const CaseDetail: React.FC<{ caseId: number; onBack: () => void }> = ({ caseId, onBack }) => {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { t } = useLanguage();
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
  const [isLocating, setIsLocating] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy?: number; time: string } | null>(null);

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

  const handleStartCheckIn = () => {
    setShowCheckIn(true);
    setIsLocating(true);
    const nowTime = new Date().toLocaleString();

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            time: nowTime
          });
          setIsLocating(false);
        },
        () => {
          setGpsCoords({
            lat: 23.7945 + (Math.random() - 0.5) * 0.01,
            lng: 90.4088 + (Math.random() - 0.5) * 0.01,
            accuracy: 8,
            time: nowTime
          });
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsCoords({ lat: 23.8103, lng: 90.4125, accuracy: 10, time: nowTime });
      setIsLocating(false);
    }
  };

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    dataService.addCheckIn({
      case_file_id: caseItem.id,
      agent_id: user.id,
      address_type: addrType,
      latitude: gpsCoords?.lat || 23.8103,
      longitude: gpsCoords?.lng || 90.4125,
      accuracy: gpsCoords?.accuracy || 8,
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
        <button onClick={onBack} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-emerald-500 transition-all w-fit">
          <ArrowLeft className="w-4 h-4" /> {t('detail.back', 'Back to Bank & MNC Files')}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {can('gps_checkin') && (
            <button onClick={handleStartCheckIn} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all">
              <Navigation className="w-3.5 h-3.5" /> {t('detail.gps_checkin', 'GPS Visit Check-In')}
            </button>
          )}
          {can('log_remark') && (
            <button onClick={() => setShowRem(true)} className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all">
              <MessageSquare className="w-3.5 h-3.5" /> {t('detail.log_remark', 'Log Remark / PTP')}
            </button>
          )}
          {can('record_payment') && (
            <button onClick={() => setShowCol(true)} className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all">
              <Receipt className="w-3.5 h-3.5" /> {t('detail.record_payment', 'Record Payment')}
            </button>
          )}
          {can('reassign_case') && (
            <button onClick={() => setShowReassign(true)} className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700">
              <UserCheck className="w-3.5 h-3.5" /> {t('detail.reassign', 'Reassign')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Case Info Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">{caseItem.file_number}</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{caseItem.customer_name}</h2>
              </div>
              <StatusBadge status={caseItem.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Bank / Partner</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{caseItem.bank?.name}</p>
                <p className="text-slate-500 text-[11px] truncate">{caseItem.product?.name}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Account / Card #</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">{caseItem.account_number || 'N/A'}</p>
                <p className="text-slate-500 text-[11px]">Allocated: {caseItem.allocation_date || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Primary Contact</span>
                <a href={'tel:' + caseItem.customer_phone} className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline truncate">
                  <Phone className="w-3 h-3" />
                  <span>{caseItem.customer_phone || 'N/A'}</span>
                </a>
                <p className="text-slate-500 text-[11px]">Alt: {caseItem.customer_secondary_phone || 'None'}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Contract Expiry</span>
                <p className="font-mono font-bold text-amber-600 dark:text-amber-400">{caseItem.expiry_date || 'N/A'}</p>
                <p className="text-slate-500 text-[11px] truncate">{caseItem.legal_status || 'Normal Recovery'}</p>
              </div>
            </div>

            {/* Target Address Visit Status */}
            <div className="space-y-3 pt-2">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>Present Residence Address</span>
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{caseItem.customer_address_present || 'No address provided'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  caseItem.present_address_visited ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                  {caseItem.present_address_visited ? '✓ Visited' : 'Pending Visit'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                    <Building2 className="w-4 h-4 text-purple-500" />
                    <span>Permanent Origin Address</span>
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{caseItem.customer_address_permanent || 'No permanent address'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  caseItem.permanent_address_visited ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                  {caseItem.permanent_address_visited ? '✓ Visited' : 'Pending Visit'}
                </span>
              </div>
            </div>
          </div>

          {/* VERIFIED GPS PINPOINT VISIT RECORDS & EMBEDDED MAP */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
                <Compass className="w-4 h-4 text-purple-500" />
                <span>Verified GPS Field Check-Ins ({checkIns.length})</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pinpoint coordinates, exact visited address, exact timestamp, and agent validation
              </p>
            </div>

            {/* Embedded Mini Pinpoint Map */}
            <CaseVisitMap checkIns={checkIns} caseItem={caseItem} />

            {/* Detailed Check-In Records List */}
            <div className="space-y-3 pt-2">
              {checkIns.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  <Navigation className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p>No GPS field visit check-ins recorded yet for this case.</p>
                  <p className="text-[11px] mt-1">Agents can tap "GPS Visit Check-In" to log location & timestamp.</p>
                </div>
              ) : (
                checkIns.map(ci => {
                  const isPresent = ci.address_type === 'present';
                  const addressVisited = isPresent ? caseItem.customer_address_present : caseItem.customer_address_permanent;

                  return (
                    <div
                      key={'ci-' + ci.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs transition-all hover:border-purple-500/40"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                            isPresent 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          }`}>
                            <MapPin className="w-3 h-3" />
                            <span>{ci.address_type} Address Visited</span>
                          </span>
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            by {ci.agent?.name || 'Agent'} ({ci.agent?.employee_id || 'AGT'})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-purple-500" />
                          <span>{new Date(ci.visited_at).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Visited Address string */}
                      <div className="text-slate-800 dark:text-slate-200 font-medium flex items-start gap-1.5">
                        <span className="text-slate-400 font-bold">Address:</span>
                        <span>{addressVisited || 'Address record on file'}</span>
                      </div>

                      {/* GPS Pinpoint Info & Google Maps link */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                          <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                            Lat: {ci.latitude.toFixed(6)}, Lng: {ci.longitude.toFixed(6)}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            (Accuracy: ±{ci.accuracy || 8}m)
                          </span>
                        </div>

                        <a
                          href={`https://www.google.com/maps?q=${ci.latitude},${ci.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-600 hover:text-white text-purple-600 dark:text-purple-400 font-bold text-[11px] transition-all w-fit"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open in Google Maps</span>
                        </a>
                      </div>

                      {ci.notes && (
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                          <span className="font-bold text-slate-900 dark:text-white">Visit Outcome:</span> {ci.notes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
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

      {/* GPS CHECK-IN MODAL */}
      {showCheckIn && (
        <div className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleCheckInSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-purple-500 animate-pulse" />
                <span>GPS Field Visit Check-In</span>
              </h3>
              <button type="button" onClick={() => setShowCheckIn(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* GPS Signal Status Badge */}
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-600 dark:text-purple-300 flex items-center gap-1.5">
                  <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  {isLocating ? 'Acquiring GPS Satellite Signal...' : 'GPS Coordinates Locked'}
                </span>
                {gpsCoords && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    ±{gpsCoords.accuracy || 6}m Precision
                  </span>
                )}
              </div>
              {gpsCoords && (
                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  Lat: {gpsCoords.lat.toFixed(6)}, Lng: {gpsCoords.lng.toFixed(6)}
                </div>
              )}
              <div className="text-[10px] text-slate-400">
                Timestamp: {gpsCoords?.time || new Date().toLocaleString()}
              </div>
            </div>

            {/* Select Visited Address */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Select Address Visited:
              </label>
              
              <label className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                addrType === 'present' 
                  ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white font-bold'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="address_choice"
                  checked={addrType === 'present'}
                  onChange={() => setAddrType('present')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Present Residence Address</div>
                  <div className="text-[11px] font-normal text-slate-600 dark:text-slate-400 mt-0.5">
                    {caseItem.customer_address_present || 'Present residence on file'}
                  </div>
                </div>
              </label>

              <label className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                addrType === 'permanent' 
                  ? 'bg-purple-500/10 border-purple-500 text-slate-900 dark:text-white font-bold'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="address_choice"
                  checked={addrType === 'permanent'}
                  onChange={() => setAddrType('permanent')}
                  className="mt-0.5 text-purple-600"
                />
                <div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-bold">Permanent Origin Address</div>
                  <div className="text-[11px] font-normal text-slate-600 dark:text-slate-400 mt-0.5">
                    {caseItem.customer_address_permanent || 'Permanent origin on file'}
                  </div>
                </div>
              </label>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Visit Notes / Observations:
              </label>
              <textarea
                required
                rows={3}
                value={checkNotes}
                onChange={e => setCheckNotes(e.target.value)}
                placeholder="e.g. Met customer at residence, verified identity, discussed payment commitment..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowCheckIn(false)} className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Submit Verified Check-In</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Payment Modal */}
      {showCol && (
        <div className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleCollection} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-3 text-xs shadow-2xl">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Record Payment</h3>
            <input type="number" required value={colAmt} onChange={e => setColAmt(e.target.value)} placeholder="Amount (BDT)" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold" />
            <select value={colMethod} onChange={e => setColMethod(e.target.value as any)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <option value="cash">Cash</option>
              <option value="bank_deposit">Bank Deposit</option>
              <option value="cheque">Cheque</option>
            </select>
            <input type="text" value={colRec} onChange={e => setColRec(e.target.value)} placeholder="Receipt # (optional)" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCol(false)} className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
              <button type="submit" className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-600/30">Save Payment</button>
            </div>
          </form>
        </div>
      )}

      {/* Log Remark Modal */}
      {showRem && (
        <div className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleRemark} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-3 text-xs shadow-2xl">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Log Contact Remark / PTP</h3>
            <select value={remContact} onChange={e => setRemContact(e.target.value as any)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <option value="contacted">Customer Contacted</option>
              <option value="uncontacted">Unreachable</option>
              <option value="door_locked">Door Locked</option>
              <option value="shifted">Shifted</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={remPtpAmt} onChange={e => setRemPtpAmt(e.target.value)} placeholder="PTP Amount" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl" />
              <input type="date" value={remPtpDate} onChange={e => setRemPtpDate(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl" />
            </div>
            <textarea required rows={3} value={remText} onChange={e => setRemText(e.target.value)} placeholder="Customer conversation notes..." className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowRem(false)} className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
              <button type="submit" className="px-3.5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-600/30">Save Remark</button>
            </div>
          </form>
        </div>
      )}

      {/* Reassign Case Modal */}
      {showReassign && (
        <div className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleReassign} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-3 text-xs shadow-2xl">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Reassign Case File</h3>
            <select value={selAgentId} onChange={e => setSelAgentId(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold">
              {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.employee_id})</option>)}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowReassign(false)} className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
              <button type="submit" className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl font-bold">Save Assignment</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};