import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const emptyForm = {
  type: "customer",
  partyId: "",
  partyName: "",
  amount: "",
  mode: "cash",
  reference: "",
  note: "",
  direction: "in"
};

export default function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const fetchVouchers = () => {
    axios.get("http://localhost:5000/api/vouchers", { headers: headers() })
      .then(res => setVouchers(res.data))
      .catch(err => console.error(err));
  };

  const fetchParties = () => {
    axios.get("http://localhost:5000/api/customers", { headers: headers() })
      .then(res => setCustomers(res.data || []));
    axios.get("http://localhost:5000/api/suppliers", { headers: headers() })
      .then(res => setSuppliers(res.data || []));
  };

  useEffect(() => {
    fetchVouchers();
    fetchParties();
  }, []);

  const handleCreateVoucher = async () => {
    if (!form.partyId || !form.amount || parseFloat(form.amount) <= 0) {
      return alert("Please select a valid party and amount.");
    }

    const partyList = form.type === "customer" ? customers : suppliers;
    const selectedParty = partyList.find(p => p.id === parseInt(form.partyId));
    
    const payload = {
      ...form,
      partyName: selectedParty ? selectedParty.name : ""
    };

    try {
      await axios.post("http://localhost:5000/api/vouchers", payload, { headers: headers() });
      setShowModal(false);
      setForm(emptyForm);
      fetchVouchers();
      fetchParties(); // update party balances
      alert("Voucher created successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create voucher");
    }
  };

  const handleDeleteVoucher = async (id) => {
    if (!window.confirm("Are you sure you want to reverse this voucher transaction? This will restore/decrement account balances.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/vouchers/${id}`, { headers: headers() });
      fetchVouchers();
      fetchParties();
      alert("Voucher reversed and account balances updated.");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete voucher");
    }
  };

  const filtered = vouchers.filter(v =>
    v.voucherNo?.toLowerCase().includes(search.toLowerCase()) ||
    v.partyName?.toLowerCase().includes(search.toLowerCase()) ||
    v.reference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">💵 Voucher Accounting</h1>
            <p className="text-sm text-gray-500 mt-1">Receipt Vouchers & Payment Vouchers</p>
          </div>
          <button
            onClick={() => { setForm(emptyForm); setShowModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow transition"
          >
            + Create Voucher
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6">
          <input
            type="text"
            placeholder="🔍 Search vouchers by number, party name, or ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Vouchers Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-6 py-4 text-left">Voucher No</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Party Type</th>
                <th className="px-6 py-4 text-left">Party Name</th>
                <th className="px-6 py-4 text-left">Direction</th>
                <th className="px-6 py-4 text-left">Mode</th>
                <th className="px-6 py-4 text-left">Reference No</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-blue-600 text-xs font-semibold">{v.voucherNo}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(v.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{v.type}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{v.partyName}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                      v.direction === "in" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {v.direction === "in" ? "📥 Receipt" : "📤 Payment"}
                    </span>
                  </td>
                  <td className="px-6 py-4 capitalize text-gray-600 font-medium">{v.mode}</td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs">{v.reference || "—"}</td>
                  <td className="px-6 py-4 text-right font-black text-gray-900 text-base">₹{v.amount?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteVoucher(v.id)}
                      className="text-red-500 hover:text-red-700 hover:underline text-xs font-bold"
                    >
                      Delete/Reverse
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400 font-medium">
                    No vouchers recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create Voucher Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">💵 Record Account Voucher</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Direction */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Direction</label>
                  <select
                    value={form.direction}
                    onChange={e => setForm({ ...form, direction: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="in">📥 Receipt (Cash In)</option>
                    <option value="out">📤 Payment (Cash Out)</option>
                  </select>
                </div>

                {/* Party Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Party Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value, partyId: "" })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="customer">Customer (Ledger)</option>
                    <option value="supplier">Supplier (Ledger)</option>
                  </select>
                </div>

                {/* Selected Party */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Select Party</label>
                  <select
                    value={form.partyId}
                    onChange={e => setForm({ ...form, partyId: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">-- Choose Party --</option>
                    {form.type === "customer"
                      ? customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name} (Outstanding: ₹{c.balance?.toFixed(2)})</option>
                        ))
                      : suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name} (Outstanding: ₹{s.outstanding?.toFixed(2)})</option>
                        ))
                    }
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter amount"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Mode */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Mode</label>
                  <select
                    value={form.mode}
                    onChange={e => setForm({ ...form, mode: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>

                {/* Reference No */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reference/Instrument No (Optional)</label>
                  <input
                    type="text"
                    placeholder="Txn ID, Check No, Cheque No, etc."
                    value={form.reference}
                    onChange={e => setForm({ ...form, reference: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Note */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Remarks</label>
                  <textarea
                    rows="3"
                    placeholder="Enter additional description..."
                    value={form.note}
                    onChange={e => setForm({ ...form, note: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateVoucher}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  Save Voucher
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition"
                >
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
