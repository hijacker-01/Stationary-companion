import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { 
  Search, Package, DollarSign, AlertTriangle, AlertCircle, 
  Trash2, Edit3, Settings, Plus, Play, Info, ArrowUpRight, ArrowDownLeft 
} from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const empty = { name: "", batch: "", hsn: "", pack: "", category: "", company: "", stock_qty: "", scheme_qty: "", unit: "strips", expiry: "", location: "", mrp: "", selling_price: "", cost_price: "", purchaseScheme: "", schedule: "None", reorderPoint: 10 };
const emptyAdj = { itemId: "", itemName: "", batch: "", type: "increase", quantity: 1, reason: "audit", note: "" };

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [allSchemes, setAllSchemes] = useState([]);
  const [adjForm, setAdjForm] = useState(emptyAdj);
  const [showAdjModal, setShowAdjModal] = useState(false);

  const fetchItems = () => {
    axios.get("http://localhost:5000/api/items", { headers: headers() })
      .then(res => setItems(res.data));
  };

  const fetchSchemes = () =>
    axios.get("http://localhost:5000/api/schemes", { headers: headers() })
      .then(res => setAllSchemes(res.data)).catch(() => {});

  useEffect(() => { fetchItems(); fetchSchemes(); }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.expiry) return alert("Name and Expiry are required");
    if (editId) {
      await axios.put(`http://localhost:5000/api/items/${editId}`, form, { headers: headers() });
    } else {
      await axios.post("http://localhost:5000/api/items", form, { headers: headers() });
    }
    setShowModal(false);
    setForm(empty);
    setEditId(null);
    fetchItems();
  };

  const handleEdit = (item) => {
    setForm({ 
      ...item, 
      expiry: item.expiry?.split("T")[0],
      schedule: item.schedule || "None",
      reorderPoint: item.reorderPoint || 10
    });
    setEditId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await axios.delete(`http://localhost:5000/api/items/${id}`, { headers: headers() });
    fetchItems();
  };

  const openAdjustment = (item) => {
    setAdjForm({
      itemId: item.id,
      itemName: item.name,
      batch: item.batch || "",
      type: "increase",
      quantity: 1,
      reason: "audit",
      note: ""
    });
    setShowAdjModal(true);
  };

  const handleAdjustmentSubmit = async () => {
    if (!adjForm.quantity || parseInt(adjForm.quantity) <= 0) {
      return alert("Please specify a valid positive quantity");
    }
    try {
      await axios.post("http://localhost:5000/api/stock-adjust", adjForm, { headers: headers() });
      setShowAdjModal(false);
      setAdjForm(emptyAdj);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit stock adjustment");
    }
  };

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.batch?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = items.filter(i => i.stock_qty > 0 && i.stock_qty <= (i.reorderPoint || 10));
  const outOfStockItems = items.filter(i => i.stock_qty <= 0);
  const totalStockValue = items.reduce((sum, i) => sum + (i.stock_qty * (i.selling_price || i.mrp || 0)), 0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventory Stock</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and track your products, stock counts, and compliance drug schedules.</p>
          </div>
          <button
            onClick={() => { setForm(empty); setEditId(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            Add New Item
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total Items", value: items.length, icon: Package, borderColor: "border-teal-500", color: "text-teal-600 bg-teal-50" },
            { label: "Stock Value", value: `₹${totalStockValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, borderColor: "border-emerald-500", color: "text-emerald-600 bg-emerald-50" },
            { label: "Low Stock Alert", value: lowStockItems.length, icon: AlertTriangle, borderColor: "border-amber-500", color: "text-amber-600 bg-amber-50" },
            { label: "Out of Stock", value: outOfStockItems.length, icon: AlertCircle, borderColor: "border-rose-500", color: "text-rose-600 bg-rose-50" },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className={`bg-white border-l-4 ${c.borderColor} border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between`}>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{c.value}</p>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-1">{c.label}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${c.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name, batch number, or manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Batch</th>
                <th>HSN</th>
                <th>Pack</th>
                <th>Category</th>
                <th>Company</th>
                <th>Stock Qty</th>
                <th>Scheme Qty</th>
                <th>Total Qty</th>
                <th>MRP</th>
                <th>Expiry</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} className={item.stock_qty <= 0 ? "bg-rose-50/20" : ""}>
                  <td className="text-slate-400 font-medium">{i + 1}</td>
                  <td>
                    <span className="font-semibold text-slate-900">{item.name}</span>
                    {item.schedule && item.schedule !== "None" && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 uppercase">
                        Schedule {item.schedule}
                      </span>
                    )}
                    {item.purchaseScheme && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Scheme: {item.purchaseScheme}
                      </span>
                    )}
                  </td>
                  <td className="text-slate-600 font-medium">{item.batch || "—"}</td>
                  <td className="text-slate-500">{item.hsn || "—"}</td>
                  <td className="text-slate-500">{item.pack || "—"}</td>
                  <td className="text-slate-500">{item.category || "—"}</td>
                  <td>
                    {item.company ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.company}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      item.stock_qty <= 0
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : item.stock_qty <= (item.reorderPoint || 10)
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      {item.stock_qty} {item.unit}
                    </span>
                    {item.stock_qty <= 0 && (
                      <span className="ml-2 text-rose-600 text-[10px] font-bold uppercase tracking-wider">Out of Stock</span>
                    )}
                    {item.stock_qty > 0 && item.stock_qty <= (item.reorderPoint || 10) && (
                      <span className="ml-2 text-amber-600 text-[10px] font-bold uppercase tracking-wider">Low</span>
                    )}
                  </td>
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                      {item.scheme_qty || 0}
                    </span>
                  </td>
                  <td>
                    <span className="font-bold text-slate-800">
                      {(item.stock_qty || 0) + (item.scheme_qty || 0)}
                    </span>
                    <span className="text-slate-400 text-xs ml-1">{item.unit}</span>
                  </td>
                  <td className="text-slate-900 font-bold">₹{(item.selling_price || item.mrp || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="text-slate-600">
                    {item.expiry ? new Date(item.expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => handleEdit(item)} className="text-teal-600 hover:text-teal-800 text-xs font-semibold cursor-pointer">Edit</button>
                      <button onClick={() => openAdjustment(item)} className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold cursor-pointer">Adjust</button>
                      <button onClick={() => handleDelete(item.id)} className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={13} className="text-center py-12 text-slate-400 font-medium">
                    No products matching filter. Add your first item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <h2 className="text-xl font-bold text-slate-900 mb-5">
                {editId ? "Edit Item Record" : "Add New Item to Inventory"}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "name", label: "Item Name *", type: "text" },
                  { key: "batch", label: "Batch Number", type: "text" },
                  { key: "hsn", label: "HSN Code", type: "text" },
                  { key: "pack", label: "Packaging (e.g. 10x10 Table)", type: "text" },
                  { key: "category", label: "Category", type: "text" },
                  { key: "company", label: "Company / Brand Name", type: "text" },
                  { key: "stock_qty", label: "Initial Stock Quantity", type: "number" },
                  { key: "scheme_qty", label: "Initial Scheme Quantity", type: "number" },
                  { key: "unit", label: "Unit (e.g. Strips, Bottles)", type: "text" },
                  { key: "expiry", label: "Expiry Date *", type: "date" },
                  { key: "location", label: "Warehouse Location/Rack", type: "text" },
                  { key: "selling_price", label: "Selling Price (₹)", type: "number" },
                  { key: "mrp", label: "MRP (₹)", type: "number" },
                  { key: "cost_price", label: "Cost Price (₹)", type: "number" }
                ].map(f => (
                  <div key={f.key} className={f.key === "name" ? "col-span-2" : ""}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="form-input"
                    />
                  </div>
                ))}

                {/* Purchase Scheme Field */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Purchase Scheme Note
                  </label>
                  <input
                    type="text"
                    list="scheme-suggestions"
                    placeholder="e.g. Buy 10 Get 2 Free, 15% discount, etc."
                    value={form.purchaseScheme}
                    onChange={(e) => setForm({ ...form, purchaseScheme: e.target.value })}
                    className="form-input"
                  />
                  <datalist id="scheme-suggestions">
                    {allSchemes.filter(s => s.isActive).map(s => (
                      <option key={s.id} value={
                        s.type === "buy_get_free"
                          ? `${s.name} - Buy ${s.buyQty} Get ${s.freeQty} Free (${s.company})`
                          : `${s.name} - ${s.discountPercent}% Off (${s.company})`
                      } />
                    ))}
                  </datalist>
                  {form.company && allSchemes.filter(s => s.isActive && s.company.toLowerCase() === (form.company || "").toLowerCase()).length > 0 && (
                    <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Available Schemes from {form.company}:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allSchemes.filter(s => s.isActive && s.company.toLowerCase() === (form.company || "").toLowerCase()).map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setForm({ ...form, purchaseScheme:
                              s.type === "buy_get_free"
                                ? `Buy ${s.buyQty} Get ${s.freeQty} Free`
                                : `${s.discountPercent}% Off`
                            })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer border border-emerald-200"
                          >
                            {s.type === "buy_get_free" ? `Buy ${s.buyQty}+${s.freeQty} Free` : `${s.discountPercent}% Off`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Drug Schedule Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Drug Schedule</label>
                  <select
                    value={form.schedule || "None"}
                    onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                    className="form-input bg-white"
                  >
                    <option value="None">None (General)</option>
                    <option value="H">Schedule H</option>
                    <option value="H1">Schedule H1</option>
                    <option value="X">Schedule X</option>
                  </select>
                </div>

                {/* Reorder Point Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reorder Level (Min Qty)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10"
                    value={form.reorderPoint || ""}
                    onChange={(e) => setForm({ ...form, reorderPoint: parseInt(e.target.value) || 0 })}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleSubmit} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                  {editId ? "Update Item" : "Add Item"}
                </button>
                <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stock Adjustment Modal */}
        {showAdjModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-900">Stock Level Adjustment</h2>
                <button onClick={() => setShowAdjModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">&times;</button>
              </div>
              
              <div className="bg-teal-50 border border-teal-100 rounded-lg p-3.5 mb-4 text-xs">
                <p className="font-semibold text-teal-800">Product: {adjForm.itemName}</p>
                {adjForm.batch && <p className="text-teal-600 mt-1 font-medium">Batch No: {adjForm.batch}</p>}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Adjustment Direction</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjForm({ ...adjForm, type: "increase" })}
                      className={`py-2 rounded-lg text-sm font-semibold border cursor-pointer transition-all duration-150 ${adjForm.type === "increase" ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      Add Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjForm({ ...adjForm, type: "decrease" })}
                      className={`py-2 rounded-lg text-sm font-semibold border cursor-pointer transition-all duration-150 ${adjForm.type === "decrease" ? "bg-rose-50 border-rose-500 text-rose-700 font-bold" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      Deduct Stock
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Adjustment Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={adjForm.quantity}
                    onChange={(e) => setAdjForm({ ...adjForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Audit Reason</label>
                  <select
                    value={adjForm.reason}
                    onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                    className="form-input bg-white"
                  >
                    <option value="audit">Physical Verification Audit</option>
                    <option value="damage">Damaged Goods</option>
                    <option value="theft">Theft / Missing</option>
                    <option value="expiry">Expired Stock Disposal</option>
                    <option value="other">Other / Correction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Detailed Remarks</label>
                  <textarea
                    rows="3"
                    value={adjForm.note}
                    placeholder="Provide compliance or audit comments..."
                    onChange={(e) => setAdjForm({ ...adjForm, note: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAdjustmentSubmit}
                  className={`flex-1 text-white py-2.5 rounded-lg text-sm font-semibold shadow-sm cursor-pointer transition ${adjForm.type === "increase" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
                >
                  Confirm Adjustment
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdjModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
                >
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