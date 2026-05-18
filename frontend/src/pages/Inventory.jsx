import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const empty = { name: "", batch: "", category: "", qty: "", unit: "strips", expiry: "", location: "", mrp: "", costPrice: "" };

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const fetchItems = () => {
    axios.get("http://localhost:5000/api/items", { headers: headers() })
      .then(res => setItems(res.data));
  };

  useEffect(() => { fetchItems(); }, []);

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
                <th className="px-6 py-4 text-left">Qty</th>
                <th className="px-6 py-4 text-left">MRP</th>
                <th className="px-6 py-4 text-left">Expiry</th>
                <th className="px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item, i) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-400">{i + 1}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{item.name}</td>
                  <td className="px-6 py-4 text-gray-500">{item.batch || "—"}</td>
                  <td className="px-6 py-4 text-gray-500">{item.category || "—"}</td>
                  <td className="px-6 py-4">{item.qty} <span className="text-gray-400 text-xs">{item.unit}</span></td>
                  <td className="px-6 py-4 text-green-600 font-medium">₹{item.mrp || 0}</td>
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
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No items found. Add your first item!</td></tr>
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
                  { key: "qty", label: "Quantity", type: "number" },
                  { key: "unit", label: "Unit", type: "text" },
                  { key: "expiry", label: "Expiry Date *", type: "date" },
                  { key: "location", label: "Location/Rack", type: "text" },
                  { key: "mrp", label: "MRP (₹)", type: "number" },
                  { key: "costPrice", label: "Cost Price (₹)", type: "number" },
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