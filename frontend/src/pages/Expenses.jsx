import { useEffect, useState } from "react";
import axios from "../api/axios";
import PageLayout from "../components/PageLayout";
import { Receipt, Plus, Trash2, IndianRupee } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], category: "Misc", amount: "", paymentMode: "cash", note: "" });

  const fetchExpenses = async () => {
    try {
      const res = await axios.get("/expenses");
      setExpenses(res.data?.rows || res.data?.items || res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/expenses", form);
      setShowModal(false);
      setForm({ date: new Date().toISOString().split("T")[0], category: "Misc", amount: "", paymentMode: "cash", note: "" });
      fetchExpenses();
    } catch (err) {
      
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense record?")) return;
    try {
      await axios.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      
    }
  };

  const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <PageLayout
      title="Daily Expenses"
      subtitle="Record and track operational business expenses"
      actions={
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" /> Add Expense
        </button>
      }
    >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border-l-4 border-l-rose-500 border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900">₹{total.toFixed(2)}</p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Expenses</p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white border-l-4 border-l-teal-500 border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900">{expenses.length}</p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-1">Records</p>
            </div>
            <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description / Note</th>
                <th>Payment Mode</th>
                <th className="text-right">Amount (₹)</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="font-medium text-slate-700">
                    {new Date(e.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric'})}
                  </td>
                  <td className="font-semibold text-slate-900">{e.category}</td>
                  <td className="text-slate-500">{e.note || "—"}</td>
                  <td>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase bg-slate-50 text-slate-600 border-slate-200">
                      {e.paymentMode}
                    </span>
                  </td>
                  <td className="text-right font-bold text-rose-600">₹{e.amount.toFixed(2)}</td>
                  <td className="text-center">
                    <button onClick={() => handleDelete(e.id)} className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer">
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No expenses recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Add New Expense</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                  <input type="date" required value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="form-input bg-white">
                    <option value="Rent">Rent</option>
                    <option value="Salary">Salary / Wages</option>
                    <option value="Electricity">Electricity / Utilities</option>
                    <option value="Logistics">Freight & Logistics</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Tea/Snacks">Tea/Snacks (Petty Cash)</option>
                    <option value="Misc">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (₹)</label>
                  <input type="number" step="0.01" required value={form.amount} onChange={e=>setForm({...form, amount:parseFloat(e.target.value)||""})} className="form-input" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Mode</label>
                  <select value={form.paymentMode} onChange={e=>setForm({...form, paymentMode:e.target.value})} className="form-input bg-white">
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer / Cheque</option>
                    <option value="upi">UPI / QR</option>
                    <option value="credit">Credit / Payable Later</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Note / Description</label>
                  <textarea rows="2" value={form.note} onChange={e=>setForm({...form, note:e.target.value})} className="form-input" placeholder="Optional details..."></textarea>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer">Save Expense</button>
                  <button type="button" onClick={()=>setShowModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold cursor-pointer">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
    </PageLayout>
  );
}
