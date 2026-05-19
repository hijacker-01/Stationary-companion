import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });
const emptyForm = { name: "", phone: "", email: "", area: "", target: 0, commission: 0 };

export default function SalesmanPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetch = () => axios.get("http://localhost:5000/api/salesman", { headers: headers() }).then(r => setList(r.data));
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.name) return alert("Name required");
    try {
      if (editId) await axios.put(`http://localhost:5000/api/salesman/${editId}`, form, { headers: headers() });
      else await axios.post("http://localhost:5000/api/salesman", form, { headers: headers() });
      setShowModal(false); setForm(emptyForm); setEditId(null); fetch();
    } catch (err) { alert(err.response?.data?.error || "Error"); }
  };

  const handleEdit = (s) => { setForm({ name: s.name, phone: s.phone||"", email: s.email||"", area: s.area||"", target: s.target||0, commission: s.commission||0 }); setEditId(s.id); setShowModal(true); };
  const handleDelete = async (id) => { if (!confirm("Delete?")) return; await axios.delete(`http://localhost:5000/api/salesman/${id}`, { headers: headers() }); fetch(); };

  return (
    <div className="flex min-h-screen bg-gray-100"><Sidebar /><main className="flex-1 p-8">
      <div className="flex justify-between mb-6"><div><h1 className="text-2xl font-bold">🧑‍💼 Salesman Master</h1><p className="text-sm text-gray-500 mt-1">Manage field representatives and area assignments</p></div>
        <button onClick={()=>{setForm(emptyForm);setEditId(null);setShowModal(true)}} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow">+ Add Salesman</button></div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{l:"Total Salesmen",v:list.length,c:"bg-blue-600",i:"🧑‍💼"},{l:"Active",v:list.filter(s=>s.isActive).length,c:"bg-green-600",i:"✅"},{l:"Total Target",v:`₹${list.reduce((s,x)=>s+(x.target||0),0).toLocaleString("en-IN")}`,c:"bg-purple-600",i:"🎯"}].map(c=>
          <div key={c.l} className={`${c.c} text-white rounded-2xl p-5 shadow`}><div className="text-3xl mb-2">{c.i}</div><div className="text-2xl font-bold">{c.v}</div><div className="text-sm opacity-80 mt-1">{c.l}</div></div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-6 py-4 text-left">Name</th><th className="px-6 py-4 text-left">Phone</th><th className="px-6 py-4 text-left">Area</th><th className="px-6 py-4 text-left">Target</th><th className="px-6 py-4 text-left">Commission</th><th className="px-6 py-4 text-left">Status</th><th className="px-6 py-4 text-left">Actions</th></tr></thead>
          <tbody className="divide-y">{list.map(s=><tr key={s.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-semibold">{s.name}</td><td className="px-6 py-4 text-gray-500">{s.phone||"—"}</td><td className="px-6 py-4">{s.area||"—"}</td><td className="px-6 py-4">₹{(s.target||0).toLocaleString("en-IN")}</td><td className="px-6 py-4">{s.commission||0}%</td><td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.isActive?"bg-green-100 text-green-700":"bg-red-100 text-red-600"}`}>{s.isActive?"Active":"Inactive"}</span></td><td className="px-6 py-4 flex gap-3"><button onClick={()=>handleEdit(s)} className="text-blue-600 hover:underline text-xs">Edit</button><button onClick={()=>handleDelete(s.id)} className="text-red-500 hover:underline text-xs">Delete</button></td></tr>)}{list.length===0&&<tr><td colSpan={7} className="text-center py-12 text-gray-400">No salesmen added yet.</td></tr>}</tbody>
        </table>
      </div>

      {showModal && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <div className="flex justify-between mb-6"><h2 className="text-lg font-bold">{editId?"Edit":"Add"} Salesman</h2><button onClick={()=>setShowModal(false)} className="text-gray-400 text-2xl">×</button></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[{k:"name",l:"Full Name *",p:"John"},{k:"phone",l:"Phone",p:"+91..."},{k:"email",l:"Email",p:"john@co.com"},{k:"area",l:"Area / Route",p:"South Mumbai"}].map(f=><div key={f.k}><label className="text-xs font-medium text-gray-600 block mb-1">{f.l}</label><input value={form[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})} placeholder={f.p} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>)}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Monthly Target (₹)</label><input type="number" value={form.target} onChange={e=>setForm({...form,target:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Commission %</label><input type="number" value={form.commission} onChange={e=>setForm({...form,commission:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
        </div>
        <div className="flex gap-3"><button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm">{editId?"Update":"Create"}</button><button onClick={()=>setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm">Cancel</button></div>
      </div></div>}
    </main></div>
  );
}
