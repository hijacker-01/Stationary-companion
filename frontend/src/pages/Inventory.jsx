import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const empty = { name: "", batch: "", category: "", company: "", stock_qty: "", scheme_qty: "", unit: "strips", expiry: "", location: "", mrp: "", selling_price: "", cost_price: "", purchaseScheme: "" };

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [allSchemes, setAllSchemes] = useState([]);

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
    setForm({ ...item, expiry: item.expiry?.split("T")[0] });
    setEditId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await axios.delete(`http://localhost:5000/api/items/${id}`, { headers: headers() });
    fetchItems();
  };

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.batch?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = items.filter(i => i.stock_qty > 0 && i.stock_qty < 10);
  const outOfStockItems = items.filter(i => i.stock_qty <= 0);
  const totalStockValue = items.reduce((sum, i) => sum + (i.stock_qty * (i.selling_price || i.mrp || 0)), 0);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📦 Inventory</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all your stock items</p>
          </div>
          <button
            onClick={() => { setForm(empty); setEditId(null); setShowModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow"
          >
            + Add Item
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Items", value: items.length, color: "bg-blue-600", icon: "📦" },
            { label: "Stock Value", value: `₹${totalStockValue.toFixed(2)}`, color: "bg-green-600", icon: "💰" },
            { label: "Low Stock", value: lowStockItems.length, color: "bg-yellow-500", icon: "⚠️" },
            { label: "Out of Stock", value: outOfStockItems.length, color: "bg-red-500", icon: "🚫" },
          ].map(c => (
            <div key={c.label} className={`${c.color} text-white rounded-2xl p-5 shadow`}>
              <p className="text-3xl font-bold">{c.icon} {c.value}</p>
              <p className="text-sm opacity-80 mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6">
          <input
            type="text"
            placeholder="🔍 Search by name or batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-6 py-4 text-left">#</th>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Batch</th>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4 text-left">Company</th>
                <th className="px-6 py-4 text-left">Stock Qty</th>
                <th className="px-6 py-4 text-left">Scheme Qty</th>
                <th className="px-6 py-4 text-left">Total Qty</th>
                <th className="px-6 py-4 text-left">MRP</th>
                <th className="px-6 py-4 text-left">Expiry</th>
                <th className="px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item, i) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${item.stock_qty <= 0 ? "bg-red-50/50" : ""}`}>
                  <td className="px-6 py-4 text-gray-400">{i + 1}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-800">{item.name}</span>
                    {item.purchaseScheme && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 border border-green-200">
                        🎁 {item.purchaseScheme}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{item.batch || "—"}</td>
                  <td className="px-6 py-4 text-gray-500">{item.category || "—"}</td>
                  <td className="px-6 py-4">
                    {item.company ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {item.company}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.stock_qty <= 0
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : item.stock_qty < 10
                          ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                          : "bg-green-100 text-green-700 border border-green-200"
                    }`}>
                      {item.stock_qty} {item.unit}
                    </span>
                    {item.stock_qty <= 0 && (
                      <span className="ml-2 text-red-500 text-[10px] font-semibold uppercase">Out of Stock</span>
                    )}
                    {item.stock_qty > 0 && item.stock_qty < 10 && (
                      <span className="ml-2 text-yellow-600 text-[10px] font-semibold uppercase">Low Stock</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                      🎁 {item.scheme_qty || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-800 text-base">
                      {(item.stock_qty || 0) + (item.scheme_qty || 0)}
                    </span>
                    <span className="text-gray-500 text-xs ml-1">{item.unit}</span>
                  </td>
                  <td className="px-6 py-4 text-green-600 font-medium">₹{item.selling_price || item.mrp || 0}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {item.expiry ? new Date(item.expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:underline text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No items found. Add your first item!</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
              <h2 className="text-lg font-bold text-gray-800 mb-6">
                {editId ? "Edit Item" : "Add New Item"}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "name", label: "Item Name *", type: "text" },
                  { key: "batch", label: "Batch No", type: "text" },
                  { key: "category", label: "Category", type: "text" },
                  { key: "company", label: "Company / Manufacturer", type: "text" },
                  { key: "stock_qty", label: "Stock Quantity", type: "number" },
                  { key: "scheme_qty", label: "Scheme Quantity", type: "number" },
                  { key: "unit", label: "Unit", type: "text" },
                  { key: "expiry", label: "Expiry Date *", type: "date" },
                  { key: "location", label: "Location/Rack", type: "text" },
                  { key: "selling_price", label: "Selling Price (₹)", type: "number" },
                  { key: "mrp", label: "MRP (₹) [Reference]", type: "number" },
                  { key: "cost_price", label: "Cost Price (₹)", type: "number" },
                  { key: "purchaseScheme", label: "Purchase Scheme Note", type: "text" }
                ].map(f => (
                  <div key={f.key} className={f.key === "name" ? "col-span-2" : ""}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                ))}
                {/* Purchase Scheme Field */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    🎁 Purchase Scheme <span className="text-gray-400 font-normal">(scheme received when buying this item)</span>
                  </label>
                  <input
                    type="text"
                    list="scheme-suggestions"
                    placeholder="e.g. Buy 10 Get 2 Free, 15% discount, etc."
                    value={form.purchaseScheme}
                    onChange={(e) => setForm({ ...form, purchaseScheme: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
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
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2.5">
                      <p className="text-[10px] font-semibold text-green-700 uppercase mb-1">Schemes from {form.company}:</p>
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
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition cursor-pointer border border-green-200"
                          >
                            🎁 {s.type === "buy_get_free" ? `Buy ${s.buyQty}+${s.freeQty} Free` : `${s.discountPercent}% Off`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold">
                  {editId ? "Update Item" : "Add Item"}
                </button>
                <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold">
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