import { useEffect, useState } from "react";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import { Users, CheckCircle2, Target, Plus, Pencil, Trash2 } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });
const emptyForm = { name: "", phone: "", email: "", area: "", target: 0, commission: 0 };

export default function SalesmanPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetch = () => axios.get("/salesman").then(r => setList(r.data));
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.name) return 
    try {
      if (editId) await axios.put(`/salesman/${editId}`, form);
      else await axios.post("/salesman", form);
      setShowModal(false); setForm(emptyForm); setEditId(null); fetch();
    } catch (err) {  }
  };

  const handleEdit = (s) => { setForm({ name: s.name, phone: s.phone||"", email: s.email||"", area: s.area||"", target: s.target||0, commission: s.commission||0 }); setEditId(s.id); setShowModal(true); };
  const handleDelete = async (id) => { if (!confirm("Delete?")) return; await axios.delete(`/salesman/${id}`); fetch(); };

  const summaryCards = [
    { label: "Total Salesmen", value: list.length, icon: Users, color: "bg-teal-50 text-teal-600", borderColor: "border-teal-500" },
    { label: "Active", value: list.filter(s => s.isActive).length, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", borderColor: "border-emerald-500" },
    { label: "Total Target", value: `₹${list.reduce((s, x) => s + (x.target || 0), 0).toLocaleString("en-IN")}`, icon: Target, color: "bg-purple-50 text-purple-600", borderColor: "border-purple-500" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Salesman Master</h1>
            <p className="text-sm text-slate-500 mt-1">Manage field representatives and area assignments</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setEditId(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer">
            <Plus className="w-4.5 h-4.5" /> Add Salesman
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

        {/* Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Area</th>
                <th>Target</th>
                <th>Commission</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(s => (
                <tr key={s.id}>
                  <td className="font-semibold text-slate-900">{s.name}</td>
                  <td className="text-slate-500">{s.phone || "—"}</td>
                  <td>{s.area || "—"}</td>
                  <td>₹{(s.target || 0).toLocaleString("en-IN")}</td>
                  <td>{s.commission || 0}%</td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${
                      s.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-600 border-rose-200"
                    }`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(s)} className="text-teal-600 hover:text-teal-800 text-xs font-semibold cursor-pointer flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p>No salesmen added yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">{editId ? "Edit" : "Add"} Salesman</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl cursor-pointer">×</button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { k: "name", l: "Full Name *", p: "John" },
                  { k: "phone", l: "Phone", p: "+91..." },
                  { k: "email", l: "Email", p: "john@co.com" },
                  { k: "area", l: "Area / Route", p: "South Mumbai" },
                ].map(f => (
                  <div key={f.k}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{f.l}</label>
                    <input value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} placeholder={f.p} className="form-input" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Monthly Target (₹)</label>
                  <input type="number" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Commission %</label>
                  <input type="number" value={form.commission} onChange={e => setForm({ ...form, commission: e.target.value })} className="form-input" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSubmit} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                  {editId ? "Update" : "Create"}
                </button>
                <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
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
