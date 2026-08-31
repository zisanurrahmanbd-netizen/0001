import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { TemplateService, PREBUILT_TEMPLATES, TemplateDefinition } from "../services/templateService";
import { ExcelImporter, InspectResult, PreviewResult } from "../services/excelImporter";
import { dataService } from "../services/dataService";
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Edit3,
  Building2,
  CreditCard,
  Check,
  Info,
  Sparkles,
  UserX
} from "lucide-react";
import * as XLSX from "xlsx";

export const ExcelImporterPage: React.FC = () => {
  const { t } = useLanguage();
  const { users } = useAuth();

  // All available banks and products in the system
  const banks = dataService.getBanks();
  const allProducts = dataService.getProducts();

  // Live editable templates state
  const [templates, setTemplates] = useState<Record<string, TemplateDefinition>>(() => ({ ...PREBUILT_TEMPLATES }));

  // Upload workflow state
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [detectedUnregistered, setDetectedUnregistered] = useState<string[]>([]);

  // Bank & Product Selection System State
  const [selectedBankId, setSelectedBankId] = useState<number>(1);
  const [selectedProductId, setSelectedProductId] = useState<number>(1);

  // Filter products matching selected bank
  const availableProducts = allProducts.filter(p => p.bank_id === selectedBankId);

  // Custom Template Builder state
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [editingTemplateKey, setEditingTemplateKey] = useState<string | null>(null);
  const [customBank, setCustomBank] = useState("One Bank Limited");
  const [customProduct, setCustomProduct] = useState("Credit Card");
  const [customHeaders, setCustomHeaders] = useState<string[]>([
    "FILE_NO", "ACCOUNT_NO", "CUSTOMER_NAME", "MOBILE_NO", "PRESENT_ADDRESS", "TOTAL_OUTSTANDING", "OVERDUE_AMOUNT", "AGENT_NAME", "EXPIRY_DATE"
  ]);
  const [newColName, setNewColName] = useState("");

  const handleFileDrop = async (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    let uploadedFile: File | null = null;
    if ("dataTransfer" in e) {
      e.preventDefault();
      uploadedFile = e.dataTransfer.files[0] || null;
    } else if (e.target.files) {
      uploadedFile = e.target.files[0] || null;
    }

    if (uploadedFile) {
      setFile(uploadedFile);
      setImportSuccess(null);
      setDetectedUnregistered([]);
      try {
        const { workbook: wb, result } = await ExcelImporter.inspectFile(uploadedFile);
        setWorkbook(wb);
        setInspectResult(result);
        if (result.sheets.length > 0) {
          const firstSheet = result.sheets[0].name;
          setSelectedSheet(firstSheet);
          const preview = ExcelImporter.previewSheet(wb, firstSheet);
          setPreviewData(preview);

          // Auto-detect bank from file/sheet name
          const detectedBankObj = banks.find(b => 
            b.name.toLowerCase().includes(result.sheets[0].detectedBank.toLowerCase()) ||
            result.fileName.toLowerCase().includes(b.code.toLowerCase())
          );
          if (detectedBankObj) {
            setSelectedBankId(detectedBankObj.id);
            const matchingProd = allProducts.find(p => p.bank_id === detectedBankObj.id);
            if (matchingProd) setSelectedProductId(matchingProd.id);
          }

          // Check for unregistered agent names in this sheet
          checkSheetUnregisteredAgents(wb, firstSheet);
        }
      } catch (err: any) {
        alert("Failed to parse Excel file: " + (err.message || "Invalid format"));
      }
    }
  };

  const handleBankChange = (newBankId: number) => {
    setSelectedBankId(newBankId);
    const firstMatchingProd = allProducts.find(p => p.bank_id === newBankId);
    if (firstMatchingProd) {
      setSelectedProductId(firstMatchingProd.id);
    }
  };

  const checkSheetUnregisteredAgents = (wb: XLSX.WorkBook, sheetName: string) => {
    try {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) return;
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);
      const agentNames = new Set<string>();
      rows.forEach(r => {
        const name = (r["AGENT_NAME"] || r["AGENT"] || r["AGENT_ID"] || r["OFFICER_NAME"] || "").toString().trim();
        if (name) agentNames.add(name);
      });

      const unreg: string[] = [];
      agentNames.forEach(agentName => {
        const lower = agentName.toLowerCase();
        const exists = users.some(u => 
          u.name.trim().toLowerCase() === lower ||
          (u.employee_id && u.employee_id.trim().toLowerCase() === lower) ||
          u.email.toLowerCase().includes(lower)
        );
        if (!exists) unreg.push(agentName);
      });
      setDetectedUnregistered(unreg);
    } catch (_) {}
  };

  const handleSelectSheet = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      const preview = ExcelImporter.previewSheet(workbook, sheetName);
      setPreviewData(preview);
      checkSheetUnregisteredAgents(workbook, sheetName);
    }
  };

  const handleRunImport = () => {
    if (!workbook || !selectedSheet) return;
    setIsProcessing(true);

    setTimeout(() => {
      const parsedCases = ExcelImporter.parseSheetToCases(workbook, selectedSheet, selectedBankId, selectedProductId);
      const count = dataService.importCases(parsedCases);
      const targetBank = banks.find(b => b.id === selectedBankId)?.name || "Bank";
      const targetProd = allProducts.find(p => p.id === selectedProductId)?.name || "Portfolio";
      
      setIsProcessing(false);
      setImportSuccess(`Successfully imported and categorized ${count} recovery cases under ${targetBank} (${targetProd})!`);
      setFile(null);
      setInspectResult(null);
      setPreviewData(null);
      setDetectedUnregistered([]);
    }, 600);
  };

  const handleEditTemplate = (key: string, tpl: TemplateDefinition) => {
    setEditingTemplateKey(key);
    setCustomBank(tpl.bankName);
    setCustomProduct(tpl.productName);
    setCustomHeaders([...tpl.headers]);
    setShowBuilderModal(true);
  };

  const handleCreateNewTemplate = () => {
    setEditingTemplateKey(null);
    setCustomBank("Standard Chartered Bank");
    setCustomProduct("Personal Loan");
    setCustomHeaders(["FILE_NO", "ACCOUNT_NO", "CUSTOMER_NAME", "MOBILE_NO", "PRESENT_ADDRESS", "TOTAL_OUTSTANDING", "AGENT_NAME", "EXPIRY_DATE"]);
    setShowBuilderModal(true);
  };

  const addCustomHeader = () => {
    if (newColName.trim() && !customHeaders.includes(newColName.trim().toUpperCase().replace(/\s+/g, "_"))) {
      setCustomHeaders([...customHeaders, newColName.trim().toUpperCase().replace(/\s+/g, "_")]);
      setNewColName("");
    }
  };

  const removeCustomHeader = (idx: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== idx));
  };

  const handleSaveAndDownload = () => {
    if (editingTemplateKey && templates[editingTemplateKey]) {
      setTemplates({
        ...templates,
        [editingTemplateKey]: {
          ...templates[editingTemplateKey],
          bankName: customBank,
          productName: customProduct,
          headers: [...customHeaders],
        }
      });
    }

    TemplateService.generateAndDownload(customBank, customProduct, customHeaders, [
      ["SAMPLE-001", "ACC-12345", "John Doe", "01711-000000", "Dhaka, Bangladesh", 50000, 15000, "Tariqul Islam", "2026-10-31"]
    ]);
    setShowBuilderModal(false);
  };

  const standardHeaderFormat = [
    { key: "FILE_NO", label: "File No", req: true },
    { key: "CARD_NO / ACCOUNT_NO", label: "Account / Card No", req: true },
    { key: "CUSTOMER_NAME", label: "Customer Name", req: true },
    { key: "MOBILE_NO", label: "Mobile Phone", req: true },
    { key: "PRESENT_ADDRESS", label: "Present Address", req: false },
    { key: "PERMANENT_ADDRESS", label: "Permanent Address", req: false },
    { key: "TOTAL_OUTSTANDING", label: "Outstanding (BDT)", req: true },
    { key: "OVERDUE_AMOUNT", label: "Overdue (BDT)", req: false },
    { key: "AGENT_NAME", label: "Agent Name", req: true, highlight: true },
    { key: "EXPIRY_DATE", label: "Expiry Date (YYYY-MM-DD)", req: false },
    { key: "LEGAL_STATUS", label: "Legal Status", req: false },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t("import.title", "Excel Ingestion & Template Studio")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("import.subtitle", "Download standard bank schemas with AGENT_NAME headers, or upload recovery workbooks")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCreateNewTemplate}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t("top.switch_lang") === "English" ? "কাস্টম টেমপ্লেট তৈরি" : "Create Custom Template"}</span>
          </button>

          <button
            onClick={() => TemplateService.downloadMasterWorkbook()}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 flex items-center gap-2 transition-all border border-slate-700/50"
          >
            <Download className="w-4 h-4" />
            <span>{t("top.switch_lang") === "English" ? "মাস্টার ওয়ার্কবুক ডাউনলোড" : "Master Multi-Bank Workbook"}</span>
          </button>
        </div>
      </div>

      {importSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="font-bold">{importSuccess}</span>
        </div>
      )}

      {/* Pre-built Templates Grid with AGENT_NAME badge */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>{t("top.switch_lang") === "English" ? "ব্যাংক টেমপ্লেট ফরম্যাটসমূহ" : "Institutional Bank Templates & Schemas"}</span>
          </h3>
          <span className="text-xs text-slate-400">
            All template downloads include <b className="text-purple-600 dark:text-purple-400 font-mono">AGENT_NAME</b> column
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(templates).map(([key, tpl]) => (
            <div
              key={key}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-all group"
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">{tpl.bankName}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{tpl.productName}</p>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {tpl.headers.slice(0, 4).map((h, i) => (
                    <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800">
                      {h}
                    </span>
                  ))}
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                    AGENT_NAME
                  </span>
                </div>
              </div>

              {/* Action Buttons: Edit Format & Download */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => handleEditTemplate(key, tpl)}
                  className="py-2 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-600 hover:text-white text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  title="Customize column headers for this format"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t("top.switch_lang") === "English" ? "এডিট ফরম্যাট" : "Edit Format"}</span>
                </button>

                <button
                  onClick={() => TemplateService.generateAndDownload(tpl.bankName, tpl.productName, tpl.headers, [tpl.sampleRow])}
                  className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t("top.switch_lang") === "English" ? "ডাউনলোড" : "Download"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drag & Drop File Ingestion Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>{t("top.switch_lang") === "English" ? "রিকভারি ফাইল আপলোড ও প্রক্রিয়াকরণ (.XLSX)" : "Upload & Ingest Recovery Workbook (.XLSX)"}</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            System automatically matches <b className="text-emerald-500 font-mono">AGENT_NAME</b> to field recovery staff
          </span>
        </div>

        {/* Standard Format Column Header Reference Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>Standard Format Column Headers for Ingestion:</span>
            </span>
            <span className="text-[10px] text-slate-400">Matches Downloaded Excel Templates</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {standardHeaderFormat.map((h, i) => (
              <span 
                key={i} 
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold shadow-xs border ${
                  h.highlight
                    ? "bg-purple-600 text-white border-purple-600 shadow-purple-600/30"
                    : h.req
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                    : "bg-slate-200/60 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                }`}
              >
                <span>{h.key}</span>
                {h.highlight && <Sparkles className="w-2.5 h-2.5" />}
              </span>
            ))}
          </div>
        </div>

        {!inspectResult ? (
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-emerald-500 cursor-pointer bg-slate-50 dark:bg-slate-950 transition-all text-center"
          >
            <FileSpreadsheet className="w-10 h-10 text-emerald-500 mb-2 animate-bounce" />
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
              {t("import.upload_box", "Drag and drop .xlsx file here or browse device")}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports One Bank, DBBL, Asian Paints, and customized workbooks with AGENT_NAME
            </p>
            <input type="file" accept=".xlsx,.xls" onChange={handleFileDrop} className="hidden" />
          </label>
        ) : (
          <div className="space-y-4">

            {/* ─── "I am uploading a file for this bank/product" selector ─── */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 border border-blue-500/30 dark:border-blue-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  I am uploading a file for:
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Select Bank */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Partner Bank / Institution
                  </label>
                  <select
                    value={selectedBankId}
                    onChange={(e) => handleBankChange(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>🏦 {b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Select Product / Portfolio */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Product / Portfolio Type
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  >
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>💳 {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Info className="w-3 h-3 text-blue-400 flex-shrink-0" />
                All imported cases will be categorized under the bank and product you select above. New banks can be added from the Partner Banks section.
              </p>
            </div>

            {/* Sheet Selector */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Loaded File</span>
                <p className="font-bold text-slate-900 dark:text-white">{inspectResult.fileName}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">{t("import.select_sheet", "Select Worksheet")}:</span>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSelectSheet(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  {inspectResult.sheets.map(s => (
                    <option key={s.name} value={s.name}>{s.name} ({s.rowCount} rows)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Unregistered Agent Warning Notice */}
            {detectedUnregistered.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                  <UserX className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>Unregistered Agent Accounts Detected in this Excel File:</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  The following agent names were found in the file but do not have active user accounts yet:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {detectedUnregistered.map((name, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold font-mono text-[11px]">
                      {name}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  ℹ️ These cases will still be imported. A notification will remain in the Sidebar and Team Management until you create accounts for these agents. Once created, the system will auto-link them and remove the notification.
                </p>
              </div>
            )}

            {/* Sheet Preview Table */}
            {previewData && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Data Preview (First 5 Rows):
                  </span>
                  <span className="text-slate-400 font-mono">
                    Total Rows: {previewData.mappedCount}
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto bg-slate-50 dark:bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-400 uppercase">
                      <tr>
                        {previewData.headers.map((h, idx) => (
                          <th 
                            key={idx} 
                            className={`py-2.5 px-3 font-bold whitespace-nowrap ${
                              h.toUpperCase().includes("AGENT") ? "text-purple-600 dark:text-purple-400 bg-purple-500/10" : ""
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-mono text-[11px]">
                      {previewData.rows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-white dark:hover:bg-slate-900">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="py-2 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                              {String(cell ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => { setInspectResult(null); setFile(null); setDetectedUnregistered([]); }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                {t("detail.cancel", "Cancel")}
              </button>
              <button
                onClick={handleRunImport}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
              >
                {isProcessing ? (
                  "Ingesting into Database..."
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t("top.switch_lang") === "English" ? "ইমপোর্ট সম্পন্ন করুন" : "Confirm & Ingest Cases"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Edit / Customize Template Format */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-500" />
                <span>{editingTemplateKey ? "Edit Template Format" : "Create Custom Template"}</span>
              </h3>
              <button onClick={() => setShowBuilderModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Partner Bank Name</label>
                  <input
                    type="text"
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Product Category</label>
                  <input
                    type="text"
                    value={customProduct}
                    onChange={(e) => setCustomProduct(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Add New Column Header</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomHeader())}
                    placeholder="e.g. AGENT_NAME, GUARANTOR_NAME, DPD_BUCKET"
                    className="flex-1 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 uppercase font-mono"
                  />
                  <button
                    onClick={addCustomHeader}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-1 shadow-md shadow-purple-600/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Configured Columns ({customHeaders.length})
                  </label>
                  <span className="text-[11px] text-slate-400">Click × to remove any column</span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  {customHeaders.map((header, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[11px] shadow-sm"
                    >
                      <span className="text-slate-400 font-mono text-[10px]">{idx + 1}.</span>
                      <span className="font-bold">{header}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomHeader(idx)}
                        className="text-slate-400 hover:text-rose-500 font-bold ml-1"
                        title="Remove column"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  {t("detail.cancel", "Cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndDownload}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <Download className="w-4 h-4" />
                  <span>{t("top.switch_lang") === "English" ? "সংরক্ষণ ও ডাউনলোড" : "Save & Download .XLSX"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};