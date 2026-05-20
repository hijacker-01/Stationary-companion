import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { Plus, Printer, Send, Trash2, Eye, ArrowLeft, X } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function PurchaseReturn() {
  const [returns, setReturns] = useState([]);
  const [items, setItems] = useState([]);
  const [view, setView] = useState("list");
  const [returnItems, setReturnItems] = useState([{ name: "", batch: "", qty: 1, selling_price: 0, gst: 12 }]);
  const [supplierName, setSupplierName] = useState("");
  const [originalPoNo, setOriginalPoNo] = useState("");
  const [reason, setReason] = useState("");
  const [activeReturn, setActiveReturn] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  const fetchReturns = () => axios.get("http://localhost:5000/api/purchase-return", { headers: headers() }).then(r => setReturns(r.data));
  const fetchItems = () => axios.get("http://localhost:5000/api/items", { headers: headers() }).then(r => setItems(r.data));
  const fetchSuppliers = () => axios.get("http://localhost:5000/api/suppliers", { headers: headers() }).then(r => setSuppliers(r.data));

  useEffect(() => { fetchReturns(); fetchItems(); fetchSuppliers(); }, []);

  const handleItemSelect = (idx, searchStr) => {
    const [namePart, batchPart] = searchStr.split(" | Batch: ");
    const found = items.find(i => i.name === namePart?.trim() && (batchPart ? i.batch === batchPart.trim() : true));
    const u = [...returnItems];
    u[idx] = found ? { ...u[idx], name: found.name, batch: found.batch || "", selling_price: found.cost_price || 0, gst: 12 } : { ...u[idx], name: namePart || searchStr, batch: "" };
    setReturnItems(u);
  };

  const subtotal = returnItems.reduce((s, i) => s + parseFloat(i.selling_price || 0) * parseInt(i.qty || 0), 0);
  const gstAmt = returnItems.reduce((s, i) => { const b = parseFloat(i.selling_price || 0) * parseInt(i.qty || 0); return s + (b * (i.gst || 0) / 100); }, 0);

  const handleSubmit = async () => {
    if (!supplierName) return alert("Supplier required");
    const valid = returnItems.filter(i => i.name && i.qty > 0);
    if (!valid.length) return alert("Add items");
    try {
      const res = await axios.post("http://localhost:5000/api/purchase-return", { supplierName, originalPoNo, reason, items: valid, subtotal: +subtotal.toFixed(2), gstAmount: +gstAmt.toFixed(2), totalAmount: +(subtotal + gstAmt).toFixed(2) }, { headers: headers() });
      setActiveReturn(res.data); setView("preview"); fetchReturns(); fetchItems();
    } catch (err) { alert(err.response?.data?.error || "Failed"); }
  };

  const handleDelete = async (id) => { if (!confirm("Delete?")) return; await axios.delete(`http://localhost:5000/api/purchase-return/${id}`, { headers: headers() }); fetchReturns(); fetchItems(); };

  // ── PREVIEW ──
  if (view === "preview" && activeReturn) return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <button onClick={() => { setView("list"); setActiveReturn(null); }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-semibold cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
        <div className="bg-white max-w-[210mm] mx-auto p-8 shadow-lg text-xs border border-slate-200 rounded-xl">
          <h1 className="text-xl font-extrabold text-center uppercase border-b-2 border-slate-800 pb-3 mb-4">DEBIT NOTE</h1>
          <div className="flex justify-between mb-4">
            <p className="font-bold">Supplier: {activeReturn.supplierName}</p>
            <div className="text-right">
              <p><b>No:</b> {activeReturn.returnNo}</p>
              <p><b>Date:</b> {new Date(activeReturn.createdAt).toLocaleDateString("en-IN")}</p>
            </div>
          </div>
          <table className="w-full border border-slate-400 mb-4 text-[10px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-400 p-1">S.No</th>
                <th className="border border-slate-400 p-1 text-left">Product</th>
                <th className="border border-slate-400 p-1">Batch</th>
                <th className="border border-slate-400 p-1">Qty</th>
                <th className="border border-slate-400 p-1">Rate</th>
                <th className="border border-slate-400 p-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(activeReturn.items || []).map((it, i) => (
                <tr key={i}>
                  <td className="border border-slate-400 p-1 text-center">{i + 1}</td>
                  <td className="border border-slate-400 p-1 font-bold">{it.name}</td>
                  <td className="border border-slate-400 p-1 text-center">{it.batch || "—"}</td>
                  <td className="border border-slate-400 p-1 text-center">{it.qty}</td>
                  <td className="border border-slate-400 p-1 text-right">₹{it.selling_price}</td>
                  <td className="border border-slate-400 p-1 text-right">₹{(parseFloat(it.selling_price || 0) * parseInt(it.qty || 0) * (1 + (it.gst || 0) / 100)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right text-sm space-y-1">
            <p>Subtotal: ₹{activeReturn.subtotal?.toFixed(2)}</p>
            <p>GST: ₹{activeReturn.gstAmount?.toFixed(2)}</p>
            <p className="font-bold text-lg mt-1 border-t pt-1">Total: ₹{activeReturn.totalAmount?.toFixed(2)}</p>
          </div>
        </div>
      </main>
    </div>
  );

  // ── CREATE ──
  if (view === "create") return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">New Purchase Return</h1>
            <p className="text-sm text-slate-500 mt-1">Create a debit note for goods returned to supplier</p>
          </div>
          <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-semibold cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Supplier *</label>
                  <input list="pr-sup" value={supplierName} onChange={e => setSupplierName(e.target.value)} className="form-input" />
                  <datalist id="pr-sup">{suppliers.map(s => <option key={s.id} value={s.name} />)}</datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">PO No</label>
                  <input value={originalPoNo} onChange={e => setOriginalPoNo(e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reason</label>
                  <select value={reason} onChange={e => setReason(e.target.value)} className="form-input bg-white">
                    <option value="">Select</option>
                    <option>Damaged</option>
                    <option>Wrong item</option>
                    <option>Near expiry</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="text-left">Item</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>GST%</th>
                      <th className="text-right">Amt</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((ri, i) => (
                      <tr key={i}>
                        <td>
                          <input list={`pri-${i}`} value={ri.name} onChange={e => handleItemSelect(i, e.target.value)} className="form-input" />
                          <datalist id={`pri-${i}`}>{items.map(it => <option key={it.id} value={`${it.name}${it.batch ? ' | Batch: ' + it.batch : ''}`} />)}</datalist>
                        </td>
                        <td>
                          <input type="number" min="1" value={ri.qty} onChange={e => { const u = [...returnItems]; u[i].qty = e.target.value; setReturnItems(u) }} className="w-16 border border-slate-200 rounded px-2 py-1.5 text-sm text-center" />
                        </td>
                        <td>
                          <input type="number" value={ri.selling_price} onChange={e => { const u = [...returnItems]; u[i].selling_price = e.target.value; setReturnItems(u) }} className="w-20 border border-slate-200 rounded px-2 py-1.5 text-sm" />
                        </td>
                        <td>
                          <input type="number" value={ri.gst} onChange={e => { const u = [...returnItems]; u[i].gst = e.target.value; setReturnItems(u) }} className="w-16 border border-slate-200 rounded px-2 py-1.5 text-sm text-center" />
                        </td>
                        <td className="text-right font-semibold">₹{(parseFloat(ri.selling_price || 0) * parseInt(ri.qty || 0) * (1 + (ri.gst || 0) / 100)).toFixed(2)}</td>
                        <td>
                          {returnItems.length > 1 && (
                            <button onClick={() => setReturnItems(returnItems.filter((_, idx) => idx !== i))} className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setReturnItems([...returnItems, { name: "", batch: "", qty: 1, selling_price: 0, gst: 12 }])} className="flex items-center gap-1.5 text-teal-600 hover:text-teal-800 text-sm font-semibold mt-3 cursor-pointer">
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 h-fit">
            <h2 className="font-semibold text-slate-700 mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>GST</span><span>₹{gstAmt.toFixed(2)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-red-600 text-lg"><span>Total</span><span>₹{(subtotal + gstAmt).toFixed(2)}</span></div>
            </div>
            <button onClick={handleSubmit} className="w-full mt-4 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold text-sm shadow-sm hover:shadow transition cursor-pointer">
              <Send className="w-4 h-4" /> Issue Debit Note
            </button>
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
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Purchase Returns</h1>
            <p className="text-sm text-slate-500 mt-1">Debit Notes for goods returned to suppliers</p>
          </div>
          <button onClick={() => { setReturnItems([{ name: "", batch: "", qty: 1, selling_price: 0, gst: 12 }]); setSupplierName(""); setView("create") }} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer">
            <Plus className="w-4.5 h-4.5" /> New Return
          </button>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Debit Note</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.map(r => (
                <tr key={r.id}>
                  <td className="font-mono text-red-600 font-bold">{r.returnNo}</td>
                  <td className="font-semibold text-slate-900">{r.supplierName}</td>
                  <td className="text-slate-500">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="text-slate-500">{r.items?.length || 0}</td>
                  <td className="font-bold text-red-600">₹{r.totalAmount}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setActiveReturn(r); setView("preview") }} className="text-teal-600 hover:text-teal-800 text-xs font-semibold cursor-pointer flex items-center gap-1">
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
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No purchase returns yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
