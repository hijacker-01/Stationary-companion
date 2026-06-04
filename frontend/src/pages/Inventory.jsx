import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
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
    <div className="flex h-screen bg-[#e5e5e5] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          
          {/* Page Title Bar */}
          <div className="bg-[#1b4985] text-white px-6 py-3 flex items-center justify-between shadow-md flex-shrink-0">
            <div>
              <h1 className="text-lg font-bold tracking-wide">CURRENT STOCK (INVENTORY)</h1>
              <p className="text-xs text-blue-200 opacity-80">Manage products, stock counts, and schedules</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-white/10 px-3 py-1 rounded">Total Items: {items.length}</span>
              <button 
                onClick={() => { setForm(empty); setEditId(null); setShowModal(true); }}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> F2 Add Item
              </button>
            </div>
          </div>

          {/* Tabular Stats Strip */}
          <div className="bg-white border-b border-gray-200 flex text-xs shadow-sm flex-shrink-0 divide-x divide-gray-200">
            <div className="flex-1 px-6 py-2.5 flex justify-between items-center bg-gray-50/50 hover:bg-white">
              <span className="text-gray-500 font-bold uppercase tracking-wider">Total Items</span>
              <span className="text-gray-900 font-black text-sm">{items.length}</span>
            </div>
            <div className="flex-1 px-6 py-2.5 flex justify-between items-center bg-emerald-50/20 hover:bg-emerald-50/50">
              <span className="text-emerald-700 font-bold uppercase tracking-wider">Stock Value</span>
              <span className="text-emerald-900 font-black text-sm">₹{totalStockValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex-1 px-6 py-2.5 flex justify-between items-center bg-amber-50/20 hover:bg-amber-50/50">
              <span className="text-amber-700 font-bold uppercase tracking-wider">Low Stock</span>
              <span className="text-amber-900 font-black text-sm">{lowStockItems.length}</span>
            </div>
            <div className="flex-1 px-6 py-2.5 flex justify-between items-center bg-rose-50/20 hover:bg-rose-50/50">
              <span className="text-rose-700 font-bold uppercase tracking-wider">Out of Stock</span>
              <span className="text-rose-900 font-black text-sm">{outOfStockItems.length}</span>
            </div>
          </div>

          {/* Filter Strip */}
          <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-4 text-xs flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Search</label>
              <div className="flex items-center border border-gray-300 rounded px-2 py-1 bg-white max-w-md w-full">
                <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search by name, batch..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="py-2 px-3 text-left font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-12">#</th>
                  <th className="py-2 px-3 text-left font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Name</th>
                  <th className="py-2 px-3 text-left font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Batch</th>
                  <th className="py-2 px-3 text-left font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">HSN</th>
                  <th className="py-2 px-3 text-left font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Pack</th>
                  <th className="py-2 px-3 text-left font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Category</th>
                  <th className="py-2 px-3 text-left font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Company</th>
                  <th className="py-2 px-3 text-right font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Stock Qty</th>
                  <th className="py-2 px-3 text-right font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Scheme Qty</th>
                  <th className="py-2 px-3 text-right font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Total Qty</th>
                  <th className="py-2 px-3 text-right font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">MRP</th>
                  <th className="py-2 px-3 text-left font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Expiry</th>
                  <th className="py-2 px-3 text-center font-bold text-gray-700 uppercase tracking-wider w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={item.id} className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${item.stock_qty <= 0 ? "bg-red-50/30" : "bg-white"}`}>
                    <td className="py-1.5 px-3 border-r border-gray-200 text-gray-500 font-medium">{i + 1}</td>
                    <td className="py-1.5 px-3 border-r border-gray-200">
                      <span className="font-bold text-gray-900">{item.name}</span>
                      {item.schedule && item.schedule !== "None" && (
                        <span className="ml-2 text-[9px] font-black bg-red-100 text-red-700 px-1 py-0.5 rounded uppercase border border-red-200">
                          Sch {item.schedule}
                        </span>
                      )}
                      {item.purchaseScheme && (
                        <span className="ml-2 text-[9px] font-black bg-green-100 text-green-700 px-1 py-0.5 rounded border border-green-200">
                          {item.purchaseScheme}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 border-r border-gray-200 text-gray-700">{item.batch || "—"}</td>
                    <td className="py-1.5 px-3 border-r border-gray-200 text-gray-700">{item.hsn || "—"}</td>
                    <td className="py-1.5 px-3 border-r border-gray-200 text-gray-700">{item.pack || "—"}</td>
                    <td className="py-1.5 px-3 border-r border-gray-200 text-gray-700">{item.category || "—"}</td>
                    <td className="py-1.5 px-3 border-r border-gray-200 font-medium text-gray-800">{item.company || "—"}</td>
                    <td className="py-1.5 px-3 border-r border-gray-200 text-right">
                      <span className={`font-black ${
                        item.stock_qty <= 0 ? "text-red-600" : item.stock_qty <= (item.reorderPoint || 10) ? "text-amber-600" : "text-green-700"
                      }`}>
                        {item.stock_qty}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 border-r border-gray-200 text-right font-bold text-blue-700">
                      {item.scheme_qty || 0}
                    </td>
                    <td className="py-1.5 px-3 border-r border-gray-200 text-right font-black text-gray-900">
                      {(item.stock_qty || 0) + (item.scheme_qty || 0)} <span className="text-[10px] text-gray-500 font-normal">{item.unit}</span>
                    </td>
                    <td className="py-1.5 px-3 border-r border-gray-200 text-right font-bold text-gray-900">
                      ₹{(item.selling_price || item.mrp || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-1.5 px-3 border-r border-gray-200 text-gray-700">
                      {item.expiry ? new Date(item.expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(item)} className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200">Edit</button>
                        <button onClick={() => openAdjustment(item)} className="text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-700 rounded hover:bg-green-100 border border-green-200">Adj</button>
                        <button onClick={() => handleDelete(item.id)} className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={13} className="text-center py-8 text-gray-500 font-medium bg-white">
                      No products matching filter. Add your first item.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Shortcut Bar */}
          <div className="bg-gray-100 border-t border-gray-200 px-6 py-2.5 flex items-center gap-6 text-xs text-gray-600 font-bold flex-shrink-0 shadow-inner">
            <span><span className="text-[#1b4985] font-black mr-1">F2</span> Add Item</span>
            <span><span className="text-[#1b4985] font-black mr-1">F3</span> Edit Item</span>
            <span><span className="text-red-600 font-black mr-1">Del</span> Delete</span>
            <span><span className="text-[#1b4985] font-black mr-1">Alt+A</span> Adjust Stock</span>
          </div>

        </main>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white shadow-xl w-full max-w-2xl border-t-4 border-[#1b4985] flex flex-col max-h-[90vh]">
              
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center flex-shrink-0">
                <h2 className="text-sm font-black text-[#1b4985] uppercase tracking-wider">
                  {editId ? "Edit Item Record" : "New Item Master"}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-red-600 font-black text-lg leading-none">&times;</button>
              </div>

              <div className="p-4 overflow-y-auto bg-gray-50 grid grid-cols-2 gap-4 text-xs">
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
                    <label className="block font-bold text-[#1b4985] uppercase tracking-wider mb-1 text-[10px]">{f.label}</label>
                    <input
                      type={f.type}
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-[#1b4985] focus:ring-1 focus:ring-[#1b4985] bg-white font-semibold text-gray-900"
                    />
                  </div>
                ))}

                {/* Purchase Scheme Field */}
                <div className="col-span-2 p-3 bg-blue-50/50 border border-blue-100 mt-2">
                  <label className="block font-bold text-[#1b4985] uppercase tracking-wider mb-1 text-[10px]">
                    Purchase Scheme Note (Dropdown)
                  </label>
                  <input
                    type="text"
                    list="scheme-suggestions"
                    placeholder="e.g. Buy 10 Get 2 Free, 15% discount, etc."
                    value={form.purchaseScheme}
                    onChange={(e) => setForm({ ...form, purchaseScheme: e.target.value })}
                    className="w-full border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-[#1b4985] bg-white font-semibold text-gray-900"
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
                    <div className="mt-2 bg-white border border-gray-200 px-3 py-2">
                      <p className="text-[10px] font-bold text-[#1b4985] uppercase mb-1.5">Available Schemes from {form.company}:</p>
                      <div className="flex flex-wrap gap-2">
                        {allSchemes.filter(s => s.isActive && s.company.toLowerCase() === (form.company || "").toLowerCase()).map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setForm({ ...form, purchaseScheme:
                              s.type === "buy_get_free"
                                ? `Buy ${s.buyQty} Get ${s.freeQty} Free`
                                : `${s.discountPercent}% Off`
                            })}
                            className="px-2 py-1 text-[10px] font-black bg-green-100 text-green-800 border border-green-300 uppercase hover:bg-green-200 transition-colors"
                          >
                            {s.type === "buy_get_free" ? `Buy ${s.buyQty}+${s.freeQty} Free` : `${s.discountPercent}% Off`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Drug Schedule Input */}
                <div className="mt-2">
                  <label className="block font-bold text-[#1b4985] uppercase tracking-wider mb-1 text-[10px]">Drug Schedule</label>
                  <select
                    value={form.schedule || "None"}
                    onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                    className="w-full border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-[#1b4985] bg-white font-semibold text-gray-900"
                  >
                    <option value="None">None (General)</option>
                    <option value="H">Schedule H</option>
                    <option value="H1">Schedule H1</option>
                    <option value="X">Schedule X</option>
                  </select>
                </div>

                {/* Reorder Point Input */}
                <div className="mt-2">
                  <label className="block font-bold text-[#1b4985] uppercase tracking-wider mb-1 text-[10px]">Reorder Level (Min Qty)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10"
                    value={form.reorderPoint || ""}
                    onChange={(e) => setForm({ ...form, reorderPoint: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-[#1b4985] bg-white font-semibold text-gray-900"
                  />
                </div>
              </div>

              <div className="bg-gray-100 px-4 py-3 border-t border-gray-300 flex justify-end gap-3 flex-shrink-0">
                <button onClick={() => setShowModal(false)} className="px-4 py-1.5 border border-gray-400 bg-white text-gray-700 font-bold text-xs hover:bg-gray-50">
                  Cancel (Esc)
                </button>
                <button onClick={handleSubmit} className="px-6 py-1.5 bg-[#1b4985] text-white font-bold text-xs hover:bg-blue-900">
                  {editId ? "Update Item" : "Save Item"} (F10)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stock Adjustment Modal */}
        {showAdjModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white shadow-xl w-full max-w-md border-t-4 border-amber-600 flex flex-col">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
                <h2 className="text-sm font-black text-amber-700 uppercase tracking-wider">Stock Level Adjustment</h2>
                <button onClick={() => setShowAdjModal(false)} className="text-gray-500 hover:text-red-600 font-black text-lg leading-none">&times;</button>
              </div>
              
              <div className="p-4 bg-gray-50 text-xs">
                <div className="bg-white border border-gray-300 p-3 mb-4">
                  <p className="font-bold text-gray-900 text-sm">{adjForm.itemName}</p>
                  {adjForm.batch && <p className="text-gray-600 mt-0.5 font-semibold">Batch: {adjForm.batch}</p>}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-[#1b4985] uppercase tracking-wider mb-1 text-[10px]">Adjustment Direction</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdjForm({ ...adjForm, type: "increase" })}
                        className={`py-2 text-xs font-black uppercase tracking-wider border transition-colors ${adjForm.type === "increase" ? "bg-green-100 border-green-600 text-green-800" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-100"}`}
                      >
                        Add Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjForm({ ...adjForm, type: "decrease" })}
                        className={`py-2 text-xs font-black uppercase tracking-wider border transition-colors ${adjForm.type === "decrease" ? "bg-red-100 border-red-600 text-red-800" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-100"}`}
                      >
                        Deduct Stock
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1b4985] uppercase tracking-wider mb-1 text-[10px]">Adjustment Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={adjForm.quantity}
                      onChange={(e) => setAdjForm({ ...adjForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-[#1b4985] bg-white font-semibold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#1b4985] uppercase tracking-wider mb-1 text-[10px]">Audit Reason</label>
                    <select
                      value={adjForm.reason}
                      onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                      className="w-full border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-[#1b4985] bg-white font-semibold text-gray-900"
                    >
                      <option value="audit">Physical Verification Audit</option>
                      <option value="damage">Damaged Goods</option>
                      <option value="theft">Theft / Missing</option>
                      <option value="expiry">Expired Stock Disposal</option>
                      <option value="other">Other / Correction</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1b4985] uppercase tracking-wider mb-1 text-[10px]">Detailed Remarks</label>
                    <textarea
                      rows="3"
                      value={adjForm.note}
                      placeholder="Provide compliance or audit comments..."
                      onChange={(e) => setAdjForm({ ...adjForm, note: e.target.value })}
                      className="w-full border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-[#1b4985] bg-white font-semibold text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 px-4 py-3 border-t border-gray-300 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdjModal(false)}
                  className="px-4 py-1.5 border border-gray-400 bg-white text-gray-700 font-bold text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustmentSubmit}
                  className={`px-6 py-1.5 font-bold text-xs text-white ${adjForm.type === "increase" ? "bg-green-700 hover:bg-green-800" : "bg-red-700 hover:bg-red-800"}`}
                >
                  Confirm Adjustment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}