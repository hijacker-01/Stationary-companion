import { useEffect, useState } from "react";
import axios from "../api/axios";
import PageLayout from "../components/PageLayout";
import DataState from "../components/DataState";
import { useDebounce } from "use-debounce";
import { toast } from "react-hot-toast";
import { useConfirm } from "../hooks/useConfirm";
import {
  Users, IndianRupee, AlertTriangle, CheckCircle2, Search,
  BookOpen, Wallet, Pencil, Trash2, Mail, Landmark, CreditCard,
  ShoppingCart, Plus, Smartphone, X
} from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const emptyCustomer = { name:"", phone:"", email:"", address:"", gstNumber:"", creditLimit:0, creditDays:30, openingBalance:0 };
const emptyPayment = { amount:"", mode:"cash", reference:"", note:"" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [form, setForm] = useState(emptyCustomer);
  const [editId, setEditId] = useState(null);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [payForm, setPayForm] = useState(emptyPayment);
  
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [filterBalance, setFilterBalance] = useState("all");

  const { confirm, ConfirmModalComponent } = useConfirm();

  const fetchCustomers = () => {
    setIsLoading(true);
    axios.get(`/customers?page=${page}&limit=50&search=${debouncedSearch}&includeInactive=${includeInactive}`)
      .then(r => {
        setCustomers(r.data.data);
        setTotal(r.data.total);
        setPage(r.data.page);
        setTotalPages(r.data.totalPages);
      })
      .catch(err => {
        console.error("Failed to fetch customers:", err);
        toast.error("Failed to load customers");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { 
    fetchCustomers(); 
  }, [page, debouncedSearch, includeInactive]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchLedger = async (customer) => {
    try {
      const res = await axios.get(`/customers/${customer.id}/ledger`);
      setLedger(res.data);
      setActiveCustomer(customer);
      setShowLedger(true);
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
      
    }
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error("Customer name is required"); return; }
    
    try {
      if (editId) {
        await axios.put(`/customers/${editId}`, form);
        toast.success("Customer updated successfully");
      } else {
        await axios.post("/customers", form);
        toast.success("Customer added successfully");
      }
      setShowModal(false); setForm(emptyCustomer); setEditId(null);
      fetchCustomers();
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to save customer");
    }
  };

  const handlePayment = async () => {
    const amt = parseFloat(payForm.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Valid positive amount is required");
      return;
    }
    try {
      await axios.post(`/customers/${payForm.customerId}/payment`, payForm);
      toast.success("Payment recorded successfully");
      setShowPayment(false); setPayForm(emptyPayment);
      fetchCustomers();
      if (showLedger && activeCustomer) fetchLedger(activeCustomer);
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to process payment");
    }
  };

  const handleDelete = async (customer) => {
    const isConfirmed = await confirm({
      title: `Delete ${customer.name}?`,
      message: "This action cannot be undone. If this customer has existing invoices, you may need to deactivate them instead."
    });
    
    if (!isConfirmed) return;
    
    try {
      await axios.delete(`/customers/${customer.id}`);
      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (err) {
      console.error('Failed to delete customer:', err);
      toast.error(err.response?.data?.suggestion || err.response?.data?.message || "Failed to delete customer");
    }
  };

  const handleToggleActive = async (customer) => {
    const action = customer.isActive ? 'deactivate' : 'activate';
    try {
      await axios.patch(`/customers/${customer.id}/${action}`);
      toast.success(`Customer ${action}d successfully`);
      fetchCustomers();
    } catch (err) {
      toast.error(`Failed to ${action} customer`);
    }
  };

  const totalDue = customers.reduce((s, c) => s + (c.balance || 0), 0);

  const summaryCards = [
    { label:"Total Customers", value: total, icon: Users, borderColor:"border-l-teal-500", color:"bg-teal-50 text-teal-600" },
    { label:"Total Due", value:`₹${totalDue.toFixed(2)}`, icon: IndianRupee, borderColor:"border-l-red-500", color:"bg-red-50 text-red-600" },
    { label:"With Balance", value: customers.filter(c=>c.balance>0).length, icon: AlertTriangle, borderColor:"border-l-amber-500", color:"bg-amber-50 text-amber-600" },
    { label:"Clear Accounts", value: customers.filter(c=>c.balance<=0).length, icon: CheckCircle2, borderColor:"border-l-emerald-500", color:"bg-emerald-50 text-emerald-600" },
  ];

  const filterTabs = [
    { key:"all", label:"All", icon: Users },
    { key:"due", label:"Has Balance", icon: AlertTriangle },
    { key:"clear", label:"Clear", icon: CheckCircle2 },
  ];

  return (
    <PageLayout
      title="Customers & Ledger"
      subtitle="Manage customers, credit and payment history"
      actions={
        <button onClick={() => { setForm(emptyCustomer); setEditId(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer">
          <Plus className="w-4.5 h-4.5" /> Add Customer
        </button>
      }
    >

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

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-3 flex-1 min-w-48">
            <Search className="w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Search by name or phone..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none" />
          </div>
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-2 text-sm text-slate-600 mr-4 cursor-pointer">
              <input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
              Show Inactive
            </label>
            {filterTabs.map(f => {
              const FIcon = f.icon;
              return (
                <button key={f.key} onClick={() => setFilterBalance(f.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition cursor-pointer ${
                    filterBalance === f.key ? "bg-teal-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  }`}>
                  <FIcon className="w-4 h-4" />
                  {f.label}
                </button>
              );
            })}
          </div>
          <span className="text-sm text-slate-400 ml-auto">{total} customers</span>
        </div>

        <DataState
          loading={isLoading}
          empty={customers.length === 0}
          loadingLabel="Loading customers…"
          emptyProps={{ icon: "Users", title: "No customers found", description: "Add your first customer to start tracking balances and creating invoices.", actionLabel: "Add Customer", onAction: () => { setForm(emptyCustomer); setEditId(null); setShowModal(true); } }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map(c => (
              <div key={c.id} className={`bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-150 ${!c.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                      c.balance > 0 ? "bg-red-500" : "bg-green-500"
                    }`}>
                      {c.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900">{c.name}</p>
                        {!c.isActive && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 uppercase">Inactive</span>}
                      </div>
                      <p className="text-slate-400 text-xs">{c.phone || "No phone"}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${
                    c.balance > 0 ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"
                  }`}>
                    {c.balance > 0 ? `Due ₹${c.balance.toFixed(2)}` : "Clear"}
                  </span>
                </div>

              <div className="space-y-1.5 text-sm text-slate-500 mb-4">
                {c.email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {c.email}</p>}
                {c.gstNumber && <p className="flex items-center gap-2"><Landmark className="w-3.5 h-3.5 text-slate-400" /> {c.gstNumber}</p>}
                <p className="flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 text-slate-400" /> Credit Limit: ₹{c.creditLimit} / {c.creditDays} days</p>
                <p className="flex items-center gap-2"><ShoppingCart className="w-3.5 h-3.5 text-slate-400" /> Total Purchased: <span className="font-semibold text-slate-700">₹{c.totalPurchased || 0}</span></p>
                <p className="flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5 text-slate-400" /> Total Paid: <span className="font-semibold text-green-600">₹{c.totalPaid || 0}</span></p>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => fetchLedger(c)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-600 py-2 rounded-lg text-xs font-semibold cursor-pointer transition">
                  <BookOpen className="w-3.5 h-3.5" /> Ledger
                </button>
                <button onClick={() => { setActiveCustomer(c); setPayForm({...emptyPayment, customerId: c.id}); setShowPayment(true); }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-600 py-2 rounded-lg text-xs font-semibold cursor-pointer transition">
                  <IndianRupee className="w-3.5 h-3.5" /> Payment
                </button>
                <button onClick={() => { setForm(c); setEditId(c.id); setShowModal(true); }}
                  className="flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(c)}
                  className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleToggleActive(c)}
                  className="flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition"
                  title={c.isActive ? "Deactivate" : "Reactivate"}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          </div>
        </DataState>

        {total > 0 && !isLoading && (
          <div className="mt-8 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-900">{(page - 1) * 50 + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(page * 50, total)}</span> of <span className="font-semibold text-slate-900">{total}</span> records
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => p - 1)} 
                disabled={page === 1}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-semibold text-slate-700">Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => p + 1)} 
                disabled={page === totalPages}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">{editId?"Edit":"Add"} Customer</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
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
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{f.label}</label>
                    <input type="text" placeholder={f.placeholder}
                      value={form[f.key] || ""}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="form-input" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Address</label>
                  <textarea rows={2} placeholder="Full address"
                    value={form.address || ""}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="form-input" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleSave}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                  {editId?"Update":"Add"} Customer
                </button>
                <button onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showPayment && activeCustomer && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <IndianRupee className="w-5 h-5 text-green-600" /> Collect Payment
                </h2>
                <button onClick={() => setShowPayment(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <p className="font-bold text-slate-900">{activeCustomer.name}</p>
                <p className="text-red-500 text-sm mt-1">Outstanding: ₹{activeCustomer.balance?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount ₹ *</label>
                  <input type="number" placeholder="Enter amount"
                    value={payForm.amount}
                    onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                    className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Mode</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["cash","upi","card","bank"].map(m => {
                      const icons = { cash: Wallet, upi: Smartphone, card: CreditCard, bank: Landmark };
                      const MIcon = icons[m];
                      return (
                        <button key={m} onClick={() => setPayForm({ ...payForm, mode: m })}
                          className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-xs font-bold border cursor-pointer transition-all duration-150 ${
                            payForm.mode === m ? "bg-teal-50 border-teal-500 text-teal-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}>
                          <MIcon className="w-4 h-4 mb-1" />
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reference / Cheque No</label>
                  <input type="text" placeholder="Optional"
                    value={payForm.reference}
                    onChange={e => setPayForm({ ...payForm, reference: e.target.value })}
                    className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Note</label>
                  <input type="text" placeholder="Optional note"
                    value={payForm.note}
                    onChange={e => setPayForm({ ...payForm, note: e.target.value })}
                    className="form-input" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handlePayment}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                  <CheckCircle2 className="w-4 h-4" /> Collect ₹{payForm.amount || 0}
                </button>
                <button onClick={() => setShowPayment(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showLedger && ledger && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-100">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                      <BookOpen className="w-5 h-5 text-teal-600" /> Customer Ledger
                    </h2>
                    <p className="text-teal-600 font-semibold mt-1">{ledger.customer?.name}</p>
                    <p className="text-slate-400 text-xs">{ledger.customer?.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Closing Balance</p>
                    <p className={`text-2xl font-bold ${ledger.finalBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                      ₹{ledger.finalBalance?.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label:"Total Invoiced", value:`₹${(ledger.entries || []).filter(e=>e.debit>0).reduce((s,e)=>s+parseFloat(e.debit),0).toFixed(2)}`, color:"text-red-600" },
                    { label:"Total Paid", value:`₹${(ledger.entries || []).filter(e=>e.credit>0).reduce((s,e)=>s+parseFloat(e.credit),0).toFixed(2)}`, color:"text-green-600" },
                    { label:"Balance Due", value:`₹${ledger.finalBalance?.toFixed(2)}`, color: ledger.finalBalance>0?"text-red-600":"text-green-600" },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Ledger Table */}
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Reference</th>
                        <th className="text-right">Debit (Dr)</th>
                        <th className="text-right">Credit (Cr)</th>
                        <th className="text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.entries?.map((entry, i) => (
                        <tr key={i} className={entry.type==="Payment" ? "bg-green-50/30" : ""}>
                          <td className="text-slate-500 text-xs">
                            {new Date(entry.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
                          </td>
                          <td>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${
                              entry.type==="Payment" ? "bg-green-50 text-green-700 border-green-200" :
                              entry.type==="Invoice" ? "bg-teal-50 text-teal-700 border-teal-200" :
                              "bg-slate-50 text-slate-600 border-slate-200"
                            }`}>
                              {entry.type}
                            </span>
                          </td>
                          <td className="font-mono text-xs text-slate-600">{entry.ref}</td>
                          <td className="text-right text-red-600 font-medium">
                            {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : "—"}
                          </td>
                          <td className="text-right text-green-600 font-medium">
                            {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : "—"}
                          </td>
                          <td className={`text-right font-bold ${entry.balance>0?"text-red-600":"text-green-600"}`}>
                            ₹{entry.balance?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {!ledger.entries?.length && (
                        <tr><td colSpan={6} className="text-center py-10 text-slate-400">No transactions yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setActiveCustomer(ledger.customer); setPayForm(emptyPayment); setShowPayment(true); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                    <IndianRupee className="w-4 h-4" /> Collect Payment
                  </button>
                  <button onClick={() => setShowLedger(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      <ConfirmModalComponent />
    </PageLayout>
  );
}