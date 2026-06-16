import { useEffect, useState } from "react";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import { CornerDownLeft, Plus, Printer, CheckCircle2, AlertTriangle, Search, Eye, Trash2, ArrowLeft } from "lucide-react";
import { useDocumentKeyboard } from "../hooks/useDocumentKeyboard";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function SalesReturn() {
  const [returns, setReturns]   = useState([]);
  const [bills, setBills]       = useState([]);
  const [view, setView]         = useState("list");
  const [selectedBill, setSelectedBill] = useState(null);
  const [returnItems, setReturnItems]   = useState([]);
  const [reason, setReason]     = useState("");
  const [restock, setRestock]   = useState(true);
  const [search, setSearch]     = useState("");
  const [activeReturn, setActiveReturn] = useState(null);

  const fetchReturns = () =>
    axios.get("/sales-return")
      .then(r => setReturns(r.data));

  const fetchBills = () =>
    axios.get("/billing")
      .then(r => setBills(r.data));

  useEffect(() => { fetchReturns(); fetchBills(); }, []);
  useDocumentKeyboard({ view, onFinish: () => handleSubmit(), onPrint: () => window.print() });

  const handleSelectBill = (bill) => {
    setSelectedBill(bill);
    setReturnItems((bill.items || []).map(it => ({ ...it, returnQty: 0, selected: false })));
    setView("create");
  };

  const subtotal = returnItems.filter(i => i.selected)
    .reduce((s, i) => s + parseFloat(i.selling_price || i.mrp || 0) * parseInt(i.returnQty || 0), 0);
  const gstAmount = returnItems.filter(i => i.selected)
    .reduce((s, i) => {
      const base = parseFloat(i.selling_price || i.mrp || 0) * parseInt(i.returnQty || 0);
      return s + (base * (i.gst || 0)) / 100;
    }, 0);
  const totalAmount = subtotal + gstAmount;

  const handleSubmit = async () => {
    const items = returnItems.filter(i => i.selected && i.returnQty > 0)
      .map(i => ({ ...i, qty: i.returnQty }));
    if (items.length === 0) return 
    try {
      const res = await axios.post("/sales-return", {
        originalBillId: selectedBill.id,
        originalBillNo: selectedBill.billNo,
        customerName:   selectedBill.customerName,
        customerPhone:  selectedBill.customerPhone,
        items,
        subtotal: parseFloat(subtotal.toFixed(2)),
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        reason,
        restockItems: restock,
      });
      setActiveReturn(res.data);
      setView("preview");
      fetchReturns();
    } catch (err) {
      
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this return? Stock will be reversed.")) return;
    await axios.delete(`/sales-return/${id}`);
    fetchReturns();
  };

  // ── PREVIEW ──
  if (view === "preview" && activeReturn) return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <button onClick={() => { setView("list"); setSelectedBill(null); setActiveReturn(null); }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-semibold cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer">
            <Printer className="w-4 h-4" /> Print Credit Note
          </button>
        </div>
        <div className="bg-white rounded max-w-[210mm] mx-auto p-8 shadow-lg text-xs font-sans border border-slate-200">
          <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
            <h1 className="text-xl font-extrabold uppercase">CREDIT NOTE</h1>
            <p className="text-sm text-slate-500">Sales Return</p>
          </div>
          <div className="flex justify-between mb-4">
            <div>
              <p className="font-bold">Customer: {activeReturn.customerName}</p>
              <p>{activeReturn.customerPhone}</p>
            </div>
            <div className="text-right">
              <p><strong>Credit Note No:</strong> {activeReturn.returnNo}</p>
              <p><strong>Date:</strong> {new Date(activeReturn.createdAt).toLocaleDateString("en-IN")}</p>
              <p><strong>Against Bill:</strong> {activeReturn.originalBillNo}</p>
            </div>
          </div>
          <table className="w-full border border-slate-400 mb-4 text-[10px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="border-r border-slate-400 p-1">S.No</th>
                <th className="border-r border-slate-400 p-1 text-left">Product</th>
                <th className="border-r border-slate-400 p-1">Batch</th>
                <th className="border-r border-slate-400 p-1">Qty</th>
                <th className="border-r border-slate-400 p-1">Rate</th>
                <th className="border-r border-slate-400 p-1">GST%</th>
                <th className="p-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(activeReturn.items || []).map((it, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="border-r border-slate-400 p-1 text-center">{i+1}</td>
                  <td className="border-r border-slate-400 p-1 font-bold">{it.name}</td>
                  <td className="border-r border-slate-400 p-1 text-center">{it.batch || "—"}</td>
                  <td className="border-r border-slate-400 p-1 text-center">{it.qty}</td>
                  <td className="border-r border-slate-400 p-1 text-right">{it.selling_price || it.mrp}</td>
                  <td className="border-r border-slate-400 p-1 text-center">{it.gst}%</td>
                  <td className="p-1 text-right">{((parseFloat(it.selling_price||it.mrp||0)*parseInt(it.qty||0))*(1+(it.gst||0)/100)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end gap-8 text-sm">
            <div className="text-right space-y-1">
              <p>Subtotal: ₹{activeReturn.subtotal?.toFixed(2)}</p>
              <p>GST: ₹{activeReturn.gstAmount?.toFixed(2)}</p>
              <p className="font-bold text-lg border-t pt-1">Credit Amount: ₹{activeReturn.totalAmount?.toFixed(2)}</p>
            </div>
          </div>
          {activeReturn.reason && <p className="mt-3 text-xs text-slate-500">Reason: {activeReturn.reason}</p>}
          <p className="text-center text-xs text-slate-400 mt-6 italic">This is a computer generated credit note.</p>
        </div>
      </main>
    </div>
  );

  // ── CREATE ──
  if (view === "create" && selectedBill) return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">New Sales Return</h1>
            <p className="text-sm text-slate-500 mt-1">Against Bill: <span className="font-mono font-bold text-brand-600">{selectedBill.billNo}</span> — {selectedBill.customerName}</p>
          </div>
          <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-semibold cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-slate-700 mb-4">Select Items to Return</h2>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Product</th>
                  <th>Batch</th>
                  <th className="text-center">Billed Qty</th>
                  <th className="text-center">Return Qty</th>
                  <th className="text-right">Rate</th>
                  <th className="text-right">Credit Amount</th>
                </tr>
              </thead>
              <tbody>
                {returnItems.map((item, i) => {
                  const base = parseFloat(item.selling_price || item.mrp || 0) * parseInt(item.returnQty || 0);
                  const amt = base + (base * (item.gst || 0) / 100);
                  return (
                    <tr key={i} className={item.selected ? "bg-green-50" : ""}>
                      <td>
                        <input type="checkbox" checked={item.selected || false}
                          onChange={e => {
                            const u = [...returnItems]; u[i].selected = e.target.checked;
                            if (!e.target.checked) u[i].returnQty = 0;
                            setReturnItems(u);
                          }}
                          className="w-4 h-4 accent-green-600"
                        />
                      </td>
                      <td className="font-semibold">{item.name}</td>
                      <td className="font-mono text-slate-500">{item.batch || "—"}</td>
                      <td className="text-center text-slate-600">{item.qty}</td>
                      <td className="text-center">
                        <input type="number" min="0" max={item.qty}
                          value={item.returnQty || 0}
                          disabled={!item.selected}
                          onChange={e => {
                            const u = [...returnItems];
                            u[i].returnQty = Math.min(parseInt(e.target.value) || 0, item.qty);
                            setReturnItems(u);
                          }}
                          className="w-16 border border-slate-200 rounded px-2 py-1 text-sm text-center disabled:bg-slate-50"
                        />
                      </td>
                      <td className="text-right">₹{item.selling_price || item.mrp}</td>
                      <td className="text-right font-semibold text-green-600">
                        {item.selected && item.returnQty > 0 ? `₹${amt.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-slate-700 mb-3">Return Details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reason for Return</label>
                <select value={reason} onChange={e => setReason(e.target.value)}
                  className="form-input bg-white">
                  <option value="">Select reason...</option>
                  <option value="Damaged goods">Damaged goods</option>
                  <option value="Wrong product supplied">Wrong product supplied</option>
                  <option value="Near expiry">Near expiry / Expired</option>
                  <option value="Quality issue">Quality issue</option>
                  <option value="Excess quantity">Excess quantity ordered</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="restock" checked={restock} onChange={e => setRestock(e.target.checked)}
                  className="w-4 h-4 accent-brand-600" />
                <label htmlFor="restock" className="text-sm text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Add returned items back to inventory stock
                </label>
              </div>
              {!restock && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" /> Items will NOT be restocked (e.g., damaged/expired goods going to disposal)
                </div>
              )}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-slate-700 mb-3">Credit Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>GST</span><span>₹{gstAmount.toFixed(2)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-green-600 text-lg">
                <span>Credit Amount</span><span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSubmit} tabIndex={-1}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold text-sm shadow-sm hover:shadow transition cursor-pointer">
                <CheckCircle2 className="w-4 h-4" /> Finish Return
                <span className="text-xs text-emerald-100">(Shift + Enter)</span>
              </button>
              <button onClick={handleSubmit}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-sm shadow-sm hover:shadow transition cursor-pointer">
                <CheckCircle2 className="w-4 h-4" /> Issue Credit Note
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  // ── LIST ──
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sales Returns</h1>
            <p className="text-sm text-slate-500 mt-1">Credit Notes issued for returned goods</p>
          </div>
          <button onClick={() => setView("select-bill")}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer">
            <Plus className="w-4.5 h-4.5" /> New Return
          </button>
        </div>

        {view === "select-bill" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-slate-700 mb-3">Select Original Bill</h2>
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input type="text" placeholder="Search by bill no or customer..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {bills.filter(b =>
                b.billNo?.toLowerCase().includes(search.toLowerCase()) ||
                b.customerName?.toLowerCase().includes(search.toLowerCase())
              ).map(b => (
                <div key={b.id} className="flex items-center justify-between py-3 px-2 hover:bg-slate-50 rounded">
                  <div>
                    <p className="font-mono font-bold text-brand-600">{b.billNo}</p>
                    <p className="text-sm text-slate-700">{b.customerName}</p>
                    <p className="text-xs text-slate-400">{new Date(b.createdAt).toLocaleDateString("en-IN")} · ₹{b.total}</p>
                  </div>
                  <button onClick={() => handleSelectBill(b)}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition cursor-pointer">
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Return No</th>
                <th>Customer</th>
                <th>Against Bill</th>
                <th>Date</th>
                <th>Items</th>
                <th>Credit Amt</th>
                <th>Restocked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.map(r => (
                <tr key={r.id}>
                  <td className="font-mono text-green-600 font-bold">{r.returnNo}</td>
                  <td className="font-semibold text-slate-900">{r.customerName}</td>
                  <td className="font-mono text-brand-600">{r.originalBillNo || "—"}</td>
                  <td className="text-slate-500">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="text-slate-500">{r.items?.length || 0} items</td>
                  <td className="font-bold text-green-600">₹{r.totalAmount}</td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${r.restockItems ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                      {r.restockItems ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setActiveReturn(r); setView("preview"); }} className="text-brand-600 hover:text-brand-800 text-xs font-semibold cursor-pointer flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {returns.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">No sales returns yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
