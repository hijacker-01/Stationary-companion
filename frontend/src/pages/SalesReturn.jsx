import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

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
    axios.get("http://localhost:5000/api/sales-return", { headers: headers() })
      .then(r => setReturns(r.data));

  const fetchBills = () =>
    axios.get("http://localhost:5000/api/billing", { headers: headers() })
      .then(r => setBills(r.data));

  useEffect(() => { fetchReturns(); fetchBills(); }, []);

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
    if (items.length === 0) return alert("Select at least one item to return");
    try {
      const res = await axios.post("http://localhost:5000/api/sales-return", {
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
      }, { headers: headers() });
      setActiveReturn(res.data);
      setView("preview");
      fetchReturns();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create return");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this return? Stock will be reversed.")) return;
    await axios.delete(`http://localhost:5000/api/sales-return/${id}`, { headers: headers() });
    fetchReturns();
  };

  // ── PREVIEW ──
  if (view === "preview" && activeReturn) return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button onClick={() => { setView("list"); setSelectedBill(null); setActiveReturn(null); }} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">🖨️ Print Credit Note</button>
        </div>
        <div className="bg-white rounded max-w-[210mm] mx-auto p-8 shadow-lg text-xs font-sans">
          <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
            <h1 className="text-xl font-extrabold uppercase">CREDIT NOTE</h1>
            <p className="text-sm text-gray-500">Sales Return</p>
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
          <table className="w-full border border-gray-400 mb-4 text-[10px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="border-r border-gray-400 p-1">S.No</th>
                <th className="border-r border-gray-400 p-1 text-left">Product</th>
                <th className="border-r border-gray-400 p-1">Batch</th>
                <th className="border-r border-gray-400 p-1">Qty</th>
                <th className="border-r border-gray-400 p-1">Rate</th>
                <th className="border-r border-gray-400 p-1">GST%</th>
                <th className="p-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(activeReturn.items || []).map((it, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="border-r border-gray-400 p-1 text-center">{i+1}</td>
                  <td className="border-r border-gray-400 p-1 font-bold">{it.name}</td>
                  <td className="border-r border-gray-400 p-1 text-center">{it.batch || "—"}</td>
                  <td className="border-r border-gray-400 p-1 text-center">{it.qty}</td>
                  <td className="border-r border-gray-400 p-1 text-right">{it.selling_price || it.mrp}</td>
                  <td className="border-r border-gray-400 p-1 text-center">{it.gst}%</td>
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
          {activeReturn.reason && <p className="mt-3 text-xs text-gray-500">Reason: {activeReturn.reason}</p>}
          <p className="text-center text-xs text-gray-400 mt-6 italic">This is a computer generated credit note.</p>
        </div>
      </main>
    </div>
  );

  // ── CREATE ──
  if (view === "create" && selectedBill) return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">↩️ New Sales Return</h1>
            <p className="text-sm text-gray-500">Against Bill: <span className="font-mono font-bold text-blue-600">{selectedBill.billNo}</span> — {selectedBill.customerName}</p>
          </div>
          <button onClick={() => setView("list")} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <h2 className="font-semibold text-gray-700 mb-4">Select Items to Return</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left">Select</th>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-left">Batch</th>
                <th className="px-3 py-2 text-center">Billed Qty</th>
                <th className="px-3 py-2 text-center">Return Qty</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">Credit Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {returnItems.map((item, i) => {
                const base = parseFloat(item.selling_price || item.mrp || 0) * parseInt(item.returnQty || 0);
                const amt = base + (base * (item.gst || 0) / 100);
                return (
                  <tr key={i} className={item.selected ? "bg-green-50" : ""}>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={item.selected || false}
                        onChange={e => {
                          const u = [...returnItems]; u[i].selected = e.target.checked;
                          if (!e.target.checked) u[i].returnQty = 0;
                          setReturnItems(u);
                        }}
                        className="w-4 h-4 accent-green-600"
                      />
                    </td>
                    <td className="px-3 py-2 font-semibold">{item.name}</td>
                    <td className="px-3 py-2 font-mono text-gray-500">{item.batch || "—"}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{item.qty}</td>
                    <td className="px-3 py-2 text-center">
                      <input type="number" min="0" max={item.qty}
                        value={item.returnQty || 0}
                        disabled={!item.selected}
                        onChange={e => {
                          const u = [...returnItems];
                          u[i].returnQty = Math.min(parseInt(e.target.value) || 0, item.qty);
                          setReturnItems(u);
                        }}
                        className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center disabled:bg-gray-50"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">₹{item.selling_price || item.mrp}</td>
                    <td className="px-3 py-2 text-right font-semibold text-green-600">
                      {item.selected && item.returnQty > 0 ? `₹${amt.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-700 mb-3">Return Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Reason for Return</label>
                <select value={reason} onChange={e => setReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
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
                  className="w-4 h-4 accent-blue-600" />
                <label htmlFor="restock" className="text-sm text-gray-700">
                  ✅ Add returned items back to inventory stock
                </label>
              </div>
              {!restock && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
                  ⚠️ Items will NOT be restocked (e.g., damaged/expired goods going to disposal)
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-700 mb-3">Credit Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-600"><span>GST</span><span>₹{gstAmount.toFixed(2)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-green-600 text-lg">
                <span>Credit Amount</span><span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={handleSubmit}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm shadow">
              ✅ Issue Credit Note
            </button>
          </div>
        </div>
      </main>
    </div>
  );

  // ── LIST ──
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">↩️ Sales Returns</h1>
            <p className="text-sm text-gray-500 mt-1">Credit Notes issued for returned goods</p>
          </div>
          <button onClick={() => setView("select-bill")}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow">
            + New Return
          </button>
        </div>

        {view === "select-bill" && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="font-semibold text-gray-700 mb-3">Select Original Bill</h2>
            <input type="text" placeholder="🔍 Search by bill no or customer..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {bills.filter(b =>
                b.billNo?.toLowerCase().includes(search.toLowerCase()) ||
                b.customerName?.toLowerCase().includes(search.toLowerCase())
              ).map(b => (
                <div key={b.id} className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="font-mono font-bold text-blue-600">{b.billNo}</p>
                    <p className="text-sm text-gray-700">{b.customerName}</p>
                    <p className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleDateString("en-IN")} · ₹{b.total}</p>
                  </div>
                  <button onClick={() => handleSelectBill(b)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700">
                    Select →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 text-left">Return No</th>
                <th className="px-6 py-4 text-left">Customer</th>
                <th className="px-6 py-4 text-left">Against Bill</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Items</th>
                <th className="px-6 py-4 text-left">Credit Amt</th>
                <th className="px-6 py-4 text-left">Restocked</th>
                <th className="px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {returns.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-green-600 font-bold">{r.returnNo}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{r.customerName}</td>
                  <td className="px-6 py-4 font-mono text-blue-600">{r.originalBillNo || "—"}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-6 py-4 text-gray-500">{r.items?.length || 0} items</td>
                  <td className="px-6 py-4 font-bold text-green-600">₹{r.totalAmount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.restockItems ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {r.restockItems ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-3">
                    <button onClick={() => { setActiveReturn(r); setView("preview"); }} className="text-blue-600 hover:underline text-xs">View</button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
              {returns.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No sales returns yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
