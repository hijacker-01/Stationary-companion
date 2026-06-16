import { useEffect, useState } from "react";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import { BookOpen, Plus, Trash2, ArrowRightLeft } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function JournalVouchers() {
  const [jvs, setJvs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    debitPartyType: "customer", debitPartyId: "", debitPartyName: "",
    creditPartyType: "supplier", creditPartyId: "", creditPartyName: "",
    amount: "", narration: ""
  });

  const fetchData = async () => {
    try {
      const [jRes, cRes, sRes] = await Promise.all([
        axios.get("/journal"),
        axios.get("/customers"),
        axios.get("/suppliers")
      ]);
      setJvs(jRes.data);
      setCustomers(cRes.data);
      setSuppliers(sRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSelect = (field, type, id) => {
    const list = type === "customer" ? customers : suppliers;
    const party = list.find(p => p.id === parseInt(id));
    setForm(f => ({ ...f, [`${field}Type`]: type, [`${field}Id`]: id, [`${field}Name`]: party?.name || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.debitPartyId || !form.creditPartyId) return 
    if (form.debitPartyType === form.creditPartyType && form.debitPartyId === form.creditPartyId) {
      return 
    }
    if (!form.amount || form.amount <= 0) return 

    try {
      await axios.post("/journal", form);
      setShowModal(false);
      setForm({ date: new Date().toISOString().split("T")[0], debitPartyType: "customer", debitPartyId: "", debitPartyName: "", creditPartyType: "supplier", creditPartyId: "", creditPartyName: "", amount: "", narration: "" });
      fetchData();
    } catch (err) {
      
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Reverse and delete this Journal Voucher? This will adjust both party balances back.")) return;
    try {
      await axios.delete(`/journal/${id}`);
      fetchData();
    } catch (err) {
      
    }
  };

  const renderPartySelect = (field) => (
    <div className="flex gap-2">
      <select 
        value={form[`${field}Type`]} 
        onChange={e => handleSelect(field, e.target.value, "")}
        className="form-input bg-white !w-1/3"
      >
        <option value="customer">Customer</option>
        <option value="supplier">Supplier</option>
      </select>
      <select 
        required 
        value={form[`${field}Id`]} 
        onChange={e => handleSelect(field, form[`${field}Type`], e.target.value)}
        className="form-input bg-white !w-2/3"
      >
        <option value="">Select Party...</option>
        {(form[`${field}Type`] === "customer" ? customers : suppliers).map(p => (
          <option key={p.id} value={p.id}>{p.name} (Bal: {p.balance})</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Journal Vouchers (JVs)</h1>
            <p className="text-sm text-slate-500 mt-1">Pass adjustment entries between ledgers (e.g. Bad Debts, Discounts)</p>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" /> New JV Entry
          </button>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>JV Number</th>
                <th>Debit (By)</th>
                <th>Credit (To)</th>
                <th>Narration</th>
                <th className="text-right">Amount (₹)</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {jvs.map((jv) => (
                <tr key={jv.id}>
                  <td className="text-slate-600">
                    {new Date(jv.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric'})}
                  </td>
                  <td className="font-bold text-purple-700">{jv.jvNo}</td>
                  <td>
                    <span className="font-semibold text-slate-900">{jv.debitPartyName}</span>
                    <span className="ml-2 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded uppercase text-slate-500 font-semibold">{jv.debitPartyType.substring(0,4)}</span>
                  </td>
                  <td>
                    <span className="font-semibold text-slate-900">{jv.creditPartyName}</span>
                    <span className="ml-2 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded uppercase text-slate-500 font-semibold">{jv.creditPartyType.substring(0,4)}</span>
                  </td>
                  <td className="text-slate-500 text-xs">{jv.narration}</td>
                  <td className="text-right font-bold text-slate-900">₹{jv.amount.toFixed(2)}</td>
                  <td className="text-center">
                    <button onClick={() => handleDelete(jv.id)} className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer" title="Reverse Entry">
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
              {jvs.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">No Journal Vouchers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-purple-600" /> Pass Journal Voucher
              </h2>
              
              <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && e.shiftKey) handleSubmit(e); }} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                    <input type="date" required value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="form-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (₹)</label>
                    <input type="number" step="0.01" required value={form.amount} onChange={e=>setForm({...form, amount:parseFloat(e.target.value)||""})} className="form-input font-bold text-purple-700" placeholder="0.00" />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                      <span>Debit (By)</span>
                      <span className="text-slate-400 font-normal normal-case">Receiver / Expense / Asset ↑</span>
                    </label>
                    {renderPartySelect("debitParty")}
                  </div>

                  <div className="border-t border-slate-200"></div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                      <span>Credit (To)</span>
                      <span className="text-slate-400 font-normal normal-case">Giver / Income / Liability ↑</span>
                    </label>
                    {renderPartySelect("creditParty")}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Narration / Particulars</label>
                  <textarea required rows="2" value={form.narration} onChange={e=>setForm({...form, narration:e.target.value})} className="form-input" placeholder="Being adjustment for..."></textarea>
                </div>
                
                <div className="flex flex-col gap-2 pt-2">
                  <button type="button" onClick={handleSubmit} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                    Finish Voucher (Shift + Enter)
                  </button>
                  <div className="flex gap-3">
                    <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer">Post Voucher</button>
                    <button type="button" onClick={()=>setShowModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold cursor-pointer">Cancel</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
