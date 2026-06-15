import { useEffect, useState } from "react";
import axios from "../api/axios";
import PageLayout from "../components/PageLayout";
import SmartSelect from "../components/SmartSelect";
import { focusFirstField } from "../utils/focusHelpers";
import { 
  Plus, Search, Trash2, ArrowUpRight, ArrowDownLeft, 
  FileText, Landmark, Wallet, CreditCard, ClipboardList, User 
} from "lucide-react";

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
    axios.get("/vouchers")
      .then(res => setVouchers(res.data?.rows || res.data?.items || res.data?.data || res.data || []))
      .catch(err => console.error(err));
  };

  const fetchParties = () => {
    axios.get("/customers")
      .then(res => setCustomers(res.data?.rows || res.data?.items || res.data?.data || res.data || []));
    axios.get("/suppliers")
      .then(res => setSuppliers(res.data?.rows || res.data?.items || res.data?.data || res.data || []));
  };

  useEffect(() => {
    fetchVouchers();
    fetchParties();
  }, []);

  const handleCreateVoucher = async () => {
    if (!form.partyId || !form.amount || parseFloat(form.amount) <= 0) {
      return 
    }

    const partyList = form.type === "customer" ? customers : suppliers;
    const selectedParty = partyList.find(p => p.id === parseInt(form.partyId));
    
    const payload = {
      ...form,
      partyName: selectedParty ? selectedParty.name : ""
    };

    try {
      await axios.post("/vouchers", payload);
      setShowModal(false);
      setForm(emptyForm);
      fetchVouchers();
      fetchParties(); // update party balances
      
    } catch (err) {
      
    }
  };

  const handleDeleteVoucher = async (id) => {
    if (!window.confirm("Are you sure you want to reverse this voucher transaction? This will restore/decrement account balances.")) return;
    try {
      await axios.delete(`/vouchers/${id}`);
      fetchVouchers();
      fetchParties();
      
    } catch (err) {
      
    }
  };

  const filtered = vouchers.filter(v =>
    v.voucherNo?.toLowerCase().includes(search.toLowerCase()) ||
    v.partyName?.toLowerCase().includes(search.toLowerCase()) ||
    v.reference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageLayout
      title="Voucher Accounting"
      subtitle="Manage receipt vouchers, supplier payment payouts, and ledger balance adjustments."
      actions={
        <button
          onClick={() => { setForm(emptyForm); setShowModal(true); focusFirstField('.fixed.inset-0.z-50'); }}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Create Voucher
        </button>
      }
    >
        {/* Search */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search vouchers by voucher number, account ledger name, or transaction reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Vouchers Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Date</th>
                <th>Party Ledger</th>
                <th>Account Name</th>
                <th>Type</th>
                <th>Settlement</th>
                <th>Reference No</th>
                <th>Amount</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td className="font-mono text-teal-600 font-bold text-xs">{v.voucherNo}</td>
                  <td className="text-slate-600 font-medium text-xs">
                    {new Date(v.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="text-slate-600 font-semibold capitalize text-xs">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      v.type === "customer" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-purple-50 text-purple-700 border-purple-200"
                    }`}>
                      {v.type}
                    </span>
                  </td>
                  <td className="font-semibold text-slate-900">{v.partyName}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      v.direction === "in" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      {v.direction === "in" ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      {v.direction === "in" ? "Receipt" : "Payment"}
                    </span>
                  </td>
                  <td className="capitalize text-slate-600 font-semibold text-xs">{v.mode}</td>
                  <td className="text-slate-400 font-mono text-xs">{v.reference || "—"}</td>
                  <td className="font-extrabold text-slate-950 text-sm">₹{v.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="text-center">
                    <button
                      onClick={() => handleDeleteVoucher(v.id)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                    >
                      Delete/Reverse
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-medium">
                    No accounting vouchers found. Create your first transaction.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create Voucher Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-slate-900">Record Account Voucher</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer">&times;</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Direction */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Direction</label>
                  <SmartSelect
                    value={form.direction}
                    onChange={e => setForm({ ...form, direction: e.target.value })}
                    className="form-input bg-white"
                    options={[
                      { value: 'in', label: 'Receipt (Cash Inward)' },
                      { value: 'out', label: 'Payment (Cash Outward)' }
                    ]}
                  />
                </div>

                {/* Party Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Party Type</label>
                  <SmartSelect
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value, partyId: "" })}
                    className="form-input bg-white"
                    options={[
                      { value: 'customer', label: 'Customer Ledger' },
                      { value: 'supplier', label: 'Supplier Ledger' }
                    ]}
                  />
                </div>

                {/* Selected Party */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Party Account</label>
                  <SmartSelect
                    value={form.partyId}
                    onChange={e => setForm({ ...form, partyId: e.target.value })}
                    className="form-input bg-white"
                    options={[
                      { value: "", label: "-- Choose Party Ledger Account --" },
                      ...(form.type === "customer"
                        ? customers.map(c => ({ value: c.id, label: `${c.name} (Balance: ₹${c.balance?.toFixed(2)})` }))
                        : suppliers.map(s => ({ value: s.id, label: `${s.name} (Balance: ₹${s.outstanding?.toFixed(2)})` }))
                      )
                    ]}
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter amount"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="form-input font-bold text-slate-800"
                  />
                </div>

                {/* Mode */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Mode</label>
                  <SmartSelect
                    value={form.mode}
                    onChange={e => setForm({ ...form, mode: e.target.value })}
                    className="form-input bg-white"
                    options={[
                      { value: 'cash', label: 'Cash' },
                      { value: 'upi', label: 'UPI / QR Transfer' },
                      { value: 'card', label: 'POS Terminal Card' },
                      { value: 'bank', label: 'Direct Bank NetBanking' }
                    ]}
                  />
                </div>

                {/* Reference No */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reference/Instrument ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="Transaction ID, Cheque No, Bank reference, etc."
                    value={form.reference}
                    onChange={e => setForm({ ...form, reference: e.target.value })}
                    className="form-input"
                  />
                </div>

                {/* Note */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Accounting Remarks / Notes</label>
                  <textarea
                    rows="3"
                    placeholder="Brief description for transaction ledger..."
                    value={form.note}
                    onChange={e => setForm({ ...form, note: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateVoucher}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer shadow transition"
                >
                  Save Voucher
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    </PageLayout>
  );
}
