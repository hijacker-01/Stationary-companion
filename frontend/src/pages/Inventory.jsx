import { useEffect, useState } from "react";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useDebounce } from "use-debounce";
import { toast } from "react-hot-toast";
import EmptyState from "../components/EmptyState";
import { useConfirm } from "../hooks/useConfirm";
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
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  
  const [allSchemes, setAllSchemes] = useState([]);
  const [adjForm, setAdjForm] = useState(emptyAdj);
  const [showAdjModal, setShowAdjModal] = useState(false);

  const { confirm, ConfirmModalComponent } = useConfirm();

  const fetchItems = () => {
    setIsLoading(true);
    axios.get(`/items?page=${page}&limit=50&search=${debouncedSearch}`)
      .then(res => {
        setItems(res.data.data);
        setTotalItems(res.data.total);
        setPage(res.data.page);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => toast.error("Failed to load inventory"))
      .finally(() => setIsLoading(false));
  };

  const fetchSchemes = () =>
    axios.get("/schemes")
      .then(res => setAllSchemes(res.data)).catch(() => {});

  useEffect(() => { fetchSchemes(); }, []);
  useEffect(() => { fetchItems(); }, [page, debouncedSearch]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const handleSubmit = async () => {
    if (!form.name || !form.expiry) {
      toast.error("Name and Expiry date are required");
      return;
    }
    const payload = {
      ...form,
      stock_qty: parseInt(form.stock_qty) || 0,
      scheme_qty: parseInt(form.scheme_qty) || 0,
      mrp: parseFloat(form.mrp) || 0,
      selling_price: parseFloat(form.selling_price) || 0,
      cost_price: parseFloat(form.cost_price) || 0,
      reorderPoint: parseInt(form.reorderPoint) || 10
    };
    try {
      if (editId) {
        await axios.put(`/items/${editId}`, payload);
        toast.success("Item updated successfully");
      } else {
        await axios.post("/items", payload);
        toast.success("Item added successfully");
      }
      setShowModal(false);
      setForm({ ...empty });
      setEditId(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save item");
    }
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name || "", batch: item.batch || "", hsn: item.hsn || "",
      pack: item.pack || "", category: item.category || "", company: item.company || "",
      stock_qty: item.stock_qty || 0, scheme_qty: item.scheme_qty || 0, unit: item.unit || "strips",
      expiry: item.expiry?.split("T")[0], location: item.location || "", mrp: item.mrp || 0,
      selling_price: item.selling_price || 0, cost_price: item.cost_price || 0,
      purchaseScheme: item.purchaseScheme || "", schedule: item.schedule || "None",
      reorderPoint: item.reorderPoint ?? 10
    });
    setEditId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (item) => {
    const isConfirmed = await confirm({
      title: `Delete ${item.name}?`,
      message: "This action cannot be undone."
    });
    
    if (!isConfirmed) return;
    
    try {
      await axios.delete(`/items/${item.id}`);
      toast.success("Item deleted successfully");
      fetchItems();
    } catch (err) {
      toast.error("Failed to delete item");
    }
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
      toast.error("Quantity must be greater than 0");
      return;
    }
    try {
      await axios.post("/stock-adjust", adjForm);
      toast.success("Stock adjusted successfully");
      setShowAdjModal(false);
      setAdjForm(emptyAdj);
      fetchItems();
    } catch (err) {
      toast.error("Failed to adjust stock");
    }
  };

  // NOTE: These are calculated over the *fetched page* array only, 
  // since server-side aggregation for low stock requires new endpoints.
  // For now, it reflects the current page.
  const lowStockItems = items.filter(i => i.stock_qty > 0 && i.stock_qty <= (i.reorderPoint ?? 10));
  const outOfStockItems = items.filter(i => i.stock_qty === 0);
  const totalValue = items.reduce((sum, i) => sum + ((i.stock_qty || 0) * (i.cost_price || 0)), 0);

  const summaryCards = [
    { title: "Total Items", value: totalItems, icon: Package, color: "bg-teal-50 text-teal-600 border-teal-200" },
    { title: "Inventory Value", value: `₹${totalValue.toLocaleString()}`, icon: DollarSign, color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
    { title: "Low Stock", value: lowStockItems.length, icon: AlertTriangle, color: "bg-amber-50 text-amber-600 border-amber-200" },
    { title: "Out of Stock", value: outOfStockItems.length, icon: AlertCircle, color: "bg-rose-50 text-rose-600 border-rose-200" },
  ];

  return (
    <div className="flex h-screen bg-[#e5e5e5] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 p-6">
          
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
              <p className="text-sm text-slate-500">Manage products, stock counts, and supply levels.</p>
            </div>
            <button 
              onClick={() => { setForm(empty); setEditId(null); setShowModal(true); }}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            {summaryCards.map((card, i) => (
              <div key={i} className={`p-4 rounded-xl border ${card.color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase opacity-80">{card.title}</span>
                  <card.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold mt-2">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl mb-6 shadow-sm flex items-center justify-between">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search inventory by name, batch..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-64 bg-white"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>
          ) : items.length === 0 ? (
            <EmptyState 
              icon="Package" 
              title="No inventory items found" 
              description="Add your first item to start tracking stock, pricing, and expiry dates." 
              actionLabel="Add Item" 
              onAction={() => { setForm(empty); setEditId(null); setShowModal(true); }} 
            />
          ) : (
            <div className="flex-1 overflow-auto bg-white rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-slate-500 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4">Batch / Expiry</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Price / MRP</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.category} • {item.company}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.batch || "—"}<br/>
                        <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500">
                          {item.expiry ? new Date(item.expiry).toLocaleDateString("en-IN") : "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${item.stock_qty <= (item.reorderPoint || 0) ? 'text-amber-600' : 'text-slate-900'}`}>
                          {item.stock_qty} {item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-900 font-semibold">₹{item.selling_price || item.mrp || 0}</p>
                        <p className="text-[10px] text-slate-400">MRP: ₹{item.mrp}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">{item.location || "—"}</td>
                      <td className="w-24">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openAdjustment(item)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Adjust Stock">
                            <Settings className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalItems > 0 && !isLoading && (
            <div className="mt-4 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-900">{(page - 1) * 50 + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(page * 50, totalItems)}</span> of <span className="font-semibold text-slate-900">{totalItems}</span> records
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => p - 1)} 
                  disabled={page === 1}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm font-semibold text-slate-700">Page {page} of {totalPages}</span>
                <button 
                  onClick={() => setPage(p => p + 1)} 
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </main>

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
                <div className="col-span-2 p-3 bg-blue-50/50 border border-blue-100 mt-2">
                  <label className="block font-bold text-[#1b4985] uppercase tracking-wider mb-1 text-[10px]">Purchase Scheme Note (Dropdown)</label>
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
                      <option key={s.id} value={s.type === "buy_get_free" ? `${s.name} - Buy ${s.buyQty} Get ${s.freeQty} Free (${s.company})` : `${s.name} - ${s.discountPercent}% Off (${s.company})`} />
                    ))}
                  </datalist>
                </div>
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
                <div className="mt-2">
                  <label className="block font-bold text-[#1b4985] uppercase tracking-wider mb-1 text-[10px]">Reorder Level (Min Qty)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10"
                    value={form.reorderPoint ?? ""}
                    onChange={(e) => setForm({ ...form, reorderPoint: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-[#1b4985] bg-white font-semibold text-gray-900"
                  />
                </div>
              </div>
              <div className="bg-gray-100 px-4 py-3 border-t border-gray-300 flex justify-end gap-3 flex-shrink-0">
                <button onClick={() => setShowModal(false)} className="px-4 py-1.5 border border-gray-400 bg-white text-gray-700 font-bold text-xs hover:bg-gray-50">Cancel (Esc)</button>
                <button onClick={handleSubmit} className="px-6 py-1.5 bg-[#1b4985] text-white font-bold text-xs hover:bg-blue-900">{editId ? "Update Item" : "Save Item"} (F10)</button>
              </div>
            </div>
          </div>
        )}

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
                      <button type="button" onClick={() => setAdjForm({ ...adjForm, type: "increase" })} className={`py-2 text-xs font-black uppercase tracking-wider border transition-colors ${adjForm.type === "increase" ? "bg-green-100 border-green-600 text-green-800" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-100"}`}>Add Stock</button>
                      <button type="button" onClick={() => setAdjForm({ ...adjForm, type: "decrease" })} className={`py-2 text-xs font-black uppercase tracking-wider border transition-colors ${adjForm.type === "decrease" ? "bg-red-100 border-red-600 text-red-800" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-100"}`}>Deduct Stock</button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-[#1b4985] uppercase tracking-wider mb-1 text-[10px]">Adjustment Quantity</label>
                    <input type="number" min="1" value={adjForm.quantity} onChange={(e) => setAdjForm({ ...adjForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })} className="w-full border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-[#1b4985] bg-white font-semibold text-gray-900" />
                  </div>
                  <div>
                    <label className="block font-bold text-[#1b4985] uppercase tracking-wider mb-1 text-[10px]">Audit Reason</label>
                    <select value={adjForm.reason} onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })} className="w-full border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-[#1b4985] bg-white font-semibold text-gray-900">
                      <option value="audit">Physical Verification Audit</option>
                      <option value="damage">Damaged Goods</option>
                      <option value="theft">Theft / Missing</option>
                      <option value="expiry">Expired Stock Disposal</option>
                      <option value="other">Other / Correction</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[#1b4985] uppercase tracking-wider mb-1 text-[10px]">Detailed Remarks</label>
                    <textarea rows="3" value={adjForm.note} placeholder="Provide compliance or audit comments..." onChange={(e) => setAdjForm({ ...adjForm, note: e.target.value })} className="w-full border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-[#1b4985] bg-white font-semibold text-gray-900" />
                  </div>
                </div>
              </div>
              <div className="bg-gray-100 px-4 py-3 border-t border-gray-300 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAdjModal(false)} className="px-4 py-1.5 border border-gray-400 bg-white text-gray-700 font-bold text-xs hover:bg-gray-50">Cancel</button>
                <button onClick={handleAdjustmentSubmit} className={`px-6 py-1.5 font-bold text-xs text-white ${adjForm.type === "increase" ? "bg-green-700 hover:bg-green-800" : "bg-red-700 hover:bg-red-800"}`}>Confirm Adjustment</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ConfirmModalComponent />
    </div>
  );
}