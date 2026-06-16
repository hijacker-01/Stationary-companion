import { useEffect, useRef, useState } from "react";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useDebounce } from "use-debounce";
import { toast } from "react-hot-toast";
import JsBarcode from "jsbarcode";
import { Search, Printer, Plus, Trash2, Tag, Minus } from "lucide-react";

const fmt = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

function BarcodeCanvas({ value }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || !value) return;
    try {
      JsBarcode(canvasRef.current, String(value), {
        format: "CODE128",
        width: 1.4,
        height: 36,
        displayValue: true,
        fontSize: 11,
        margin: 2,
      });
    } catch {
      // ignore invalid barcode values
    }
  }, [value]);
  return <canvas ref={canvasRef} />;
}

export default function BarcodeGenerator() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [results, setResults] = useState([]);
  const [queue, setQueue] = useState([]); // [{ item, qty }]

  useEffect(() => {
    if (!debouncedSearch) {
      setResults([]);
      return;
    }
    axios.get(`/items?search=${encodeURIComponent(debouncedSearch)}&limit=20`)
      .then((res) => setResults(res.data?.data || []))
      .catch(() => setResults([]));
  }, [debouncedSearch]);

  const addToQueue = (item) => {
    setQueue((q) => {
      if (q.some((row) => row.item.id === item.id)) return q;
      return [...q, { item, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    setQueue((q) => q.map((row) => (row.item.id === id ? { ...row, qty: Math.max(1, qty) } : row)));
  };

  const removeFromQueue = (id) => setQueue((q) => q.filter((row) => row.item.id !== id));

  const labels = queue.flatMap((row) =>
    Array.from({ length: row.qty }).map((_, i) => ({ ...row.item, _key: `${row.item.id}-${i}` }))
  );

  const handlePrint = () => {
    if (labels.length === 0) {
      toast.error("Add at least one item to the print queue");
      return;
    }
    window.print();
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          .label-sheet { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 2mm; padding: 4mm; }
        }
        .barcode-label {
          border: 1px dashed #94a3b8;
          border-radius: 4px;
          padding: 4px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 28mm;
          background: white;
        }
        .barcode-label canvas { max-width: 100%; }
        .label-name { font-size: 10px; font-weight: 700; line-height: 1.1; margin-bottom: 2px; }
        .label-meta { display: flex; justify-content: space-between; width: 100%; font-size: 9px; color: #475569; }
        .label-expiry { font-size: 9px; color: #475569; margin-top: 1px; }
      `}</style>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="no-print">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-brand-600" /> Barcode Label Generator
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Search items, set label quantities, and print Code128 barcode labels.
                  </p>
                </div>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print Labels ({labels.length})
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search item by name..."
                  className="form-input pl-9"
                />
                {results.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                    {results.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { addToQueue(item); setSearch(""); setResults([]); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                      >
                        <span className="font-medium text-slate-800">{item.name}</span>
                        <span className="text-xs text-slate-400">
                          {item.batch ? `Batch ${item.batch} · ` : ""}MRP ₹{fmt(item.mrp)}
                        </span>
                        <Plus className="w-4 h-4 text-brand-500 ml-2" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Queue */}
              {queue.length > 0 && (
                <div className="data-table-container mb-6">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Batch</th>
                        <th>MRP</th>
                        <th>Expiry</th>
                        <th className="text-center">Label Qty</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {queue.map(({ item, qty }) => (
                        <tr key={item.id}>
                          <td className="font-semibold text-slate-800">{item.name}</td>
                          <td>{item.batch || "—"}</td>
                          <td>₹{fmt(item.mrp)}</td>
                          <td>{fmtDate(item.expiry)}</td>
                          <td className="text-center">
                            <div className="inline-flex items-center gap-1">
                              <button onClick={() => updateQty(item.id, qty - 1)} className="p-1 rounded bg-slate-100 hover:bg-slate-200">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={qty}
                                onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 1)}
                                className="w-14 text-center border border-slate-200 rounded px-1 py-0.5 text-sm"
                              />
                              <button onClick={() => updateQty(item.id, qty + 1)} className="p-1 rounded bg-slate-100 hover:bg-slate-200">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td>
                            <button onClick={() => removeFromQueue(item.id)} className="text-rose-500 hover:text-rose-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {queue.length === 0 && (
                <div className="text-center text-slate-400 text-sm py-12 border border-dashed border-slate-200 rounded-xl bg-white">
                  Search for an item above to add it to the label print queue.
                </div>
              )}

              {labels.length > 0 && <h2 className="text-sm font-bold text-slate-700 mb-2">Label Preview</h2>}
            </div>

            {/* Label sheet (visible in preview and print) */}
            {labels.length > 0 && (
              <div className="label-sheet grid grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-200">
                {labels.map((item) => (
                  <div key={item._key} className="barcode-label">
                    <p className="label-name">{item.name}</p>
                    <BarcodeCanvas value={`ITM${item.id}`} />
                    <div className="label-meta">
                      <span>B: {item.batch || "-"}</span>
                      <span>MRP ₹{fmt(item.mrp)}</span>
                    </div>
                    {item.expiry && <p className="label-expiry">Exp: {fmtDate(item.expiry)}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
