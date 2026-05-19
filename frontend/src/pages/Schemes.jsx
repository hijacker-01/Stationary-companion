import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const emptyScheme = {
  name: "", company: "", type: "buy_get_free",
  buyQty: "", freeQty: "", discountPercent: "",
  applicableItems: [], startDate: "", endDate: "", isActive: true,
};

export default function Schemes() {
  const [schemes, setSchemes] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyScheme);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [itemInput, setItemInput] = useState("");

  const fetchSchemes = () =>
    axios.get("http://localhost:5000/api/schemes", { headers: headers() })
      .then(r => setSchemes(r.data));

  const fetchItems = () =>
    axios.get("http://localhost:5000/api/items", { headers: headers() })
      .then(r => setItems(r.data));

  useEffect(() => { fetchSchemes(); fetchItems(); }, []);

  const companies = [...new Set(schemes.map(s => s.company).filter(Boolean))];

  const handleSave = async () => {
    if (!form.name || !form.company) return alert("Scheme name and company are required");
    if (form.type === "buy_get_free" && (!form.buyQty || !form.freeQty))
      return alert("Buy Qty and Free Qty are required for Buy/Get Free schemes");
    if (form.type === "flat_discount" && !form.discountPercent)
      return alert("Discount % is required for flat discount schemes");

    try {
      const payload = {
        ...form,
        buyQty: parseInt(form.buyQty) || 0,
        freeQty: parseInt(form.freeQty) || 0,
        discountPercent: parseFloat(form.discountPercent) || 0,
      };
      if (editId) {
        await axios.put(`http://localhost:5000/api/schemes/${editId}`, payload, { headers: headers() });
      } else {
        await axios.post("http://localhost:5000/api/schemes", payload, { headers: headers() });
      }
      setShowModal(false); setForm(emptyScheme); setEditId(null);
      fetchSchemes();
    } catch (err) { alert(err.response?.data?.error || "Error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this scheme?")) return;
    await axios.delete(`http://localhost:5000/api/schemes/${id}`, { headers: headers() });
    fetchSchemes();
  };

  const handleToggle = async (scheme) => {
    await axios.put(`http://localhost:5000/api/schemes/${scheme.id}`,
      { isActive: !scheme.isActive }, { headers: headers() });
    fetchSchemes();
  };

  const addApplicableItem = () => {
    if (itemInput && !form.applicableItems.includes(itemInput)) {
      setForm({ ...form, applicableItems: [...form.applicableItems, itemInput] });
      setItemInput("");
    }
  };

  const removeApplicableItem = (name) => {
    setForm({ ...form, applicableItems: form.applicableItems.filter(i => i !== name) });
  };

  const filtered = schemes.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.company.toLowerCase().includes(search.toLowerCase());
    const matchCompany = filterCompany === "all" || s.company === filterCompany;
    return matchSearch && matchCompany;
  });

  const activeSchemes = schemes.filter(s => s.isActive);
  const today = new Date().toISOString().split("T")[0];
  const expiredSchemes = schemes.filter(s => s.endDate && s.endDate < today);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🎁 Company Schemes</h1>
            <p className="text-sm text-gray-500 mt-1">Manage pharma company offers & schemes</p>
          </div>
          <button
            onClick={() => { setForm(emptyScheme); setEditId(null); setShowModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow"
          >
            + Add Scheme
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Schemes", value: schemes.length, icon: "🎁", color: "bg-blue-600" },
            { label: "Active", value: activeSchemes.length, icon: "✅", color: "bg-green-600" },
            { label: "Expired", value: expiredSchemes.length, icon: "⏰", color: "bg-red-500" },
            { label: "Companies", value: companies.length, icon: "🏭", color: "bg-purple-600" },
          ].map(c => (
            <div key={c.label} className={`${c.color} text-white rounded-2xl p-5 shadow`}>
              <p className="text-3xl font-bold">{c.icon} {c.value}</p>
              <p className="text-sm opacity-80 mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
          <input type="text" placeholder="🔍 Search schemes..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="all">All Companies</option>
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-sm text-gray-400 ml-auto">{filtered.length} schemes</span>
        </div>

        {/* Schemes Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-5 py-4 text-left">#</th>
                <th className="px-5 py-4 text-left">Scheme Name</th>
                <th className="px-5 py-4 text-left">Company</th>
                <th className="px-5 py-4 text-left">Type</th>
                <th className="px-5 py-4 text-left">Details</th>
                <th className="px-5 py-4 text-left">Items</th>
                <th className="px-5 py-4 text-left">Validity</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s, i) => (
                <tr key={s.id} className={`hover:bg-gray-50 ${!s.isActive ? "opacity-50" : ""}`}>
                  <td className="px-5 py-4 text-gray-400">{i + 1}</td>
                  <td className="px-5 py-4 font-semibold text-gray-800">{s.name}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                      🏭 {s.company}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      s.type === "buy_get_free"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-orange-100 text-orange-700 border border-orange-200"
                    }`}>
                      {s.type === "buy_get_free" ? "Buy+Get Free" : "Flat Discount"}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-700">
                    {s.type === "buy_get_free"
                      ? `Buy ${s.buyQty} → Get ${s.freeQty} Free`
                      : `${s.discountPercent}% Off`}
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {s.applicableItems?.length > 0
                      ? s.applicableItems.slice(0, 2).join(", ") + (s.applicableItems.length > 2 ? ` +${s.applicableItems.length - 2}` : "")
                      : "All items"}
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {s.startDate && s.endDate
                      ? `${new Date(s.startDate).toLocaleDateString("en-IN", {day:"2-digit",month:"short"})} — ${new Date(s.endDate).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"})}`
                      : s.startDate
                        ? `From ${new Date(s.startDate).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"})}`
                        : "Always"}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleToggle(s)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                        s.isActive
                          ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                      }`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-4 flex gap-2">
                    <button onClick={() => {
                      setForm({
                        ...s,
                        startDate: s.startDate || "",
                        endDate: s.endDate || "",
                        applicableItems: s.applicableItems || [],
                      });
                      setEditId(s.id);
                      setShowModal(true);
                    }} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                    <button onClick={() => handleDelete(s.id)}
                      className="text-red-500 hover:underline text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">
                    <div className="text-5xl mb-3">🎁</div>
                    <p>No schemes found. Add your first scheme!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">{editId ? "Edit" : "Add"} Scheme</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>

              <div className="space-y-4">
                {/* Scheme Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Scheme Name *</label>
                  <input type="text" placeholder="e.g. Cipla 10+2 Paracetamol"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Company / Manufacturer *</label>
                  <input type="text" list="company-list" placeholder="e.g. Cipla, Sun Pharma"
                    value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <datalist id="company-list">
                    {[...new Set(items.map(i => i.company).filter(Boolean))].map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                {/* Scheme Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Scheme Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "buy_get_free", label: "🎁 Buy X Get Y Free", color: "green" },
                      { key: "flat_discount", label: "💰 Flat Discount %", color: "orange" },
                    ].map(t => (
                      <button key={t.key} type="button"
                        onClick={() => setForm({ ...form, type: t.key })}
                        className={`py-2.5 rounded-lg text-sm font-medium border transition ${
                          form.type === t.key
                            ? `bg-${t.color}-600 text-white border-${t.color}-600`
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300"
                        }`}
                        style={form.type === t.key ? {
                          backgroundColor: t.color === "green" ? "#16a34a" : "#ea580c",
                          color: "white",
                          borderColor: t.color === "green" ? "#16a34a" : "#ea580c",
                        } : {}}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type-specific fields */}
                {form.type === "buy_get_free" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Buy Qty *</label>
                      <input type="number" min="1" placeholder="e.g. 10"
                        value={form.buyQty} onChange={e => setForm({ ...form, buyQty: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Free Qty *</label>
                      <input type="number" min="1" placeholder="e.g. 2"
                        value={form.freeQty} onChange={e => setForm({ ...form, freeQty: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Discount % *</label>
                    <input type="number" min="0" max="100" step="0.5" placeholder="e.g. 15"
                      value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                )}

                {/* Applicable Items */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Applicable Items <span className="text-gray-400">(leave empty = all items from this company)</span>
                  </label>
                  <div className="flex gap-2">
                    <input type="text" list="items-list" placeholder="Select or type item..."
                      value={itemInput} onChange={e => setItemInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addApplicableItem(); } }}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    <button type="button" onClick={addApplicableItem}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                      Add
                    </button>
                    <datalist id="items-list">
                      {items.filter(i => !form.company || i.company === form.company).map(i => (
                        <option key={i.id} value={i.name} />
                      ))}
                    </datalist>
                  </div>
                  {form.applicableItems.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.applicableItems.map(name => (
                        <span key={name} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                          {name}
                          <button type="button" onClick={() => removeApplicableItem(name)} className="text-blue-500 hover:text-blue-800 font-bold">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Validity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <input type="date" value={form.startDate}
                      onChange={e => setForm({ ...form, startDate: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input type="date" value={form.endDate}
                      onChange={e => setForm({ ...form, endDate: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={form.isActive}
                      onChange={e => setForm({ ...form, isActive: e.target.checked })}
                      className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleSave}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm">
                  {editId ? "Update" : "Add"} Scheme
                </button>
                <button onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm">
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
