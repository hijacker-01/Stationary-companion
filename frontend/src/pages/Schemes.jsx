import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { Gift, CheckCircle2, Clock, Factory, Search, Plus, Pencil, Trash2 } from "lucide-react";

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

  const summaryCards = [
    { label: "Total Schemes", value: schemes.length, icon: Gift, color: "bg-teal-50 text-teal-600", borderColor: "border-teal-500" },
    { label: "Active", value: activeSchemes.length, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", borderColor: "border-emerald-500" },
    { label: "Expired", value: expiredSchemes.length, icon: Clock, color: "bg-rose-50 text-rose-600", borderColor: "border-rose-500" },
    { label: "Companies", value: companies.length, icon: Factory, color: "bg-purple-50 text-purple-600", borderColor: "border-purple-500" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Company Schemes</h1>
            <p className="text-sm text-slate-500 mt-1">Manage pharma company offers & schemes</p>
          </div>
          <button
            onClick={() => { setForm(emptyScheme); setEditId(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" /> Add Scheme
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryCards.map((c, i) => {
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

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-center">
          <Search className="w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search schemes..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none min-w-48" />
          <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
            className="form-input bg-white">
            <option value="all">All Companies</option>
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-sm text-slate-400 ml-auto">{filtered.length} schemes</span>
        </div>

        {/* Schemes Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Scheme Name</th>
                <th>Company</th>
                <th>Type</th>
                <th>Details</th>
                <th>Items</th>
                <th>Validity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} className={`${!s.isActive ? "opacity-50" : ""}`}>
                  <td className="text-slate-400">{i + 1}</td>
                  <td className="font-semibold text-slate-900">{s.name}</td>
                  <td>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase bg-purple-50 text-purple-700 border-purple-200">
                      <Factory className="w-3 h-3" /> {s.company}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${
                      s.type === "buy_get_free"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-orange-50 text-orange-700 border-orange-200"
                    }`}>
                      {s.type === "buy_get_free" ? "Buy+Get Free" : "Flat Discount"}
                    </span>
                  </td>
                  <td className="font-medium text-slate-700">
                    {s.type === "buy_get_free"
                      ? `Buy ${s.buyQty} → Get ${s.freeQty} Free`
                      : `${s.discountPercent}% Off`}
                  </td>
                  <td className="text-slate-500 text-xs">
                    {s.applicableItems?.length > 0
                      ? s.applicableItems.slice(0, 2).join(", ") + (s.applicableItems.length > 2 ? ` +${s.applicableItems.length - 2}` : "")
                      : "All items"}
                  </td>
                  <td className="text-slate-500 text-xs">
                    {s.startDate && s.endDate
                      ? `${new Date(s.startDate).toLocaleDateString("en-IN", {day:"2-digit",month:"short"})} — ${new Date(s.endDate).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"})}`
                      : s.startDate
                        ? `From ${new Date(s.startDate).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"})}`
                        : "Always"}
                  </td>
                  <td>
                    <button onClick={() => handleToggle(s)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase cursor-pointer transition ${
                        s.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        setForm({
                          ...s,
                          startDate: s.startDate || "",
                          endDate: s.endDate || "",
                          applicableItems: s.applicableItems || [],
                        });
                        setEditId(s.id);
                        setShowModal(true);
                      }} className="text-teal-600 hover:text-teal-800 text-xs font-semibold cursor-pointer flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => handleDelete(s.id)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <Gift className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p>No schemes found. Add your first scheme!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">{editId ? "Edit" : "Add"} Scheme</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl cursor-pointer">×</button>
              </div>

              <div className="space-y-4">
                {/* Scheme Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Scheme Name *</label>
                  <input type="text" placeholder="e.g. Cipla 10+2 Paracetamol"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="form-input" />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Company / Manufacturer *</label>
                  <input type="text" list="company-list" placeholder="e.g. Cipla, Sun Pharma"
                    value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                    className="form-input" />
                  <datalist id="company-list">
                    {[...new Set(items.map(i => i.company).filter(Boolean))].map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                {/* Scheme Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Scheme Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "buy_get_free", label: "Buy X Get Y Free", color: "green" },
                      { key: "flat_discount", label: "Flat Discount %", color: "orange" },
                    ].map(t => (
                      <button key={t.key} type="button"
                        onClick={() => setForm({ ...form, type: t.key })}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition cursor-pointer ${
                          form.type === t.key
                            ? `bg-${t.color}-600 text-white border-${t.color}-600`
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-300"
                        }`}
                        style={form.type === t.key ? {
                          backgroundColor: t.color === "green" ? "#16a34a" : "#ea580c",
                          color: "white",
                          borderColor: t.color === "green" ? "#16a34a" : "#ea580c",
                        } : {}}>
                        {t.key === "buy_get_free" ? <Gift className="w-4 h-4" /> : <span className="text-sm font-bold">%</span>}
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type-specific fields */}
                {form.type === "buy_get_free" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Buy Qty *</label>
                      <input type="number" min="1" placeholder="e.g. 10"
                        value={form.buyQty} onChange={e => setForm({ ...form, buyQty: e.target.value })}
                        className="form-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Free Qty *</label>
                      <input type="number" min="1" placeholder="e.g. 2"
                        value={form.freeQty} onChange={e => setForm({ ...form, freeQty: e.target.value })}
                        className="form-input" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Discount % *</label>
                    <input type="number" min="0" max="100" step="0.5" placeholder="e.g. 15"
                      value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: e.target.value })}
                      className="form-input" />
                  </div>
                )}

                {/* Applicable Items */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Applicable Items <span className="text-slate-400 normal-case">(leave empty = all items from this company)</span>
                  </label>
                  <div className="flex gap-2">
                    <input type="text" list="items-list" placeholder="Select or type item..."
                      value={itemInput} onChange={e => setItemInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addApplicableItem(); } }}
                      className="form-input flex-1" />
                    <button type="button" onClick={addApplicableItem}
                      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer">
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
                        <span key={name} className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-teal-200">
                          {name}
                          <button type="button" onClick={() => removeApplicableItem(name)} className="text-teal-500 hover:text-teal-800 font-bold cursor-pointer">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Validity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                    <input type="date" value={form.startDate}
                      onChange={e => setForm({ ...form, startDate: e.target.value })}
                      className="form-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
                    <input type="date" value={form.endDate}
                      onChange={e => setForm({ ...form, endDate: e.target.value })}
                      className="form-input" />
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={form.isActive}
                      onChange={e => setForm({ ...form, isActive: e.target.checked })}
                      className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                  <span className="text-sm font-medium text-slate-700">Active</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleSave}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                  {editId ? "Update" : "Add"} Scheme
                </button>
                <button onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
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
