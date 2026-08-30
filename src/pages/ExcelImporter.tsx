import React, { useState } from 'react';
import { TemplateService, PREBUILT_TEMPLATES } from '../services/templateService';
import { ExcelImporter, InspectResult, PreviewResult } from '../services/excelImporter';
import { dataService } from '../services/dataService';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  Layers, 
  ArrowRight,
  Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const ExcelImporterPage: React.FC = () => {
  // Upload workflow state
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Custom Template Builder state
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [customBank, setCustomBank] = useState('One Bank Limited');
  const [customProduct, setCustomProduct] = useState('Credit Card');
  const [customHeaders, setCustomHeaders] = useState<string[]>([
    'FILE_NO', 'ACCOUNT_NO', 'CUSTOMER_NAME', 'MOBILE_NO', 'PRESENT_ADDRESS', 'TOTAL_OUTSTANDING', 'OVERDUE_AMOUNT', 'EXPIRY_DATE'
  ]);
  const [newColName, setNewColName] = useState('');

  const handleFileDrop = async (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    let uploadedFile: File | null = null;
    if ('dataTransfer' in e) {
      e.preventDefault();
      uploadedFile = e.dataTransfer.files[0] || null;
    } else if (e.target.files) {
      uploadedFile = e.target.files[0] || null;
    }

    if (uploadedFile) {
      setFile(uploadedFile);
      setImportSuccess(null);
      try {
        const { workbook: wb, result } = await ExcelImporter.inspectFile(uploadedFile);
        setWorkbook(wb);
        setInspectResult(result);
        if (result.sheets.length > 0) {
          const firstSheet = result.sheets[0].name;
          setSelectedSheet(firstSheet);
          const preview = ExcelImporter.previewSheet(wb, firstSheet);
          setPreviewData(preview);
        }
      } catch (err) {
        alert('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.');
      }
    }
  };

  const handleSelectSheet = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      const preview = ExcelImporter.previewSheet(workbook, sheetName);
      setPreviewData(preview);
    }
  };

  const handleRunImport = () => {
    if (!workbook || !selectedSheet) return;
    setIsProcessing(true);

    setTimeout(() => {
      const parsedCases = ExcelImporter.parseSheetToCases(workbook, selectedSheet, 1, 1);
      const count = dataService.importCases(parsedCases);
      setIsProcessing(false);
      setImportSuccess(`Successfully imported and mapped ${count} recovery cases into Supabase!`);
      setFile(null);
      setInspectResult(null);
      setPreviewData(null);
    }, 600);
  };

  const addCustomHeader = () => {
    if (newColName.trim() && !customHeaders.includes(newColName.trim())) {
      setCustomHeaders([...customHeaders, newColName.trim().toUpperCase()]);
      setNewColName('');
    }
  };

  const removeCustomHeader = (idx: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== idx));
  };

  const handleDownloadCustomTemplate = () => {
    TemplateService.generateAndDownload(customBank, customProduct, customHeaders, [
      ['SAMPLE-001', 'ACC-12345', 'John Doe', '01711-000000', 'Dhaka, Bangladesh', 50000, 15000, '2026-10-31']
    ]);
    setShowBuilderModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Excel Ingestion & Template Studio
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Download standard bank schemas or customize headers and ingest recovery workbooks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBuilderModal(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Customize Template (.XLSX)</span>
          </button>

          <button
            onClick={() => TemplateService.downloadMasterWorkbook()}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 flex items-center gap-2 transition-all border border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Master Multi-Bank Workbook</span>
          </button>
        </div>
      </div>

      {importSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="font-bold">{importSuccess}</span>
        </div>
      )}

      {/* Pre-built Templates Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Pre-Built Institutional Recovery Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(PREBUILT_TEMPLATES).map(tpl => (
            <div key={tpl.type} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase">
                    {tpl.badge}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{tpl.headers.length} cols</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-2">{tpl.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{tpl.description}</p>
              </div>

              <button
                onClick={() => TemplateService.downloadTemplate(tpl.type)}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Sheet</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Drag & Drop File Ingestion Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-500" />
          <span>Upload & Ingest Recovery Workbook (.XLSX)</span>
        </h3>

        {!inspectResult ? (
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-emerald-500 cursor-pointer bg-slate-50 dark:bg-slate-950 transition-all text-center"
          >
            <FileSpreadsheet className="w-10 h-10 text-emerald-500 mb-2 animate-bounce" />
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Drag and drop any bank .xlsx file here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports One Bank, DBBL, Asian Paints, and customized workbooks
            </p>
            <input type="file" accept=".xlsx,.xls" onChange={handleFileDrop} className="hidden" />
          </label>
        ) : (
          <div className="space-y-4">
            {/* Sheet Selector */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Loaded File</span>
                <p className="font-bold text-slate-900 dark:text-white">{inspectResult.fileName}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Select Sheet:</span>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSelectSheet(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                >
                  {inspectResult.sheets.map(s => (
                    <option key={s.name} value={s.name}>{s.name} ({s.rowCount} rows)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview Table */}
            {previewData && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-3 bg-slate-100 dark:bg-slate-950 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    Preview First 5 Rows ({previewData.mappedCount} Total Data Rows)
                  </span>
                </div>

                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        {previewData.headers.map((h, idx) => (
                          <th key={idx} className="py-2 px-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          {row.map((cell: any, cIdx: number) => (
                            <td key={cIdx} className="py-2 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                              {String(cell ?? '')}
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
                onClick={() => { setInspectResult(null); setFile(null); }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRunImport}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              >
                {isProcessing ? 'Ingesting into Database...' : 'Confirm & Ingest Cases'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Custom Template Builder */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-purple-500" />
                <span>Custom Excel Template Studio</span>
              </h3>
              <button onClick={() => setShowBuilderModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Partner Bank</label>
                  <input
                    type="text"
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Product Category</label>
                  <input
                    type="text"
                    value={customProduct}
                    onChange={(e) => setCustomProduct(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Add Custom Column Header</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    placeholder="e.g. GUARANTOR_PHONE, BUCKET_DPD"
                    className="flex-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 uppercase"
                  />
                  <button
                    onClick={addCustomHeader}
                    className="px-3 py-2 bg-purple-600 text-white font-bold rounded-xl"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Configured Column Schema ({customHeaders.length})</label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  {customHeaders.map((header, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px]"
                    >
                      <span>{header}</span>
                      <button onClick={() => removeCustomHeader(idx)} className="text-slate-400 hover:text-rose-500">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCustomTemplate}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Custom Template (.XLSX)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};