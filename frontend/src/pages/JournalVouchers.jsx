import { useEffect, useState } from "react";
import axios from "axios";
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
        axios.get("http://localhost:5000/api/journal", { headers: headers() }),
        axios.get("http://localhost:5000/api/customers", { headers: headers() }),
        axios.get("http://localhost:5000/api/suppliers", { headers: headers() })
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
    if (!form.debitPartyId || !form.creditPartyId) return alert("Please select both Debit and Credit parties");
    if (form.debitPartyType === form.creditPartyType && form.debitPartyId === form.creditPartyId) {
      return alert("Debit and Credit party cannot be exactly the same.");
    }
    if (!form.amount || form.amount <= 0) return alert("Amount must be greater than zero");

    try {
      await axios.post("http://localhost:5000/api/journal", form, { headers: headers() });
      setShowModal(false);
      setForm({ date: new Date().toISOString().split("T")[0], debitPartyType: "customer", debitPartyId: "", debitPartyName: "", creditPartyType: "supplier", creditPartyId: "", creditPartyName: "", amount: "", narration: "" });
      fetchData();
    } catch (err) {
      alert("Error saving JV: " + err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Reverse and delete this Journal Voucher? This will adjust both party balances back.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/journal/${id}`, { headers: headers() });
      fetchData();
    } catch (err) {
      alert("Error deleting JV");
    }
  };

  const renderPartySelect = (field) => (
    <div className="flex gap-2">
      <select 
        value={form[`${field}Type`]} 
        onChange={e => handleSelect(field, e.target.value, "")}
        className="w-1/3 border rounded-lg px-2 text-sm outline-none bg-gray-50 focus:ring-2 focus:ring-blue-400"
      >
        <option value="customer">Customer</option>
        <option value="supplier">Supplier</option>
      </select>
      <select 
        required 
        value={form[`${field}Id`]} 
        onChange={e => handleSelect(field, form[`${field}Type`], e.target.value)}
        className="w-2/3 border rounded-lg px-2 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-400"
      >
        <option value="">Select Party...</option>
        {(form[`${field}Type`] === "customer" ? customers : suppliers).map(p => (
          <option key={p.id} value={p.id}>{p.name} (Bal: {p.balance})</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-600" /> Journal Vouchers (JVs)
            </h1>
            <p className="text-sm text-gray-500 mt-1">Pass adjustment entries between ledgers (e.g. Bad Debts, Discounts)</p>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow"
          >
            <Plus className="w-4 h-4" /> New JV Entry
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">JV Number</th>
                <th className="px-6 py-4">Debit (By)</th>
                <th className="px-6 py-4">Credit (To)</th>
                <th className="px-6 py-4">Narration</th>
                <th className="px-6 py-4 text-right">Amount (₹)</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jvs.map((jv) => (
                <tr key={jv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(jv.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric'})}
                  </td>
                  <td className="px-6 py-4 font-bold text-purple-700">{jv.jvNo}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-800">{jv.debitPartyName}</span>
                    <span className="ml-2 text-[10px] bg-gray-100 px-1 rounded uppercase text-gray-500">{jv.debitPartyType.substring(0,4)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-800">{jv.creditPartyName}</span>
                    <span className="ml-2 text-[10px] bg-gray-100 px-1 rounded uppercase text-gray-500">{jv.creditPartyType.substring(0,4)}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{jv.narration}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-800">₹{jv.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleDelete(jv.id)} className="text-red-400 hover:text-red-600 transition" title="Reverse Entry">
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
              {jvs.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No Journal Vouchers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-purple-600" /> Pass Journal Voucher
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                    <input type="date" required value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                    <input type="number" step="0.01" required value={form.amount} onChange={e=>setForm({...form, amount:parseFloat(e.target.value)||""})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 font-bold text-purple-700" placeholder="0.00" />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex justify-between">
                      <span>Debit (By)</span>
                      <span className="text-gray-400 font-normal">Receiver / Expense / Assest ↑</span>
                    </label>
                    {renderPartySelect("debitParty")}
                  </div>

                  <div className="border-t border-gray-200"></div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex justify-between">
                      <span>Credit (To)</span>
                      <span className="text-gray-400 font-normal">Giver / Income / Liability ↑</span>
                    </label>
                    {renderPartySelect("creditParty")}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Narration / Particulars</label>
                  <textarea required rows="2" value={form.narration} onChange={e=>setForm({...form, narration:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" placeholder="Being adjustment for..."></textarea>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">Post Voucher</button>
                  <button type="button" onClick={()=>setShowModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
