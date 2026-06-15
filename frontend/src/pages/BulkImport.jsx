import { useState, useRef } from "react";
import axios from "../api/axios";
import PageLayout from "../components/PageLayout";
import { toast } from "react-hot-toast";
import {
  UploadCloud, Download, FileSpreadsheet, CheckCircle2,
  AlertTriangle, Loader2, XCircle, Trash2,
} from "lucide-react";

// Columns accepted by /items/bulk-import (must match backend ALLOWED fields)
const TEMPLATE_COLUMNS = [
  "name", "batch", "hsn", "pack", "category", "company",
  "stock_qty", "scheme_qty", "unit", "expiry", "location",
  "mrp", "selling_price", "cost_price", "purchaseScheme", "schedule", "reorderPoint",
];

const SAMPLE_ROW = [
  "Paracetamol 500mg", "B1234", "30049099", "10x10", "Tablet", "ABC Pharma",
  "100", "5", "strips", "2027-12-31", "Rack-A1",
  "25.00", "20.00", "15.00", "", "None", "10",
];

// Minimal CSV parser supporting quoted fields with commas/newlines
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { field += char; }
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ",") { row.push(field); field = ""; }
      else if (char === "\r") { /* skip */ }
      else if (char === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += char;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export default function BulkImport() {
  const [rows, setRows] = useState([]); // array of objects keyed by header
  const [headers, setHeaders] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    const csv = [TEMPLATE_COLUMNS.join(","), SAMPLE_ROW.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "items_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (file) => {
    if (!file) return;
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const table = parseCSV(text);
      if (table.length < 2) {
        toast.error("CSV must contain a header row and at least one data row");
        setRows([]);
        setHeaders([]);
        return;
      }
      const headerRow = table[0].map((h) => h.trim());
      const dataRows = table.slice(1).map((r) =>
        Object.fromEntries(headerRow.map((h, idx) => [h, (r[idx] ?? "").trim()]))
      );
      setHeaders(headerRow);
      setRows(dataRows);
    };
    reader.readAsText(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const clearFile = () => {
    setRows([]);
    setHeaders([]);
    setFileName("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    setResult(null);
    try {
      const { data } = await axios.post("/items/bulk-import", { items: rows });
      setResult(data);
      if (data.created || data.updated) {
        toast.success(`Imported: ${data.created} created, ${data.updated} updated`);
      }
      if (data.errors?.length) {
        toast.error(`${data.errors.length} row(s) had errors`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const unknownHeaders = headers.filter((h) => !TEMPLATE_COLUMNS.includes(h));

  return (
    <PageLayout
      maxWidth="max-w-5xl"
      title={<span className="flex items-center gap-2 text-xl"><FileSpreadsheet className="w-5 h-5 text-teal-600" /> Bulk Import — Item Master</span>}
      subtitle="Upload a CSV to create or update many items at once. Matching is done on Name + Batch."
      actions={
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
              >
                <Download className="w-4 h-4" /> Download CSV Template
              </button>
      }
    >
            {/* Upload area */}
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-slate-300 rounded-xl bg-white p-10 text-center hover:border-teal-400 transition-colors"
            >
              <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-3">
                Drag & drop a CSV file here, or
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg cursor-pointer hover:bg-teal-700 transition-colors">
                Choose File
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
              {fileName && (
                <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> {fileName} ({rows.length} rows)
                  <button onClick={clearFile} className="text-rose-500 hover:text-rose-700">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {unknownHeaders.length > 0 && (
              <div className="mt-4 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Unrecognized column(s) will be ignored: <strong>{unknownHeaders.join(", ")}</strong>.
                  Expected columns: {TEMPLATE_COLUMNS.join(", ")}
                </span>
              </div>
            )}

            {/* Preview */}
            {rows.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-700">
                    Preview ({rows.length} row{rows.length !== 1 ? "s" : ""})
                  </h2>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-60"
                  >
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    {importing ? "Importing..." : `Import ${rows.length} Item${rows.length !== 1 ? "s" : ""}`}
                  </button>
                </div>
                <div className="data-table-container max-h-80 overflow-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {headers.map((h) => (
                          <th key={h} className={!TEMPLATE_COLUMNS.includes(h) ? "text-slate-400" : ""}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((r, i) => (
                        <tr key={i}>
                          {headers.map((h) => (
                            <td key={h} className="text-xs">{r[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 50 && (
                  <p className="text-xs text-slate-400 mt-2">Showing first 50 of {rows.length} rows.</p>
                )}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="mt-6 space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="text-2xl font-black text-slate-900">{result.created}</p>
                      <p className="text-xs text-slate-500 font-semibold uppercase">Created</p>
                    </div>
                  </div>
                  <div className="bg-white border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-2xl font-black text-slate-900">{result.updated}</p>
                      <p className="text-xs text-slate-500 font-semibold uppercase">Updated</p>
                    </div>
                  </div>
                  <div className="bg-white border border-rose-200 rounded-xl p-4 flex items-center gap-3">
                    <XCircle className="w-6 h-6 text-rose-600" />
                    <div>
                      <p className="text-2xl font-black text-slate-900">{result.errors?.length || 0}</p>
                      <p className="text-xs text-slate-500 font-semibold uppercase">Errors</p>
                    </div>
                  </div>
                </div>

                {result.errors?.length > 0 && (
                  <div className="data-table-container max-h-60 overflow-auto">
                    <table className="data-table">
                      <thead>
                        <tr><th>CSV Row</th><th>Error</th></tr>
                      </thead>
                      <tbody>
                        {result.errors.map((e, i) => (
                          <tr key={i}>
                            <td>{e.row}</td>
                            <td className="text-rose-600">{e.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
    </PageLayout>
  );
}
