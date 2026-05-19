import { useEffect, useState, Fragment } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });
const GST_RATES = [0, 5, 12, 18, 28];

const emptySupplier = { name:"", phone:"", email:"", address:"", gstNumber:"", panNumber:"", contactPerson:"", creditLimit:0, creditDays:30 };
const emptyItem = { name:"", batch:"", category:"", qty:1, schemeQty:0, unit:"units", mrp:"", costPrice:"", gst:12, expiry:"" };

const STATUS_COLOR = {
  pending:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  received:  "bg-green-100 text-green-700 border-green-200",
  partial:   "bg-blue-100 text-blue-700 border-blue-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default function Suppliers() {
  const [tab, setTab] = useState("suppliers");
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showSupModal, setShowSupModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [supForm, setSupForm] = useState(emptySupplier);
  const [editSupId, setEditSupId] = useState(null);
  const [poItems, setPoItems] = useState([{ ...emptyItem }]);
  const [poSupplier, setPoSupplier] = useState("");
  const [poExpected, setPoExpected] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poPayMode, setPoPayMode] = useState("credit");
  const [activeOrder, setActiveOrder] = useState(null);
  const [receiveAmount, setReceiveAmount] = useState(0);
  const [search, setSearch] = useState("");
  const [allSchemes, setAllSchemes] = useState([]);
  const [poItemSchemes, setPoItemSchemes] = useState({});

  const fetchSuppliers = () =>
    axios.get("http://localhost:5000/api/suppliers", { headers: headers() }).then(r => setSuppliers(r.data));
  const fetchOrders = () =>
    axios.get("http://localhost:5000/api/suppliers/orders", { headers: headers() }).then(r => setOrders(r.data));
  const fetchSchemes = () =>
    axios.get("http://localhost:5000/api/schemes", { headers: headers() }).then(r => setAllSchemes(r.data));

  useEffect(() => { fetchSuppliers(); fetchOrders(); fetchSchemes(); }, []);

  // Check scheme for a PO item
  const checkPOScheme = async (index, itemName, qty) => {
    if (!itemName) {
      setPoItemSchemes(prev => { const n = { ...prev }; delete n[index]; return n; });
      return;
    }
    try {
      const res = await axios.get("http://localhost:5000/api/schemes/check", {
        params: { itemName, qty },
        headers: headers(),
      });
      setPoItemSchemes(prev => ({ ...prev, [index]: res.data }));
    } catch {
      setPoItemSchemes(prev => { const n = { ...prev }; delete n[index]; return n; });
    }
  };

  // PO Calculations
  const subtotal = poItems.reduce((s, i) => s + parseFloat(i.costPrice || 0) * parseInt(i.qty || 1), 0);
  const gstTotal = poItems.reduce((s, i) => {
    const base = parseFloat(i.costPrice || 0) * parseInt(i.qty || 1);
    return s + (base * i.gst) / 100;
  }, 0);
  const total = subtotal + gstTotal;

  const handleSaveSupplier = async () => {
    if (!supForm.name) return alert("Supplier name required");
    try {
      if (editSupId) {
        await axios.put(`http://localhost:5000/api/suppliers/${editSupId}`, supForm, { headers: headers() });
      } else {
        await axios.post("http://localhost:5000/api/suppliers", supForm, { headers: headers() });
      }
      setShowSupModal(false); setSupForm(emptySupplier); setEditSupId(null);
      fetchSuppliers();
    } catch(err) { alert(err.response?.data?.error || "Error"); }
  };

  const handleSavePO = async () => {
    if (!poSupplier) return alert("Select a supplier");
    const sup = suppliers.find(s => s.name === poSupplier);
    try {
      await axios.post("http://localhost:5000/api/suppliers/orders", {
        supplierId: sup?.id,
        supplierName: poSupplier,
        items: poItems.filter(i => i.name),
        subtotal: parseFloat(subtotal.toFixed(2)),
        gstAmount: parseFloat(gstTotal.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        balanceDue: parseFloat(total.toFixed(2)),
        paymentMode: poPayMode,
        expectedDate: poExpected || null,
        notes: poNotes,
        status: "pending",
      }, { headers: headers() });
      setShowPOModal(false);
      setPoItems([{ ...emptyItem }]);
      setPoSupplier(""); setPoNotes(""); setPoExpected("");
      setPoItemSchemes({});
      fetchOrders();
    } catch(err) { alert(err.response?.data?.error || "Error"); }
  };

  const handleReceive = async () => {
    try {
      await axios.put(`http://localhost:5000/api/suppliers/orders/${activeOrder.id}/receive`,
        { amountPaid: parseFloat(receiveAmount) },
        { headers: headers() }
      );
      setShowReceiveModal(false); setActiveOrder(null); setReceiveAmount(0);
      fetchOrders();
    } catch(err) { alert(err.response?.data?.error || "Error"); }
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm("Delete supplier?")) return;
    await axios.delete(`http://localhost:5000/api/suppliers/${id}`, { headers: headers() });
    fetchSuppliers();
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Delete this purchase order?")) return;
    await axios.delete(`http://localhost:5000/api/suppliers/orders/${id}`, { headers: headers() });
    fetchOrders();
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🏭 Suppliers & Purchase Orders</h1>
            <p className="text-sm text-gray-500 mt-1">Manage suppliers and incoming stock orders</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setSupForm(emptySupplier); setEditSupId(null); setShowSupModal(true); }}
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm">
              + Add Supplier
            </button>
            <button onClick={() => setShowPOModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow">
              + New Purchase Order
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Suppliers", value: suppliers.length, icon: "🏭", color: "bg-blue-600" },
            { label: "Total Orders", value: orders.length, icon: "📋", color: "bg-indigo-600" },
            { label: "Pending Orders", value: orders.filter(o=>o.status==="pending").length, icon: "⏳", color: "bg-yellow-500" },
            { label: "Amount Due", value: `₹${orders.reduce((s,o)=>s+(o.balanceDue||0),0).toFixed(2)}`, icon: "💸", color: "bg-red-500" },
          ].map(c => (
            <div key={c.label} className={`${c.color} text-white rounded-2xl p-5 shadow`}>
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-sm opacity-80 mt-1">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[{key:"suppliers",label:"🏭 Suppliers"},{key:"orders",label:"📋 Purchase Orders"}].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                tab === t.key ? "bg-blue-600 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── SUPPLIERS LIST ── */}
        {tab === "suppliers" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow p-4">
              <input type="text" placeholder="🔍 Search suppliers..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map(sup => (
                <div key={sup.id} className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {sup.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{sup.name}</p>
                        <p className="text-gray-400 text-xs">{sup.contactPerson || "—"}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      sup.status === "active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                    }`}>{sup.status}</span>
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                    {sup.phone && <p>📞 {sup.phone}</p>}
                    {sup.email && <p>📧 {sup.email}</p>}
                    {sup.gstNumber && <p>🏛️ {sup.gstNumber}</p>}
                    <p>💳 Credit: ₹{sup.creditLimit} / {sup.creditDays} days</p>
                    {sup.balance > 0 && <p className="text-red-500 font-semibold">💸 Due: ₹{sup.balance}</p>}
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => { setSupForm(sup); setEditSupId(sup.id); setShowSupModal(true); }}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg text-xs font-semibold">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDeleteSupplier(sup.id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 py-2 rounded-lg text-xs font-semibold">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
              {filteredSuppliers.length === 0 && (
                <div className="col-span-3 text-center py-16 text-gray-400">
                  <div className="text-5xl mb-3">🏭</div>
                  <p>No suppliers yet. Add your first supplier!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ORDERS LIST ── */}
        {tab === "orders" && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-6 py-4 text-left">PO Number</th>
                  <th className="px-6 py-4 text-left">Supplier</th>
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left">Items</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-right">Balance Due</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-blue-600 text-xs font-medium">{o.poNumber}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{o.supplierName}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(o.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{o.items?.length || 0} items</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-800">₹{o.total}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-500">₹{o.balanceDue || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_COLOR[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      {o.status === "pending" && (
                        <button onClick={() => { setActiveOrder(o); setReceiveAmount(o.total); setShowReceiveModal(true); }}
                          className="text-green-600 hover:underline text-xs font-medium">
                          ✅ Receive
                        </button>
                      )}
                      <button onClick={() => handleDeleteOrder(o.id)}
                        className="text-red-500 hover:underline text-xs font-medium">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">No purchase orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── SUPPLIER MODAL ── */}
        {showSupModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">{editSupId ? "Edit" : "Add"} Supplier</h2>
                <button onClick={() => setShowSupModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key:"name", label:"Supplier Name *", placeholder:"Company name" },
                  { key:"contactPerson", label:"Contact Person", placeholder:"Name" },
                  { key:"phone", label:"Phone", placeholder:"Mobile" },
                  { key:"email", label:"Email", placeholder:"email@co.com" },
                  { key:"gstNumber", label:"GST Number", placeholder:"GSTIN" },
                  { key:"panNumber", label:"PAN Number", placeholder:"PAN" },
                  { key:"creditLimit", label:"Credit Limit ₹", placeholder:"0" },
                  { key:"creditDays", label:"Credit Days", placeholder:"30" },
                ].map(f => (
                  <div key={f.key} className={f.key==="name"?"col-span-2":""}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                    <input type="text" placeholder={f.placeholder}
                      value={supForm[f.key] || ""}
                      onChange={e => setSupForm({ ...supForm, [f.key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                  <textarea rows={2} placeholder="Full address"
                    value={supForm.address || ""}
                    onChange={e => setSupForm({ ...supForm, address: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleSaveSupplier}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm">
                  {editSupId ? "Update" : "Add"} Supplier
                </button>
                <button onClick={() => setShowSupModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PO MODAL ── */}
        {showPOModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">New Purchase Order</h2>
                <button onClick={() => setShowPOModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>

              {/* Supplier + Details */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Supplier *</label>
                  <input list="sup-list" value={poSupplier} onChange={e => setPoSupplier(e.target.value)}
                    placeholder="Select or type supplier"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <datalist id="sup-list">
                    {suppliers.map(s => <option key={s.id} value={s.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expected Date</label>
                  <input type="date" value={poExpected} onChange={e => setPoExpected(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Mode</label>
                  <select value={poPayMode} onChange={e => setPoPayMode(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {["cash","upi","card","credit"].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Supplier Schemes Banner */}
              {(() => {
                const supplierSchemes = allSchemes.filter(s => s.isActive && poSupplier && (
                  s.company.toLowerCase() === poSupplier.toLowerCase()
                ));
                if (supplierSchemes.length === 0) return null;
                return (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                      🎁 Schemes available from {poSupplier}
                      <span className="text-xs font-normal text-green-600">({supplierSchemes.length} active)</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {supplierSchemes.map(s => (
                        <span key={s.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          s.type === "buy_get_free"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-orange-100 text-orange-700 border border-orange-200"
                        }`}>
                          {s.type === "buy_get_free"
                            ? `🎁 ${s.name}: Buy ${s.buyQty} Get ${s.freeQty} Free`
                            : `💰 ${s.name}: ${s.discountPercent}% Off`}
                          {s.applicableItems?.length > 0 && (
                            <span className="opacity-70">({s.applicableItems.join(", ")})</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Items */}
              <table className="w-full text-sm mb-3">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-2 py-2 text-left">Item Name</th>
                    <th className="px-2 py-2 text-left">Batch</th>
                    <th className="px-2 py-2 text-left">Qty</th>
                    <th className="px-2 py-2 text-left">Scheme Qty</th>
                    <th className="px-2 py-2 text-left">Unit</th>
                    <th className="px-2 py-2 text-left">Cost ₹</th>
                    <th className="px-2 py-2 text-left">MRP ₹</th>
                    <th className="px-2 py-2 text-left">GST%</th>
                    <th className="px-2 py-2 text-left">Expiry</th>
                    <th className="px-2 py-2 text-left">Amount</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {poItems.map((item, i) => {
                    const base = parseFloat(item.costPrice||0)*parseInt(item.qty||1);
                    const amt = (base + (base*item.gst)/100).toFixed(2);
                    const schemes = poItemSchemes[i] || [];
                    return (
                      <Fragment key={i}>
                        <tr>
                          {["name","batch","qty","schemeQty","unit","costPrice","mrp"].map(f => (
                            <td key={f} className="px-1 py-1">
                              <input type={["qty","schemeQty","costPrice","mrp"].includes(f)?"number":"text"}
                                value={item[f]} placeholder={f}
                                onChange={e => {
                                  const u=[...poItems]; u[i]={...u[i],[f]:e.target.value}; setPoItems(u);
                                  if (f === "name") checkPOScheme(i, e.target.value, u[i].qty);
                                  if (f === "qty") checkPOScheme(i, u[i].name, e.target.value);
                                }}
                                className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                            </td>
                          ))}
                          <td className="px-1 py-1">
                            <select value={item.gst}
                              onChange={e => { const u=[...poItems]; u[i]={...u[i],gst:e.target.value}; setPoItems(u); }}
                              className="border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none">
                              {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                            </select>
                          </td>
                          <td className="px-1 py-1">
                            <input type="date" value={item.expiry}
                              onChange={e => { const u=[...poItems]; u[i]={...u[i],expiry:e.target.value}; setPoItems(u); }}
                              className="border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none" />
                          </td>
                          <td className="px-2 py-1 text-xs font-semibold text-gray-700">₹{amt}</td>
                          <td className="px-1 py-1">
                            {poItems.length > 1 && (
                              <button onClick={() => {
                                setPoItems(poItems.filter((_,idx)=>idx!==i));
                                setPoItemSchemes(prev => { const n = { ...prev }; delete n[i]; return n; });
                              }}
                                className="text-red-400 hover:text-red-600 text-lg">×</button>
                            )}
                          </td>
                        </tr>
                        {schemes.length > 0 && (
                          <tr className="bg-green-50/70">
                            <td colSpan={10} className="px-3 py-1.5">
                              <div className="flex flex-wrap gap-2">
                                {schemes.map((s, si) => (
                                  <span key={si} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    s.type === "buy_get_free"
                                      ? "bg-green-100 text-green-700 border border-green-200"
                                      : "bg-orange-100 text-orange-700 border border-orange-200"
                                  }`}>
                                    🎁 {s.description}
                                    {s.type === "buy_get_free" && s.totalFreeItems > 0 && (
                                      <span className="font-bold">→ {s.totalFreeItems} FREE</span>
                                    )}
                                    {s.type === "flat_discount" && (
                                      <span className="font-bold">→ {s.discountPercent}% Off</span>
                                    )}
                                    <span className="text-[10px] opacity-70">({s.company})</span>
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
              <button onClick={() => setPoItems([...poItems,{...emptyItem}])}
                className="text-blue-600 text-sm hover:underline font-medium mb-6">+ Add Row</button>

              {/* Totals */}
              <div className="flex justify-end mb-6">
                <div className="w-56 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>GST</span><span>₹{gstTotal.toFixed(2)}</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold text-gray-800 text-base">
                    <span>Total</span><span className="text-green-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea rows={2} value={poNotes} onChange={e => setPoNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>

              <div className="flex gap-3">
                <button onClick={handleSavePO}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm">
                  📋 Create Purchase Order
                </button>
                <button onClick={() => setShowPOModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── RECEIVE MODAL ── */}
        {showReceiveModal && activeOrder && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
              <h2 className="text-lg font-bold text-gray-800 mb-2">✅ Mark Order Received</h2>
              <p className="text-sm text-gray-500 mb-6">
                PO: <span className="font-mono text-blue-600">{activeOrder.poNumber}</span> from {activeOrder.supplierName}
              </p>
              <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-600">Total Amount</span><span className="font-bold">₹{activeOrder.total}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Items</span><span>{activeOrder.items?.length} items</span></div>
              </div>
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount Paid Now ₹</label>
                <input type="number" value={receiveAmount}
                  onChange={e => setReceiveAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <p className="text-xs text-gray-400 mt-1">
                  Balance due: ₹{(activeOrder.total - receiveAmount).toFixed(2)}
                </p>
              </div>
              <p className="text-xs text-blue-600 bg-blue-50 rounded-lg p-3 mb-4">
                📦 All items from this PO will be automatically added to your Inventory.
              </p>
              <div className="flex gap-3">
                <button onClick={handleReceive}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm">
                  ✅ Confirm Received
                </button>
                <button onClick={() => setShowReceiveModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}