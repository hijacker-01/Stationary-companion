import { useEffect, useState, Fragment } from "react";
import axios from "../api/axios";
import PageLayout from "../components/PageLayout";
import { useDebounce } from "use-debounce";
import { toast } from "react-hot-toast";
import EmptyState from "../components/EmptyState";
import { useConfirm } from "../hooks/useConfirm";
import SmartSelect from "../components/SmartSelect";
import { focusFirstField } from "../utils/focusHelpers";
import {
  Factory,
  ClipboardList,
  Clock,
  IndianRupee,
  Search,
  Phone,
  Mail,
  Landmark,
  CreditCard,
  Pencil,
  Trash2,
  Gift,
  DollarSign,
  Package,
  CheckCircle2,
  Plus,
  AlertTriangle,
} from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });
const GST_RATES = [0, 5, 12, 18, 28];

const emptySupplier = { name:"", phone:"", email:"", address:"", gstNumber:"", panNumber:"", contactPerson:"", creditLimit:0, creditDays:30 };
const emptyItem = { name:"", batch:"", hsn:"", pack:"", category:"", qty:1, scheme_qty:0, unit:"units", selling_price:"", mrp:"", cost_price:"", gst:12, expiry:"" };

const STATUS_COLOR = {
  pending:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  received:  "bg-green-100 text-green-700 border-green-200",
  partial:   "bg-teal-100 text-teal-700 border-teal-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default function Suppliers() {
  const [tab, setTab] = useState("suppliers");
  const [suppliers, setSuppliers] = useState([]);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [orders, setOrders] = useState([]);
  
  const [showSupModal, setShowSupModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [supForm, setSupForm] = useState(emptySupplier);
  const [editSupId, setEditSupId] = useState(null);
  const [poItems, setPoItems] = useState([{ ...emptyItem }]);
  const [poSupplier, setPoSupplier] = useState("");
  const [poExpected, setPoExpected] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poPayMode, setPoPayMode] = useState("credit");
  const [activeOrder, setActiveOrder] = useState(null);
  const [receiveAmount, setReceiveAmount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [allSchemes, setAllSchemes] = useState([]);
  const [poItemSchemes, setPoItemSchemes] = useState({});

  const { confirm, ConfirmModalComponent } = useConfirm();

  const fetchSuppliers = () => {
    setIsLoading(true);
    axios.get(`/suppliers?page=${page}&limit=50&search=${debouncedSearch}&includeInactive=${includeInactive}`)
      .then(r => {
        setSuppliers(r.data.data);
        setTotalSuppliers(r.data.total);
        setPage(r.data.page);
        setTotalPages(r.data.totalPages);
      })
      .catch(err => {
        console.error('Failed to fetch suppliers:', err);
        toast.error('Failed to load suppliers');
      })
      .finally(() => setIsLoading(false));
  };

  const fetchOrders = () =>
    axios.get("/suppliers/orders").then(r => setOrders(r.data)).catch(err => console.error('Failed to fetch orders:', err));
  const fetchSchemes = () =>
    axios.get("/schemes").then(r => setAllSchemes(r.data)).catch(err => console.error('Failed to fetch schemes:', err));

  useEffect(() => { fetchOrders(); fetchSchemes(); }, []);
  useEffect(() => { fetchSuppliers(); }, [page, debouncedSearch, includeInactive]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  // Check scheme for a PO item
  const checkPOScheme = async (index, itemName, qty) => {
    if (!itemName) {
      setPoItemSchemes(prev => { const n = { ...prev }; delete n[index]; return n; });
      return;
    }
    try {
      const res = await axios.get("/schemes/check", {
        params: { itemName, qty },
        
      });
      setPoItemSchemes(prev => ({ ...prev, [index]: res.data }));
    } catch {
      setPoItemSchemes(prev => { const n = { ...prev }; delete n[index]; return n; });
    }
  };

  // PO Calculations
  const subtotal = poItems.reduce((s, i) => s + parseFloat(i.cost_price || 0) * parseInt(i.qty || 1), 0);
  const gstAmount = poItems.reduce((s, i) => {
    const base = parseFloat(i.cost_price || 0) * parseInt(i.qty || 1);
    return s + (base * i.gst) / 100;
  }, 0);
  const total = subtotal + gstAmount;

  const handleSaveSupplier = async () => {
    if (!supForm.name?.trim()) { toast.error("Supplier name is required"); return; }
    try {
      if (editSupId) {
        await axios.put(`/suppliers/${editSupId}`, supForm);
        toast.success("Supplier updated successfully");
      } else {
        await axios.post("/suppliers", supForm);
        toast.success("Supplier added successfully");
      }
      setShowSupModal(false); setSupForm(emptySupplier); setEditSupId(null);
      fetchSuppliers();
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to save supplier");
    }
  };

  const handleSavePO = async () => {
    if (!poSupplier) { toast.error("Please select a supplier"); return; }
    const validItems = poItems.filter(i => i.name);
    if (validItems.length === 0) { toast.error("Please add at least one item"); return; }
    const sup = suppliers.find(s => s.name.toLowerCase() === poSupplier.toLowerCase());
    try {
      await axios.post("/suppliers/orders", {
        supplierId: sup?.id,
        supplierName: poSupplier,
        items: poItems.filter(i => i.name),
        subtotal: parseFloat(subtotal.toFixed(2)),
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        balanceDue: parseFloat(total.toFixed(2)),
        paymentMode: poPayMode,
        expectedDate: poExpected || null,
        notes: poNotes,
        status: "pending",
      });
      toast.success("Purchase order created successfully");
      setShowPOModal(false);
      setPoItems([{ ...emptyItem }]);
      setPoSupplier(""); setPoNotes(""); setPoExpected("");
      setPoItemSchemes({});
      fetchOrders();
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to create PO");
    }
  };

  const handleReceive = async () => {
    try {
      await axios.put(`/suppliers/orders/${activeOrder.id}/receive`, { amountPaid: parseFloat(receiveAmount) });
      toast.success("Order marked as received");
      setShowReceiveModal(false); setActiveOrder(null); setReceiveAmount(0);
      fetchOrders();
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to receive order");
    }
  };

  const handleDeleteSupplier = async (supplier) => {
    const isConfirmed = await confirm({
      title: `Delete ${supplier.name}?`,
      message: "This action cannot be undone. If this supplier has existing orders, you may need to deactivate them instead."
    });
    
    if (!isConfirmed) return;
    
    try {
      await axios.delete(`/suppliers/${supplier.id}`);
      toast.success("Supplier deleted successfully");
      fetchSuppliers();
    } catch (err) {
      console.error('Failed to delete supplier:', err);
      toast.error(err.response?.data?.suggestion || err.response?.data?.message || "Failed to delete supplier");
    }
  };

  const handleToggleActive = async (supplier) => {
    const action = supplier.isActive ? 'deactivate' : 'activate';
    try {
      await axios.patch(`/suppliers/${supplier.id}/${action}`);
      toast.success(`Supplier ${action}d successfully`);
      fetchSuppliers();
    } catch (err) {
      toast.error(`Failed to ${action} supplier`);
    }
  };

  const handleDeleteOrder = async (id) => {
    const isConfirmed = await confirm({
      title: `Delete Purchase Order?`,
      message: "This action cannot be undone."
    });
    
    if (!isConfirmed) return;
    try {
      await axios.delete(`/suppliers/orders/${id}`);
      toast.success("Purchase order deleted");
      fetchOrders();
    } catch (err) {
      console.error('Failed to delete order:', err);
      toast.error("Failed to delete order");
    }
  };

  const summaryCards = [
    { label: "Total Suppliers", value: totalSuppliers, icon: Factory, color: "bg-teal-50 text-teal-600", borderColor: "border-teal-500" },
    { label: "Total Orders", value: orders.length, icon: ClipboardList, color: "bg-indigo-50 text-indigo-600", borderColor: "border-indigo-500" },
    { label: "Pending Orders", value: orders.filter(o=>o.status==="pending").length, icon: Clock, color: "bg-yellow-50 text-yellow-600", borderColor: "border-yellow-500" },
    { label: "Amount Due", value: `₹${orders.reduce((s,o)=>s+(o.balanceDue||0),0).toFixed(2)}`, icon: IndianRupee, color: "bg-rose-50 text-rose-600", borderColor: "border-rose-500" },
  ];

  const tabs = [
    { key: "suppliers", label: "Suppliers", icon: Factory },
    { key: "orders", label: "Purchase Orders", icon: ClipboardList },
  ];

  return (
    <PageLayout
      title="Suppliers & Purchase Orders"
      subtitle="Manage suppliers and incoming stock orders"
      actions={
        <>
          <button onClick={() => { setSupForm(emptySupplier); setEditSupId(null); setShowSupModal(true); focusFirstField('.fixed.inset-0.z-50'); }}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer">
            <Plus className="w-4.5 h-4.5" /> Add Supplier
          </button>
          <button onClick={() => { setShowPOModal(true); focusFirstField('.fixed.inset-0.z-50'); }}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer">
            <Plus className="w-4.5 h-4.5" /> New Purchase Order
          </button>
        </>
      }
    >

        {/* Summary Cards */}
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

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-4">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer ${
                  tab === t.key
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}>
                <Icon className="w-4.5 h-4.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── SUPPLIERS LIST ── */}
        {tab === "suppliers" && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-48">
                <Search className="w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Search suppliers..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none" />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
                Show Inactive
              </label>
              <span className="text-sm text-slate-400 ml-auto">{totalSuppliers} suppliers</span>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>
            ) : suppliers.length === 0 ? (
              <EmptyState 
                icon="Factory" 
                title="No suppliers found" 
                description="Add your first supplier to start creating purchase orders." 
                actionLabel="Add Supplier" 
                onAction={() => { setSupForm(emptySupplier); setEditSupId(null); setShowSupModal(true); focusFirstField('.fixed.inset-0.z-50'); }} 
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map(sup => (
                  <div key={sup.id} className={`bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-150 ${!sup.isActive ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          {sup.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">{sup.name}</p>
                            {!sup.isActive && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 uppercase">Inactive</span>}
                          </div>
                          <p className="text-slate-400 text-xs">{sup.contactPerson || "—"}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${
                        sup.status === "active" ? "bg-green-100 text-green-600 border-green-200" : "bg-red-100 text-red-500 border-red-200"
                      }`}>{sup.status}</span>
                    </div>
                    <div className="space-y-1.5 text-sm text-slate-500 mb-4">
                      {sup.phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {sup.phone}</p>}
                      {sup.email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {sup.email}</p>}
                      {sup.gstNumber && <p className="flex items-center gap-2"><Landmark className="w-3.5 h-3.5" /> {sup.gstNumber}</p>}
                      <p className="flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" /> Credit: ₹{sup.creditLimit} / {sup.creditDays} days</p>
                      {sup.balance > 0 && <p className="text-red-500 font-semibold flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5" /> Due: ₹{sup.balance}</p>}
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-slate-200">
                      <button onClick={() => { setSupForm(sup); setEditSupId(sup.id); setShowSupModal(true); focusFirstField('.fixed.inset-0.z-50'); }}
                        className="flex items-center justify-center bg-teal-50 hover:bg-teal-100 text-teal-600 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteSupplier(sup)}
                        className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleToggleActive(sup)}
                        className="flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                        title={sup.isActive ? "Deactivate" : "Reactivate"}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {totalSuppliers > 0 && !isLoading && (
              <div className="mt-8 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-semibold text-slate-900">{(page - 1) * 50 + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(page * 50, totalSuppliers)}</span> of <span className="font-semibold text-slate-900">{totalSuppliers}</span> records
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
          </div>
        )}

        {/* ── ORDERS LIST ── */}
        {tab === "orders" && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Balance Due</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="font-mono text-teal-600 text-xs font-medium">{o.poNumber}</td>
                    <td className="font-semibold text-slate-900">{o.supplierName}</td>
                    <td className="text-slate-500 text-xs">
                      {new Date(o.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
                    </td>
                    <td className="text-slate-500">{o.items?.length || 0} items</td>
                    <td className="text-right font-bold text-slate-900">₹{o.total}</td>
                    <td className="text-right font-bold text-red-500">₹{o.balanceDue || 0}</td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${STATUS_COLOR[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="flex gap-2">
                      {o.status === "pending" && (
                        <button onClick={() => { setActiveOrder(o); setReceiveAmount(o.total); setShowReceiveModal(true); focusFirstField('.fixed.inset-0.z-50'); }}
                          className="flex items-center gap-1 text-green-600 hover:text-green-800 text-xs font-semibold cursor-pointer">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Receive
                        </button>
                      )}
                      <button onClick={() => handleDeleteOrder(o.id)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-400">No purchase orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── SUPPLIER MODAL ── */}
        {showSupModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onKeyDown={(e) => { if (e.key === 'Enter' && e.shiftKey && supForm.name?.trim()) handleSaveSupplier(); }}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">{editSupId ? "Edit" : "Add"} Supplier</h2>
                <button onClick={() => setShowSupModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl cursor-pointer">×</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key:"name", label:"Supplier Name *", placeholder:"Company name" },
                  { key:"contactPerson", label:"Contact Person", placeholder:"Name" },
                  { key:"phone", label:"Phone", placeholder:"Mobile" },
                  { key:"email", label:"Email", placeholder:"email@co.com" },
                  { key:"gstNumber", label:"GST Number", placeholder:"GSTIN" },
                  { key:"panNumber", label:"PAN Number", placeholder:"PAN" },
                  { key:"creditLimit", label:"Credit Limit ₹", placeholder:"0" },
                  { key:"creditDays", label:"Credit Days", placeholder:"30" },
                ].map(f => (
                  <div key={f.key} className={f.key==="name"?"col-span-2":""}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{f.label}</label>
                    <input type="text" placeholder={f.placeholder}
                      value={supForm[f.key] || ""}
                      onChange={e => setSupForm({ ...supForm, [f.key]: e.target.value })}
                      className="form-input" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Address</label>
                  <textarea rows={2} placeholder="Full address"
                    value={supForm.address || ""}
                    onChange={e => setSupForm({ ...supForm, address: e.target.value })}
                    className="form-input" />
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-6">
                <button onClick={handleSaveSupplier} disabled={!supForm.name?.trim()} tabIndex={-1}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                  Finish (Shift + Enter)
                </button>
                <div className="flex gap-3">
                  <button onClick={handleSaveSupplier}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                    {editSupId ? "Update" : "Add"} Supplier
                  </button>
                  <button onClick={() => setShowSupModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PO MODAL ── */}
        {showPOModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">New Purchase Order</h2>
                <button onClick={() => setShowPOModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl cursor-pointer">×</button>
              </div>

              {/* Supplier + Details */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Supplier *</label>
                  <input list="sup-list" value={poSupplier} onChange={e => setPoSupplier(e.target.value)}
                    placeholder="Select or type supplier"
                    className="form-input" />
                  <datalist id="sup-list">
                    {suppliers.map(s => <option key={s.id} value={s.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Expected Date</label>
                  <input type="date" value={poExpected} onChange={e => setPoExpected(e.target.value)}
                    className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Mode</label>
                  <SmartSelect value={poPayMode} onChange={e => setPoPayMode(e.target.value)}
                    className="form-input bg-white"
                    options={[
                      { value: 'cash', label: 'cash' },
                      { value: 'upi', label: 'upi' },
                      { value: 'card', label: 'card' },
                      { value: 'credit', label: 'credit' }
                    ]}
                  />
                </div>
              </div>

              {/* Supplier Schemes Banner */}
              {(() => {
                const supplierSchemes = allSchemes.filter(s => s.isActive && poSupplier && (
                  s.company.toLowerCase() === poSupplier.toLowerCase()
                ));
                if (supplierSchemes.length === 0) return null;
                return (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <Gift className="w-4 h-4" /> Schemes available from {poSupplier}
                      <span className="text-xs font-normal text-green-600">({supplierSchemes.length} active)</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {supplierSchemes.map(s => (
                        <span key={s.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          s.type === "buy_get_free"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-orange-100 text-orange-700 border border-orange-200"
                        }`}>
                          {s.type === "buy_get_free"
                            ? <><Gift className="w-3 h-3 inline" /> {s.name}: Buy {s.buyQty} Get {s.freeQty} Free</>
                            : <><DollarSign className="w-3 h-3 inline" /> {s.name}: {s.discountPercent}% Off</>}
                          {s.applicableItems?.length > 0 && (
                            <span className="opacity-70">({s.applicableItems.join(", ")})</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Items */}
              <div className="data-table-container mb-3">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Batch</th>
                      <th>HSN</th>
                      <th>Pack</th>
                      <th>Qty</th>
                      <th>Scheme Qty</th>
                      <th>Unit</th>
                      <th>Cost ₹</th>
                      <th>Selling Price ₹</th>
                      <th>MRP ₹</th>
                      <th>GST%</th>
                      <th>Expiry</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {poItems.map((item, i) => {
                      const base = parseFloat(item.cost_price||0)*parseInt(item.qty||1);
                      const amt = (base + (base*item.gst)/100).toFixed(2);
                      const schemes = poItemSchemes[i] || [];
                      return (
                        <Fragment key={i}>
                          <tr>
                            {["name","batch","hsn","pack","qty","scheme_qty","unit","cost_price","selling_price","mrp"].map(f => (
                              <td key={f} className="px-1 py-1">
                                <input type={["qty","scheme_qty","cost_price","selling_price","mrp"].includes(f)?"number":"text"}
                                  value={item[f]} placeholder={f}
                                  onChange={e => {
                                    const u=[...poItems]; u[i]={...u[i],[f]:e.target.value}; setPoItems(u);
                                    if (f === "name") checkPOScheme(i, e.target.value, u[i].qty);
                                    if (f === "qty") checkPOScheme(i, u[i].name, e.target.value);
                                  }}
                                  className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400" />
                              </td>
                            ))}
                            <td className="px-1 py-1">
                              <SmartSelect value={item.gst}
                                onChange={e => { const u=[...poItems]; u[i]={...u[i],gst:parseFloat(e.target.value)}; setPoItems(u); }}
                                className="border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none bg-white"
                                options={GST_RATES.map(r => ({ value: r, label: `${r}%` }))}
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input type="date" value={item.expiry}
                                onChange={e => { const u=[...poItems]; u[i]={...u[i],expiry:e.target.value}; setPoItems(u); }}
                                className="border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none" />
                            </td>
                            <td className="px-2 py-1 text-xs font-semibold text-slate-700">₹{amt}</td>
                            <td className="px-1 py-1">
                              {poItems.length > 1 && (
                                <button onClick={() => {
                                  const newItems = poItems.filter((_,idx)=>idx!==i);
                                  setPoItems(newItems);
                                  // Rebuild scheme indices after removal
                                  setPoItemSchemes(prev => {
                                    const rebuilt = {};
                                    Object.keys(prev).forEach(k => {
                                      const ki = parseInt(k);
                                      if (ki < i) rebuilt[ki] = prev[ki];
                                      else if (ki > i) rebuilt[ki - 1] = prev[ki];
                                    });
                                    return rebuilt;
                                  });
                                }}
                                  className="text-red-400 hover:text-red-600 text-lg cursor-pointer">×</button>
                              )}
                            </td>
                          </tr>
                          {schemes.length > 0 && (
                            <tr className="bg-green-50/70">
                              <td colSpan={10} className="px-3 py-1.5">
                                <div className="flex flex-wrap gap-2">
                                  {schemes.map((s, si) => (
                                    <span key={si} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                      s.type === "buy_get_free"
                                        ? "bg-green-100 text-green-700 border border-green-200"
                                        : "bg-orange-100 text-orange-700 border border-orange-200"
                                    }`}>
                                      <Gift className="w-3 h-3" /> {s.description}
                                      {s.type === "buy_get_free" && s.totalFreeItems > 0 && (
                                        <span className="font-bold">→ {s.totalFreeItems} FREE</span>
                                      )}
                                      {s.type === "flat_discount" && (
                                        <span className="font-bold">→ {s.discountPercent}% Off</span>
                                      )}
                                      <span className="text-[10px] opacity-70">({s.company})</span>
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setPoItems([...poItems,{...emptyItem}])}
                className="flex items-center gap-1 text-teal-600 text-sm hover:underline font-medium mb-6 cursor-pointer">
                <Plus className="w-4 h-4" /> Add Row
              </button>

              {/* Totals */}
              <div className="flex justify-end mb-6">
                <div className="w-56 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>GST</span><span>₹{gstAmount.toFixed(2)}</span></div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-base">
                    <span>Total</span><span className="text-green-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
                <textarea rows={2} value={poNotes} onChange={e => setPoNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  className="form-input" />
              </div>

              <div className="flex gap-3">
                <button onClick={handleSavePO}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                  <ClipboardList className="w-4 h-4" /> Create Purchase Order
                </button>
                <button onClick={() => setShowPOModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── RECEIVE MODAL ── */}
        {showReceiveModal && activeOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" /> Mark Order Received
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                PO: <span className="font-mono text-teal-600">{activeOrder.poNumber}</span> from {activeOrder.supplierName}
              </p>
              <div className="bg-teal-50 rounded-xl p-4 mb-6 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-slate-600">Total Amount</span><span className="font-bold">₹{activeOrder.total}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Items</span><span>{activeOrder.items?.length} items</span></div>
              </div>
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount Paid Now ₹</label>
                <input type="number" value={receiveAmount}
                  onChange={e => setReceiveAmount(parseFloat(e.target.value) || 0)}
                  className="form-input" />
                <p className="text-xs text-slate-400 mt-1">
                  Balance due: ₹{(activeOrder.total - receiveAmount).toFixed(2)}
                </p>
              </div>
              <p className="text-xs text-teal-600 bg-teal-50 rounded-lg p-3 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" /> All items from this PO will be automatically added to your Inventory.
              </p>
              <div className="flex gap-3">
                <button onClick={handleReceive}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                  <CheckCircle2 className="w-4 h-4" /> Confirm Received
                </button>
                <button onClick={() => setShowReceiveModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      <ConfirmModalComponent />
    </PageLayout>
  );
}