import { dataService } from './dataService';
import { supabase } from '../lib/supabase';

// ── Column mapping: Google Sheet header → CaseFile field ──────────────
const COL_MAP: Record<string, string> = {
  FILE_NO:                    'file_number',
  FILE_NUMBER:                'file_number',
  CASE_NO:                    'file_number',
  BANK_NAME:                  'bank_name',
  BANK:                       'bank_name',
  FILE_TYPE:                  'file_type',
  PRODUCT_NAME:               'product_name',
  PRODUCT:                    'product_name',
  CARD_TYPE:                  'product_name',
  ACCOUNT_NUMBER:             'account_number',
  ACCOUNT_NO:                 'account_number',
  CARD_NUMBER:                'account_number',
  CASA:                       'casa',
  CUSTOMER_NAME:              'customer_name',
  CLIENT_NAME:                'customer_name',
  NAME:                       'customer_name',
  CUSTOMER_PHONE:             'customer_phone',
  PHONE:                      'customer_phone',
  MOBILE:                     'customer_phone',
  CUSTOMER_SECONDARY_PHONE:   'customer_secondary_phone',
  SECONDARY_PHONE:            'customer_secondary_phone',
  REF_PHONE:                  'customer_secondary_phone',
  ALT_PHONE:                  'customer_secondary_phone',
  EMP_OFFICE_NAME:            'emp_office_name',
  POSITION:                   'position',
  EMP_OFFICE_ADDRESS:         'emp_office_address',
  PRESENT_ADDRESS:            'customer_address_present',
  CURRENT_ADDRESS:            'customer_address_present',
  PERMANENT_ADDRESS:          'customer_address_permanent',
  OUTSTANDING_AMOUNT:         'outstanding_amount',
  OUTSTANDING:                'outstanding_amount',
  TOTAL_OUTSTANDING:          'outstanding_amount',
  OVERDUE_AMOUNT:             'overdue_amount',
  OVERDUE:                    'overdue_amount',
  MINIMUM_PAYMENT:            'minimum_payment',
  MIN_PAYMENT:                'minimum_payment',
  DPD:                        'dpd',
  STATUS:                     'status',
  FILE_STATUS:                'status',
  LEGAL_STATUS:               'legal_status',
  AGENT_NAME:                 'agent_name',
  AGENT:                      'agent_name',
  FIELD_AGENT:                'agent_name',
  COLLECTOR_NAME:             'collector_name',
  COLLECTOR:                  'collector_name',
  BANK_COLLECTOR:             'collector_name',
  BANK_OFFICER:               'collector_name',
  BRANCH_NAME:                'branch_name',
  AREA:                       'area',
  ALLOCATION_DATE:            'allocation_date',
  ALLOC_DATE:                 'allocation_date',
  EXPIRY_DATE:                'expiry_date',
  EXPIRY:                     'expiry_date',
  LAP_STATUS:                 'lap_status',
};

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'success' | 'error';
  lastSync?: string;
  lastError?: string;
  totalRows?: number;
  scriptUrl?: string;
}

// ── Settings key in localStorage ─────────────────────────────────────
const SETTINGS_KEY = 'gsheet_sync_settings';

export interface GSheetSettings {
  scriptUrl: string;
  enabled: boolean;
  intervalSeconds: number; // default 60
}

export function loadGSheetSettings(): GSheetSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { scriptUrl: '', enabled: false, intervalSeconds: 60 };
}

export function saveGSheetSettings(settings: GSheetSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  try {
    supabase.from('file_templates').upsert({
      template_key: 'system_gsheet_settings',
      definition: JSON.stringify(settings),
      updated_at: new Date().toISOString()
    }, { onConflict: 'template_key' }).then(() => {});
  } catch (_) {}
}

export async function fetchGSheetSettingsFromCloud(): Promise<GSheetSettings> {
  try {
    const { data } = await supabase.from('file_templates').select('definition').eq('template_key', 'system_gsheet_settings').maybeSingle();
    if (data?.definition) {
      const parsed = typeof data.definition === 'string' ? JSON.parse(data.definition) : data.definition;
      if (parsed && typeof parsed === 'object' && parsed.scriptUrl) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (_) {}
  return loadGSheetSettings();
}

// ── Parse a value from the sheet row into a CaseFile field ────────────
function parseValue(field: string, raw: any): any {
  if (raw === null || raw === undefined || raw === '') return undefined;
  const str = String(raw).trim();
  if (['outstanding_amount', 'overdue_amount', 'minimum_payment'].includes(field)) {
    const n = parseFloat(str.replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  if (['allocation_date', 'expiry_date'].includes(field)) {
    // Accept YYYY-MM-DD or any date string
    if (!str) return undefined;
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch (_) {}
    return str;
  }
  if (field === 'status') {
    // Keep raw FILE_STATUS value as-is (SMA, SS, DF, BL, Write-off, etc.)
    // Do NOT normalize - just return the original value
    return str;
  }
  if (field === 'dpd') {
    const n = parseInt(str.replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? str : n;
  }
  return str;
}

// ── Push a single row update back to Google Sheet via Apps Script ──────
export async function pushUpdateToSheet(
  scriptUrl: string,
  fileNumber: string,
  updates: Record<string, string>
): Promise<{ ok: boolean; message?: string; response?: any }> {
  if (!scriptUrl || !fileNumber) {
    console.warn('[pushUpdateToSheet] Skipped: scriptUrl or fileNumber missing', { scriptUrl, fileNumber });
    return { ok: false, message: 'No script URL or file number' };
  }
  try {
    console.log(`[pushUpdateToSheet] Sending update for ${fileNumber}...`, updates);
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow',
      body: JSON.stringify({
        action: 'update',
        fileNumber,
        updates,
      }),
    });
    const text = await res.text();
    let json: any = {};
    try { json = JSON.parse(text); } catch (_) { json = { status: 'ok', raw: text }; }
    console.log(`[pushUpdateToSheet] Response for ${fileNumber}:`, json);
    return { ok: json.success !== false && json.status !== 'error', message: json.error || json.message, response: json };
  } catch (e: any) {
    console.error(`[pushUpdateToSheet] Network error for ${fileNumber}:`, e);
    return { ok: false, message: e?.message || 'Network error' };
  }
}

// ── Fetch rows from Apps Script and map to CaseFile-like objects ──────
async function fetchSheetRows(scriptUrl: string): Promise<any[]> {
  const url = scriptUrl.includes('?')
    ? `${scriptUrl}&t=${Date.now()}`
    : `${scriptUrl}?t=${Date.now()}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

function mapRowToCaseData(row: Record<string, any>): Record<string, any> | null {
  const mapped: Record<string, any> = {
    extra_attributes: { ...row }
  };

  for (const [sheetCol, rawVal] of Object.entries(row)) {
    const normalKey = String(sheetCol).trim().toUpperCase().replace(/\s+/g, '_');
    const field = COL_MAP[normalKey];
    if (field) {
      const val = parseValue(field, rawVal);
      if (val !== undefined) mapped[field] = val;
    }
  }

  // Must have at minimum a file number and customer name
  if (!mapped.file_number && !mapped.customer_name) return null;
  if (!mapped.file_number) mapped.file_number = `GS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  return mapped;
}

// ── Main sync function ───────────────────────────────────────────────
export async function syncFromGoogleSheet(
  scriptUrl: string,
  onStatus: (s: SyncStatus) => void
): Promise<void> {
  onStatus({ state: 'syncing', scriptUrl });

  try {
    const rows = await fetchSheetRows(scriptUrl);
    const caseDataList = rows.map(mapRowToCaseData).filter(Boolean) as Record<string, any>[];

    if (caseDataList.length === 0) {
      onStatus({
        state: 'error',
        lastError: 'No valid rows found in the sheet. Check column headers.',
        scriptUrl,
      });
      return;
    }

    // Replace all cases in dataService with the sheet data and push to cloud
    await dataService.replaceAllCasesFromSheet(caseDataList);

    onStatus({
      state: 'success',
      lastSync: new Date().toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      totalRows: caseDataList.length,
      scriptUrl,
    });
  } catch (err: any) {
    onStatus({
      state: 'error',
      lastError: err?.message || 'Unknown error',
      scriptUrl,
    });
  }
}

// ── Interval manager (singleton) ────────────────────────────────────
let _syncInterval: ReturnType<typeof setInterval> | null = null;

export function startSyncInterval(
  scriptUrl: string,
  intervalSeconds: number,
  onStatus: (s: SyncStatus) => void
) {
  stopSyncInterval();
  // Run immediately first
  syncFromGoogleSheet(scriptUrl, onStatus);
  _syncInterval = setInterval(() => {
    syncFromGoogleSheet(scriptUrl, onStatus);
  }, intervalSeconds * 1000);
}

export function stopSyncInterval() {
  if (_syncInterval !== null) {
    clearInterval(_syncInterval);
    _syncInterval = null;
  }
}

export function initGlobalSheetAutoSync() {
  fetchGSheetSettingsFromCloud().then((settings) => {
    if (settings.enabled && settings.scriptUrl) {
      startSyncInterval(settings.scriptUrl, settings.intervalSeconds || 60, () => {});
    }
  });
}

