import React, { useState, useEffect, useCallback } from 'react';
import {
  loadGSheetSettings,
  saveGSheetSettings,
  fetchGSheetSettingsFromCloud,
  startSyncInterval,
  stopSyncInterval,
  syncFromGoogleSheet,
  SyncStatus,
} from '../services/googleSheetsSync';
import {
  Sheet,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  ExternalLink,
  Copy,
  Info,
  Clock,
  Wifi,
  WifiOff,
  FileSpreadsheet,
  Save,
} from 'lucide-react';

const APPS_SCRIPT_CODE = `// ═══════════════════════════════════════════════════════════════
// Bank Recovery System — Google Sheets Live Sync Script
// Instructions:
//   1. Open your Google Sheet
//   2. Click Extensions → Apps Script
//   3. Delete all existing code, paste this entire script
//   4. Click Save (💾), then Deploy → New Deployment
//   5. Type: Web app | Execute as: Me | Who has access: Anyone
//   6. Click Deploy → Copy the web app URL → Paste it in the app
// ═══════════════════════════════════════════════════════════════

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Cases') || ss.getSheets()[0];
    var data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      return response({ data: [], total: 0, updated: new Date().toISOString() });
    }

    // Normalise headers: trim + uppercase + spaces → underscores
    var headers = data[0].map(function(h) {
      return String(h).trim().toUpperCase().replace(/\\s+/g, '_');
    });

    var rows = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var obj = {};
      var hasData = false;
      for (var j = 0; j < headers.length; j++) {
        var val = row[j];
        if (val instanceof Date) val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        obj[headers[j]] = val;
        if (val !== '' && val !== null && val !== undefined) hasData = true;
      }
      if (hasData) rows.push(obj);
    }

    return response({ data: rows, total: rows.length, updated: new Date().toISOString() });
  } catch (err) {
    return response({ error: err.toString(), data: [], total: 0 });
  }
}

function doPost(e) {
  try {
    var rawText = e.postData.contents;
    var body = JSON.parse(rawText);
    var action = body.action;
    var fileNumber = String(body.fileNumber || '').trim();
    var updates = body.updates;

    if (action !== 'update' || !fileNumber || !updates) {
      return response({ success: false, error: 'Invalid request: action, fileNumber or updates missing' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Cases') || ss.getSheets()[0];
    var data = sheet.getDataRange().getValues();

    if (data.length < 2) return response({ success: false, error: 'No data in sheet' });

    var headers = data[0].map(function(h) {
      return String(h).trim().toUpperCase().replace(/\s+/g, '_');
    });

    // Find the file identifier column (FILE_NO, FILE_NUMBER, CASE_NO, or first col)
    var fileNoIdx = headers.indexOf('FILE_NO');
    if (fileNoIdx === -1) fileNoIdx = headers.indexOf('FILE_NUMBER');
    if (fileNoIdx === -1) fileNoIdx = headers.indexOf('CASE_NO');
    if (fileNoIdx === -1) fileNoIdx = 0; // fallback to column A

    var targetRow = -1;
    var searchClean = fileNumber.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (var i = 1; i < data.length; i++) {
      var cellVal = String(data[i][fileNoIdx]).trim();
      var cellClean = cellVal.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cellVal.toLowerCase() === fileNumber.toLowerCase() || (searchClean && cellClean === searchClean)) {
        targetRow = i + 1; // 1-indexed for Sheets API
        break;
      }
    }

    if (targetRow === -1) {
      return response({ success: false, error: 'File not found in sheet: ' + fileNumber, searchedCol: headers[fileNoIdx] });
    }

    // For each key in updates, find the column index and update the cell.
    // If the column does not exist yet, dynamically append it to header row 1!
    var updated = [];
    Object.keys(updates).forEach(function(key) {
      var colName = String(key).trim().toUpperCase().replace(/\s+/g, '_');
      var colIdx = headers.indexOf(colName);
      if (colIdx === -1) {
        // Automatically add the missing column header to row 1
        var newColIdx = sheet.getLastColumn() + 1;
        sheet.getRange(1, newColIdx).setValue(colName);
        headers.push(colName);
        colIdx = headers.length - 1;
      }
      sheet.getRange(targetRow, colIdx + 1).setValue(updates[key]);
      updated.push(colName);
    });

    SpreadsheetApp.flush();
    return response({ success: true, updated: updated, row: targetRow, fileNumber: fileNumber });
  } catch (err) {
    return response({ success: false, error: err.toString() });
  }
}

function response(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

const SHEET_COLUMNS = [
  { col: 'BANK_NAME', desc: 'Full bank name', example: 'Dutch-Bangla Bank Limited' },
  { col: 'FILE_TYPE', desc: 'File category / loan type', example: 'Credit Card / Retail' },
  { col: 'FILE_NO', desc: 'Case / File number (required)', example: 'DBL-2024-001' },
  { col: 'ACCOUNT_NUMBER', desc: 'Account or card number', example: '4111-xxxx-xxxx-1234' },
  { col: 'CASA', desc: 'CASA / Current or Savings Account number', example: '110.120.345678' },
  { col: 'CUSTOMER_NAME', desc: 'Full customer name (required)', example: 'Md. Rafiqul Islam' },
  { col: 'PRODUCT_NAME', desc: 'Product or scheme name', example: 'Credit Card' },
  { col: 'CUSTOMER_PHONE', desc: 'Primary customer phone number', example: '01712345678' },
  { col: 'REF_PHONE', desc: 'Reference / secondary contact number', example: '01812345678' },
  { col: 'EMP_OFFICE_NAME', desc: 'Employer / Company / Business name', example: 'Apex Footwear Ltd.' },
  { col: 'POSITION', desc: 'Customer job designation / role', example: 'Senior Manager' },
  { col: 'EMP_OFFICE_ADDRESS', desc: 'Workplace / Office location address', example: 'Plot 4, Road 2, Banani, Dhaka' },
  { col: 'PRESENT_ADDRESS', desc: 'Current / present residential address', example: 'House 12, Road 4, Dhanmondi, Dhaka' },
  { col: 'PERMANENT_ADDRESS', desc: 'Permanent / village address', example: 'Village: Karimpur, Dist: Comilla' },
  { col: 'OUTSTANDING_AMOUNT', desc: 'Total outstanding balance (number)', example: '125000' },
  { col: 'OVERDUE_AMOUNT', desc: 'Overdue / past-due balance (number)', example: '45000' },
  { col: 'DPD', desc: 'Days Past Due (e.g. 90, 180, 360)', example: '120' },
  { col: 'FILE_STATUS', desc: 'Status (new / in_progress / visited / settled etc.)', example: 'new' },
  { col: 'AGENT_NAME', desc: 'Assigned field recovery agent name', example: 'Md. Karim' },
  { col: 'COLLECTOR_NAME', desc: 'Bank recovery officer / collector name', example: 'Rina Akter' },
  { col: 'BRANCH_NAME', desc: 'Bank home branch name', example: 'Principal Branch' },
  { col: 'AREA', desc: 'Recovery zone / territory area', example: 'Dhaka North' },
  { col: 'ALLOCATION_DATE', desc: 'Date allocated to agency (YYYY-MM-DD)', example: '2026-09-01' },
  { col: 'EXPIRY_DATE', desc: 'Assignment expiry date (YYYY-MM-DD)', example: '2026-09-30' },
  { col: 'LAP_STATUS', desc: 'Physical file details / Loan Against Property / Legal status', example: 'Physical File Available' },
  { col: 'LAST_VISIT_DATE', desc: 'Date and time of last field visit check-in', example: '2026-09-03 14:30:00' },
  { col: 'LAST_VISIT_TYPE', desc: 'Visited address type (present / permanent)', example: 'present' },
  { col: 'LAST_VISIT_NOTES', desc: 'Field agent observation and visit remarks', example: 'Met customer, agreed to settle' },
  { col: 'LAST_REMARK', desc: 'Latest case conversation remarks / updates', example: 'Customer promised payment' },
  { col: 'LAST_PTP_AMOUNT', desc: 'Promise to Pay amount committed by customer', example: '15000' },
  { col: 'LAST_PTP_DATE', desc: 'Promise to Pay deadline date (YYYY-MM-DD)', example: '2026-09-10' },
  { col: 'CONTACT_STATUS', desc: 'Contact status (contacted / uncontacted / door_locked / shifted)', example: 'contacted' },
  { col: 'LAST_PAYMENT_AMOUNT', desc: 'Last recorded collection amount', example: '5000' },
  { col: 'LAST_PAYMENT_DATE', desc: 'Date of last collection receipt', example: '2026-09-03' },
  { col: 'PAYMENT_METHOD', desc: 'Method of payment (cash / bank_deposit / cheque)', example: 'cash' },
  { col: 'RECEIPT_NO', desc: 'Money receipt number for collection', example: 'MR-98421' },
  { col: 'GUARANTORS', desc: 'Multiple reference / guarantor phone and addresses (JSON or formatted text)', example: '[{"name":"Rahim","phone":"01700000000","address":"Dhaka"}]' },
];

export const GoogleSheetSyncPage: React.FC = () => {
  const [settings, setSettings] = useState(loadGSheetSettings);
  const [status, setStatus] = useState<SyncStatus>({ state: 'idle' });
  const [showScript, setShowScript] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [copied, setCopied] = useState<'script' | 'col' | null>(null);
  const [urlInput, setUrlInput] = useState(settings.scriptUrl);
  const [intervalInput, setIntervalInput] = useState(String(settings.intervalSeconds || 60));
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleStatus = useCallback((s: SyncStatus) => setStatus(s), []);

  // Fetch settings from cloud on mount so URL is never lost across devices
  useEffect(() => {
    fetchGSheetSettingsFromCloud().then((cloudSet) => {
      if (cloudSet && cloudSet.scriptUrl) {
        setSettings(cloudSet);
        setUrlInput(cloudSet.scriptUrl);
        setIntervalInput(String(cloudSet.intervalSeconds || 60));
        if (cloudSet.enabled) {
          startSyncInterval(cloudSet.scriptUrl, cloudSet.intervalSeconds || 60, handleStatus);
        }
      } else if (settings.enabled && settings.scriptUrl) {
        startSyncInterval(settings.scriptUrl, settings.intervalSeconds || 60, handleStatus);
      }
    });

    return () => {
      const curr = loadGSheetSettings();
      if (!curr.enabled) {
        stopSyncInterval();
      }
    };
  }, []);

  const handleSaveAndStart = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    const secs = Math.max(30, parseInt(intervalInput) || 60);
    const newSettings = { scriptUrl: trimmed, enabled: true, intervalSeconds: secs };
    saveGSheetSettings(newSettings);
    setSettings(newSettings);
    setSaveMessage('✓ Apps Script URL saved to Cloud! Syncing data across all devices...');
    startSyncInterval(trimmed, secs, handleStatus);
    await syncFromGoogleSheet(trimmed, handleStatus);
    setTimeout(() => setSaveMessage(null), 6000);
  };

  const handleStop = () => {
    stopSyncInterval();
    const newSettings = { ...settings, enabled: false };
    saveGSheetSettings(newSettings);
    setSettings(newSettings);
    setStatus({ state: 'idle' });
    setSaveMessage('Auto-sync paused.');
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleManualSync = () => {
    if (urlInput.trim()) syncFromGoogleSheet(urlInput.trim(), handleStatus);
  };

  const copyText = (text: string, key: 'script' | 'col') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const colHeaders = SHEET_COLUMNS.map(c => c.col).join('\t');

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Google Sheets Live Sync
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Auto-pull case files from your private Google Sheet every {settings.intervalSeconds || 60} seconds
          </p>
        </div>
        {/* Live status pill */}
        <div className="ml-auto">
          {status.state === 'syncing' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing...
            </span>
          )}
          {status.state === 'success' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <Wifi className="w-3.5 h-3.5" /> Live — {status.totalRows} rows @ {status.lastSync}
            </span>
          )}
          {status.state === 'error' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
              <WifiOff className="w-3.5 h-3.5" /> Sync Error
            </span>
          )}
          {status.state === 'idle' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-bold">
              <WifiOff className="w-3.5 h-3.5" /> Not Connected
            </span>
          )}
        </div>
      </div>

      {/* Error banner */}
      {status.state === 'error' && status.lastError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">Sync Failed</p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-mono">{status.lastError}</p>
            <p className="text-xs text-rose-500 mt-2">Make sure the Apps Script is deployed as a <b>Web App</b> with access set to <b>Anyone</b>.</p>
          </div>
        </div>
      )}

      {/* Save Success Banner */}
      {saveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">{saveMessage}</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">The script URL has been stored in Supabase. All active devices and user accounts will automatically use this URL.</p>
          </div>
        </div>
      )}

      {/* Connection Settings */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-500" /> Connection & Cloud Sync Settings
          </h3>
          {settings.scriptUrl && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
              Cloud Synced ✓
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Apps Script Web App URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfyc.../exec"
              className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <p className="text-[11px] text-slate-400 mt-1">Paste the Google Apps Script deployment URL here. Saving this syncs it across all devices and accounts automatically.</p>
          </div>

          <div className="w-48">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1" /> Auto-Sync Interval (seconds)
            </label>
            <input
              type="number"
              value={intervalInput}
              onChange={e => setIntervalInput(e.target.value)}
              min={30}
              max={3600}
              className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <p className="text-[11px] text-slate-400 mt-1">Minimum 30 seconds (Google limit)</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {/* Dedicated Save & Sync Button */}
          <button
            onClick={handleSaveAndStart}
            disabled={!urlInput.trim() || status.state === 'syncing'}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30"
            title="Save URL to Supabase and immediately sync fresh cases to all devices"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save URL & Sync to All Devices</span>
          </button>

          {!settings.enabled ? (
            <button
              onClick={handleSaveAndStart}
              disabled={!urlInput.trim()}
              className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" /> Start Live Auto-Sync
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-rose-600/30"
            >
              <Square className="w-3.5 h-3.5" /> Pause Auto-Sync
            </button>
          )}

          <button
            onClick={handleManualSync}
            disabled={!urlInput.trim() || status.state === 'syncing'}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status.state === 'syncing' ? 'animate-spin' : ''}`} />
            Sync Now (Manual)
          </button>
        </div>
      </div>

      {/* Step-by-step Setup */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" /> Setup Guide (Do Once)
        </h3>

        <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          {[
            { n: 1, text: 'Open your Google Sheet and name the first sheet tab "Cases".' },
            { n: 2, text: 'Add column headers in Row 1 — use the exact names from the format table below.' },
            { n: 3, text: 'Fill in your case data starting from Row 2.' },
            { n: 4, text: 'Click Extensions → Apps Script in the Google Sheet menu.' },
            { n: 5, text: 'Delete all existing code and paste the Apps Script code below.' },
            { n: 6, text: 'Click Save (💾 icon), then click Deploy → New Deployment.' },
            { n: 7, text: 'Set: Type = Web app | Execute as = Me | Who has access = Anyone.' },
            { n: 8, text: 'Click Deploy → copy the Web App URL that appears.' },
            { n: 9, text: 'Paste that URL above in "Apps Script Web App URL" field → Click Start Live Sync.' },
          ].map(step => (
            <li key={step.n} className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-extrabold text-[11px] flex items-center justify-center flex-shrink-0">
                {step.n}
              </span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>

        {/* Apps Script Code Block */}
        <div>
          <button
            onClick={() => setShowScript(v => !v)}
            className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {showScript ? 'Hide' : 'Show'} Apps Script Code (paste into Google Apps Script)
          </button>

          {showScript && (
            <div className="mt-3 relative">
              <button
                onClick={() => copyText(APPS_SCRIPT_CODE, 'script')}
                className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold transition-all z-10"
              >
                <Copy className="w-3 h-3" />
                {copied === 'script' ? 'Copied!' : 'Copy All'}
              </button>
              <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 text-[11px] font-mono overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">
                {APPS_SCRIPT_CODE}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Column Format Reference */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Google Sheet Column Format
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => copyText(colHeaders, 'col')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/20 transition-all"
            >
              <Copy className="w-3 h-3" />
              {copied === 'col' ? 'Copied!' : 'Copy All Headers'}
            </button>
            <button
              onClick={() => setShowColumns(v => !v)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showColumns ? 'Hide' : 'Show'} Column Details
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Paste the copied headers into Row 1 of your Google Sheet (tab named <b>"Cases"</b>). Column order doesn't matter — the system matches by name.
        </p>

        {showColumns && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="px-3 py-2 text-left font-bold">Column Header</th>
                  <th className="px-3 py-2 text-left font-bold">Description</th>
                  <th className="px-3 py-2 text-left font-bold">Example Value</th>
                </tr>
              </thead>
              <tbody>
                {SHEET_COLUMNS.map((c, i) => (
                  <tr key={c.col} className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950/50'}>
                    <td className="px-3 py-2 font-mono font-bold text-emerald-700 dark:text-emerald-400">{c.col}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{c.desc}</td>
                    <td className="px-3 py-2 font-mono text-slate-400">{c.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400 flex gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <b>Important:</b> The sheet replaces all cases on every sync. Field visit records, remarks and collections already saved in the app are preserved for matching file numbers. New rows from the sheet will appear immediately.
          </span>
        </div>
      </div>
    </div>
  );
};
