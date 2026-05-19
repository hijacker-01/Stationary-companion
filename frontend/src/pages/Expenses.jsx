import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { Receipt, Plus, Trash2 } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], category: "Misc", amount: "", paymentMode: "cash", note: "" });

  const fetchExpenses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/expenses", { headers: headers() });
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/expenses", form, { headers: headers() });
      setShowModal(false);
      setForm({ date: new Date().toISOString().split("T")[0], category: "Misc", amount: "", paymentMode: "cash", note: "" });
      fetchExpenses();
    } catch (err) {
      alert("Error saving expense: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense record?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`, { headers: headers() });
      fetchExpenses();
    } catch (err) {
      alert("Error deleting expense");
    }
  };

  const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-rose-500" /> Daily Expenses
            </h1>
            <p className="text-sm text-gray-500 mt-1">Record and track operational business expenses</p>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
          <h2 className="text-gray-500 font-semibold">Total Expenses Recorded</h2>
          <span className="text-3xl font-extrabold text-rose-600">₹{total.toFixed(2)}</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description / Note</th>
                <th className="px-6 py-4">Payment Mode</th>
                <th className="px-6 py-4 text-right">Amount (₹)</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {new Date(e.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric'})}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{e.category}</td>
                  <td className="px-6 py-4 text-gray-500">{e.note || "—"}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold uppercase">
                      {e.paymentMode}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-rose-600">₹{e.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600 transition">
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No expenses recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Add New Expense</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                  <input type="date" required value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white">
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                  <input type="number" step="0.01" required value={form.amount} onChange={e=>setForm({...form, amount:parseFloat(e.target.value)||""})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Mode</label>
                  <select value={form.paymentMode} onChange={e=>setForm({...form, paymentMode:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer / Cheque</option>
                    <option value="upi">UPI / QR</option>
                    <option value="credit">Credit / Payable Later</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Note / Description</label>
                  <textarea rows="2" value={form.note} onChange={e=>setForm({...form, note:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" placeholder="Optional details..."></textarea>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-semibold transition">Save Expense</button>
                  <button type="button" onClick={()=>setShowModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-semibold transition">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
