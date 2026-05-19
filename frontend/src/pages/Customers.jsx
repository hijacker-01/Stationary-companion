import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const emptyCustomer = { name:"", phone:"", email:"", address:"", gstNumber:"", creditLimit:0, creditDays:30, openingBalance:0 };
const emptyPayment = { amount:"", mode:"cash", reference:"", note:"" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [form, setForm] = useState(emptyCustomer);
  const [editId, setEditId] = useState(null);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [payForm, setPayForm] = useState(emptyPayment);
  const [search, setSearch] = useState("");
  const [filterBalance, setFilterBalance] = useState("all");

  const fetchCustomers = () =>
    axios.get("http://localhost:5000/api/customers", { headers: headers() })
      .then(r => setCustomers(r.data));

  useEffect(() => { fetchCustomers(); }, []);

  const fetchLedger = async (customer) => {
    const res = await axios.get(`http://localhost:5000/api/customers/${customer.id}/ledger`, { headers: headers() });
    setLedger(res.data);
    setActiveCustomer(customer);
    setShowLedger(true);
  };

  const handleSave = async () => {
    if (!form.name) return alert("Customer name required");
    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/customers/${editId}`, form, { headers: headers() });
      } else {
        await axios.post("http://localhost:5000/api/customers", form, { headers: headers() });
      }
      setShowModal(false); setForm(emptyCustomer); setEditId(null);
      fetchCustomers();
    } catch(err) { alert(err.response?.data?.error || "Error"); }
  };

  const handlePayment = async () => {
    if (!payForm.amount || payForm.amount <= 0) return alert("Enter valid amount");
    try {
      await axios.post(`http://localhost:5000/api/customers/${activeCustomer.id}/payment`,
        payForm, { headers: headers() });
      setShowPayment(false); setPayForm(emptyPayment);
      fetchCustomers();
      if (showLedger) fetchLedger(activeCustomer);
    } catch(err) { alert(err.response?.data?.error || "Error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    await axios.delete(`http://localhost:5000/api/customers/${id}`, { headers: headers() });
    fetchCustomers();
  };

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search);
    const matchBalance = filterBalance === "all" ||
      (filterBalance === "due" && c.balance > 0) ||
      (filterBalance === "clear" && c.balance <= 0);
    return matchSearch && matchBalance;
  });

  const totalDue = customers.reduce((s, c) => s + (c.balance || 0), 0);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">👤 Customers & Ledger</h1>
            <p className="text-sm text-gray-500 mt-1">Manage customers, credit and payment history</p>
          </div>
          <button onClick={() => { setForm(emptyCustomer); setEditId(null); setShowModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow">
            + Add Customer
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label:"Total Customers", value: customers.length, icon:"👥", color:"bg-blue-600" },
            { label:"Total Due", value:`₹${totalDue.toFixed(2)}`, icon:"💸", color:"bg-red-500" },
            { label:"With Balance", value: customers.filter(c=>c.balance>0).length, icon:"⚠️", color:"bg-orange-500" },
            { label:"Clear Accounts", value: customers.filter(c=>c.balance<=0).length, icon:"✅", color:"bg-green-600" },
          ].map(c => (
            <div key={c.label} className={`${c.color} text-white rounded-2xl p-5 shadow`}>
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-sm opacity-80 mt-1">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
          <input type="text" placeholder="🔍 Search by name or phone..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <div className="flex gap-2">
            {[
              { key:"all", label:"All" },
              { key:"due", label:"⚠️ Has Balance" },
              { key:"clear", label:"✅ Clear" },
            ].map(f => (
              <button key={f.key} onClick={() => setFilterBalance(f.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterBalance === f.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-400 ml-auto">{filtered.length} customers</span>
        </div>

        {/* Customer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                    c.balance > 0 ? "bg-red-500" : "bg-green-500"
                  }`}>
                    {c.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{c.name}</p>
                    <p className="text-gray-400 text-xs">{c.phone || "No phone"}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  c.balance > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                }`}>
                  {c.balance > 0 ? `Due ₹${c.balance.toFixed(2)}` : "Clear"}
                </span>
              </div>

              <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                {c.email && <p>📧 {c.email}</p>}
                {c.gstNumber && <p>🏛️ {c.gstNumber}</p>}
                <p>💳 Credit Limit: ₹{c.creditLimit} / {c.creditDays} days</p>
                <p>🛒 Total Purchased: <span className="font-semibold text-gray-700">₹{c.totalPurchased || 0}</span></p>
                <p>💵 Total Paid: <span className="font-semibold text-green-600">₹{c.totalPaid || 0}</span></p>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => fetchLedger(c)}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg text-xs font-semibold">
                  📒 Ledger
                </button>
                <button onClick={() => { setActiveCustomer(c); setPayForm(emptyPayment); setShowPayment(true); }}
                  className="flex-1 bg-green-50 hover:bg-green-100 text-green-600 py-2 rounded-lg text-xs font-semibold">
                  💵 Payment
                </button>
                <button onClick={() => { setForm(c); setEditId(c.id); setShowModal(true); }}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-500 px-3 py-2 rounded-lg text-xs font-semibold">
                  ✏️
                </button>
                <button onClick={() => handleDelete(c.id)}
                  className="bg-red-50 hover:bg-red-100 text-red-500 px-3 py-2 rounded-lg text-xs font-semibold">
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">👤</div>
              <p>No customers found. Add your first customer!</p>
            </div>
          )}
        </div>

        {/* ── ADD/EDIT MODAL ── */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">{editId?"Edit":"Add"} Customer</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key:"name", label:"Full Name *", placeholder:"Customer name" },
                  { key:"phone", label:"Phone", placeholder:"Mobile number" },
                  { key:"email", label:"Email", placeholder:"email@example.com" },
                  { key:"gstNumber", label:"GST Number", placeholder:"GSTIN (optional)" },
                  { key:"creditLimit", label:"Credit Limit ₹", placeholder:"0" },
                  { key:"creditDays", label:"Credit Days", placeholder:"30" },
                  { key:"openingBalance", label:"Opening Balance ₹", placeholder:"0" },
                ].map(f => (
                  <div key={f.key} className={f.key==="name"?"col-span-2":""}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                    <input type="text" placeholder={f.placeholder}
                      value={form[f.key] || ""}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                  <textarea rows={2} placeholder="Full address"
                    value={form.address || ""}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleSave}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm">
                  {editId?"Update":"Add"} Customer
                </button>
                <button onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PAYMENT MODAL ── */}
        {showPayment && activeCustomer && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">💵 Collect Payment</h2>
                <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="font-bold text-gray-800">{activeCustomer.name}</p>
                <p className="text-red-500 text-sm mt-1">Outstanding: ₹{activeCustomer.balance?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount ₹ *</label>
                  <input type="number" placeholder="Enter amount"
                    value={payForm.amount}
                    onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Mode</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["cash","upi","card","bank"].map(m => (
                      <button key={m} onClick={() => setPayForm({ ...payForm, mode: m })}
                        className={`py-2 rounded-lg text-xs font-medium capitalize border transition ${
                          payForm.mode === m ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}>
                        {m === "cash"?"💵":m === "upi"?"📱":m === "card"?"💳":"🏦"} {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reference / Cheque No</label>
                  <input type="text" placeholder="Optional"
                    value={payForm.reference}
                    onChange={e => setPayForm({ ...payForm, reference: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
                  <input type="text" placeholder="Optional note"
                    value={payForm.note}
                    onChange={e => setPayForm({ ...payForm, note: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handlePayment}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm">
                  ✅ Collect ₹{payForm.amount || 0}
                </button>
                <button onClick={() => setShowPayment(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── LEDGER MODAL ── */}
        {showLedger && ledger && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">📒 Customer Ledger</h2>
                    <p className="text-blue-600 font-semibold mt-1">{ledger.customer?.name}</p>
                    <p className="text-gray-400 text-xs">{ledger.customer?.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Closing Balance</p>
                    <p className={`text-2xl font-bold ${ledger.finalBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                      ₹{ledger.finalBalance?.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {ledger.finalBalance > 0 ? "Amount Due" : "Advance / Clear"}
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label:"Total Invoiced", value:`₹${ledger.entries?.filter(e=>e.debit>0).reduce((s,e)=>s+e.debit,0).toFixed(2)}`, color:"text-red-600" },
                    { label:"Total Paid", value:`₹${ledger.entries?.filter(e=>e.credit>0).reduce((s,e)=>s+e.credit,0).toFixed(2)}`, color:"text-green-600" },
                    { label:"Balance Due", value:`₹${ledger.finalBalance?.toFixed(2)}`, color: ledger.finalBalance>0?"text-red-600":"text-green-600" },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Ledger Table */}
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Reference</th>
                      <th className="px-4 py-3 text-right">Debit (Dr)</th>
                      <th className="px-4 py-3 text-right">Credit (Cr)</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ledger.entries?.map((entry, i) => (
                      <tr key={i} className={`hover:bg-gray-50 ${
                        entry.type==="Payment" ? "bg-green-50/30" : ""
                      }`}>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(entry.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.type==="Payment" ? "bg-green-100 text-green-700" :
                            entry.type==="Invoice" ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{entry.ref}</td>
                        <td className="px-4 py-3 text-right text-red-600 font-medium">
                          {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">
                          {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : "—"}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold ${entry.balance>0?"text-red-600":"text-green-600"}`}>
                          ₹{entry.balance?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {!ledger.entries?.length && (
                      <tr><td colSpan={6} className="text-center py-10 text-gray-400">No transactions yet</td></tr>
                    )}
                  </tbody>
                </table>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setActiveCustomer(ledger.customer); setPayForm(emptyPayment); setShowPayment(true); }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm">
                    💵 Collect Payment
                  </button>
                  <button onClick={() => setShowLedger(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}