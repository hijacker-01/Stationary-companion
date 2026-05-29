import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Plus,
  Eye,
  ArrowRightCircle,
  Trash2,
  X,
  Truck,
  Loader2,
} from "lucide-react";

const API = "http://localhost:5000";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const statusColors = {
  draft: "bg-gray-200 text-gray-700",
  pending: "bg-yellow-100 text-yellow-800",
  invoiced: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

const emptyItem = () => ({
  name: "",
  batch: "",
  expiry: "",
  qty: "",
  rate: "",
  mrp: "",
  discPercent: "",
  gstPercent: "",
});

export default function SalesChallan() {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    gstNo: "",
    dlNo: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [items, setItems] = useState([emptyItem()]);

  const fetchChallans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/sales-challan`, { headers: headers() });
      setChallans(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallans();
  }, [fetchChallans]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const calcAmount = (item) => {
    const q = parseFloat(item.qty) || 0;
    const r = parseFloat(item.rate) || 0;
    const disc = parseFloat(item.discPercent) || 0;
    const base = q * r;
    return base - (base * disc) / 100;
  };

  const subtotal = items.reduce((s, i) => s + calcAmount(i), 0);
  const totalGst = items.reduce((s, i) => {
    const amt = calcAmount(i);
    const gst = parseFloat(i.gstPercent) || 0;
    return s + (amt * gst) / 100;
  }, 0);
  const grandTotal = subtotal + totalGst;

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };

  const removeItem = (idx) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setForm({ customerName: "", phone: "", gstNo: "", dlNo: "", date: new Date().toISOString().slice(0, 10), notes: "" });
    setItems([emptyItem()]);
    setShowModal(false);
  };

  const handleSave = async () => {
    if (!form.customerName.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        items: items
          .filter((i) => i.name.trim())
          .map((i) => ({
            ...i,
            qty: parseFloat(i.qty) || 0,
            rate: parseFloat(i.rate) || 0,
            mrp: parseFloat(i.mrp) || 0,
            discPercent: parseFloat(i.discPercent) || 0,
            gstPercent: parseFloat(i.gstPercent) || 0,
            amount: calcAmount(i),
          })),
      };
      await axios.post(`${API}/api/sales-challan`, payload, { headers: headers() });
      showToast("Delivery Memo created successfully");
      resetForm();
      fetchChallans();
    } catch (e) {
      showToast("Error creating DM");
    } finally {
      setSaving(false);
    }
  };

  const handleConvertToInvoice = async (id) => {
    const paymentMode = window.prompt("Enter Payment Mode (cash / credit / upi / bank):", "cash");
    if (!paymentMode) return;
    try {
      await axios.post(
        `${API}/api/sales-challan/${id}/invoice`,
        { paymentMode, status: "completed" },
        { headers: headers() }
      );
      showToast("Converted to Invoice");
      fetchChallans();
    } catch (e) {
      showToast("Error converting to invoice");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this DM?")) return;
    try {
      await axios.delete(`${API}/api/sales-challan/${id}`, { headers: headers() });
      showToast("DM deleted");
      fetchChallans();
    } catch (e) {
      showToast("Error deleting DM");
    }
  };

  const handleView = async (id) => {
    try {
      const { data } = await axios.get(`${API}/api/sales-challan/${id}`, { headers: headers() });
      setViewModal(data.data || data);
    } catch (e) {
      showToast("Error loading details");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      resetForm();
      setViewModal(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-xs" onKeyDown={handleKeyDown} tabIndex={-1}>
      {toast && (
        <div className="fixed top-2 right-2 z-50 bg-green-600 text-white text-xs px-3 py-1.5 rounded shadow">
          {toast}
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Truck size={16} className="text-gray-600" />
          <h1 className="text-sm font-semibold text-gray-800">Sales Challans (DM)</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700"
        >
          <Plus size={13} /> New DM
        </button>
      </div>

      {/* Table */}
      <div className="p-3">
        <div className="bg-white border rounded shadow-sm overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 border-b text-left">
                <th className="px-3 py-2 font-semibold">DM No</th>
                <th className="px-3 py-2 font-semibold">Customer</th>
                <th className="px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 font-semibold text-center">Items</th>
                <th className="px-3 py-2 font-semibold text-right">Total (₹)</th>
                <th className="px-3 py-2 font-semibold text-center">Status</th>
                <th className="px-3 py-2 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-400">
                    <Loader2 size={16} className="animate-spin inline mr-1" /> Loading...
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-400">
                    No delivery memos found
                  </td>
                </tr>
              ) : (
                challans.map((c) => {
                  const status = (c.status || "draft").toLowerCase();
                  return (
                    <tr key={c._id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-1.5 font-mono">{c.dmNo || c.challanNo || c._id?.slice(-6)}</td>
                      <td className="px-3 py-1.5">{c.customerName}</td>
                      <td className="px-3 py-1.5">{c.date ? new Date(c.date).toLocaleDateString("en-IN") : "-"}</td>
                      <td className="px-3 py-1.5 text-center">{c.items?.length || 0}</td>
                      <td className="px-3 py-1.5 text-right font-mono">
                        {(c.total || c.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors[status] || "bg-gray-100"}`}>
                          {status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleView(c._id)} className="p-1 hover:bg-gray-100 rounded" title="View">
                            <Eye size={13} className="text-gray-600" />
                          </button>
                          {(status === "draft" || status === "pending") && (
                            <button onClick={() => handleConvertToInvoice(c._id)} className="p-1 hover:bg-green-50 rounded" title="Convert to Invoice">
                              <ArrowRightCircle size={13} className="text-green-600" />
                            </button>
                          )}
                          {status !== "invoiced" && (
                            <button onClick={() => handleDelete(c._id)} className="p-1 hover:bg-red-50 rounded" title="Delete">
                              <Trash2 size={13} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center pt-10 overflow-auto">
          <div className="bg-white rounded shadow-lg w-full max-w-3xl m-4" onKeyDown={handleKeyDown} tabIndex={-1}>
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
              <span className="text-sm font-semibold">DM Details</span>
              <button onClick={() => setViewModal(null)} className="p-1 hover:bg-gray-200 rounded">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 text-xs space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><span className="text-gray-500">DM No:</span> <span className="font-semibold">{viewModal.dmNo || viewModal.challanNo || viewModal._id?.slice(-6)}</span></div>
                <div><span className="text-gray-500">Customer:</span> <span className="font-semibold">{viewModal.customerName}</span></div>
                <div><span className="text-gray-500">Date:</span> <span className="font-semibold">{viewModal.date ? new Date(viewModal.date).toLocaleDateString("en-IN") : "-"}</span></div>
                <div><span className="text-gray-500">Phone:</span> {viewModal.phone || "-"}</div>
                <div><span className="text-gray-500">GST No:</span> {viewModal.gstNo || "-"}</div>
                <div><span className="text-gray-500">DL No:</span> {viewModal.dlNo || "-"}</div>
              </div>
              {viewModal.notes && <div><span className="text-gray-500">Notes:</span> {viewModal.notes}</div>}
              <table className="w-full text-xs border">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-2 py-1 text-left">#</th>
                    <th className="px-2 py-1 text-left">Name</th>
                    <th className="px-2 py-1 text-left">Batch</th>
                    <th className="px-2 py-1">Qty</th>
                    <th className="px-2 py-1 text-right">Rate</th>
                    <th className="px-2 py-1 text-right">Disc%</th>
                    <th className="px-2 py-1 text-right">GST%</th>
                    <th className="px-2 py-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewModal.items || []).map((it, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-2 py-1">{i + 1}</td>
                      <td className="px-2 py-1">{it.name}</td>
                      <td className="px-2 py-1">{it.batch}</td>
                      <td className="px-2 py-1 text-center">{it.qty}</td>
                      <td className="px-2 py-1 text-right">{(it.rate || 0).toFixed(2)}</td>
                      <td className="px-2 py-1 text-right">{it.discPercent || 0}%</td>
                      <td className="px-2 py-1 text-right">{it.gstPercent || 0}%</td>
                      <td className="px-2 py-1 text-right font-mono">{(it.amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right space-y-0.5">
                <div>Subtotal: <span className="font-mono font-semibold">₹{(viewModal.subtotal || 0).toFixed(2)}</span></div>
                <div>GST: <span className="font-mono font-semibold">₹{(viewModal.totalGst || 0).toFixed(2)}</span></div>
                <div className="text-sm font-bold">Total: ₹{(viewModal.total || viewModal.grandTotal || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New DM Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center pt-6 overflow-auto">
          <div className="bg-white rounded shadow-lg w-full max-w-4xl m-4" onKeyDown={handleKeyDown} tabIndex={-1}>
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
              <span className="text-sm font-semibold">New Delivery Memo</span>
              <button onClick={resetForm} className="p-1 hover:bg-gray-200 rounded">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              {/* Form Fields */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 mb-0.5">Customer Name *</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full border rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                    autoFocus
                    tabIndex={1}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-0.5">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                    tabIndex={2}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-0.5">GST No</label>
                  <input
                    type="text"
                    value={form.gstNo}
                    onChange={(e) => setForm({ ...form, gstNo: e.target.value })}
                    className="w-full border rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                    tabIndex={3}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-0.5">DL No</label>
                  <input
                    type="text"
                    value={form.dlNo}
                    onChange={(e) => setForm({ ...form, dlNo: e.target.value })}
                    className="w-full border rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                    tabIndex={4}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-0.5">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                    tabIndex={5}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-0.5">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full border rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 outline-none resize-none"
                    rows={1}
                    tabIndex={6}
                  />
                </div>
              </div>

              {/* Items Grid */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-700">Items</span>
                  <button
                    onClick={() => setItems([...items, emptyItem()])}
                    className="flex items-center gap-0.5 text-blue-600 hover:text-blue-800"
                  >
                    <Plus size={12} /> Add Row
                  </button>
                </div>
                <div className="border rounded overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="px-2 py-1.5 text-left w-[17%]">Name</th>
                        <th className="px-2 py-1.5 text-left w-[9%]">Batch</th>
                        <th className="px-2 py-1.5 text-left w-[11%]">Expiry</th>
                        <th className="px-2 py-1.5 text-center w-[7%]">Qty</th>
                        <th className="px-2 py-1.5 text-right w-[9%]">Rate</th>
                        <th className="px-2 py-1.5 text-right w-[9%]">MRP</th>
                        <th className="px-2 py-1.5 text-right w-[7%]">Disc%</th>
                        <th className="px-2 py-1.5 text-right w-[7%]">GST%</th>
                        <th className="px-2 py-1.5 text-right w-[11%]">Amount</th>
                        <th className="px-2 py-1.5 w-[4%]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-1 py-0.5">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(idx, "name", e.target.value)}
                              className="w-full border rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-300"
                              tabIndex={10 + idx * 8}
                            />
                          </td>
                          <td className="px-1 py-0.5">
                            <input
                              type="text"
                              value={item.batch}
                              onChange={(e) => updateItem(idx, "batch", e.target.value)}
                              className="w-full border rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-300"
                              tabIndex={11 + idx * 8}
                            />
                          </td>
                          <td className="px-1 py-0.5">
                            <input
                              type="date"
                              value={item.expiry}
                              onChange={(e) => updateItem(idx, "expiry", e.target.value)}
                              className="w-full border rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-300"
                              tabIndex={12 + idx * 8}
                            />
                          </td>
                          <td className="px-1 py-0.5">
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateItem(idx, "qty", e.target.value)}
                              className="w-full border rounded px-1.5 py-1 text-xs text-center outline-none focus:ring-1 focus:ring-blue-300"
                              min={0}
                              tabIndex={13 + idx * 8}
                            />
                          </td>
                          <td className="px-1 py-0.5">
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateItem(idx, "rate", e.target.value)}
                              className="w-full border rounded px-1.5 py-1 text-xs text-right outline-none focus:ring-1 focus:ring-blue-300"
                              min={0}
                              step="0.01"
                              tabIndex={14 + idx * 8}
                            />
                          </td>
                          <td className="px-1 py-0.5">
                            <input
                              type="number"
                              value={item.mrp}
                              onChange={(e) => updateItem(idx, "mrp", e.target.value)}
                              className="w-full border rounded px-1.5 py-1 text-xs text-right outline-none focus:ring-1 focus:ring-blue-300"
                              min={0}
                              step="0.01"
                              tabIndex={15 + idx * 8}
                            />
                          </td>
                          <td className="px-1 py-0.5">
                            <input
                              type="number"
                              value={item.discPercent}
                              onChange={(e) => updateItem(idx, "discPercent", e.target.value)}
                              className="w-full border rounded px-1.5 py-1 text-xs text-right outline-none focus:ring-1 focus:ring-blue-300"
                              min={0}
                              max={100}
                              tabIndex={16 + idx * 8}
                            />
                          </td>
                          <td className="px-1 py-0.5">
                            <input
                              type="number"
                              value={item.gstPercent}
                              onChange={(e) => updateItem(idx, "gstPercent", e.target.value)}
                              className="w-full border rounded px-1.5 py-1 text-xs text-right outline-none focus:ring-1 focus:ring-blue-300"
                              min={0}
                              max={28}
                              tabIndex={17 + idx * 8}
                            />
                          </td>
                          <td className="px-2 py-1 text-right font-mono bg-gray-50">
                            {calcAmount(item).toFixed(2)}
                          </td>
                          <td className="px-1 py-0.5 text-center">
                            {items.length > 1 && (
                              <button onClick={() => removeItem(idx)} className="p-0.5 hover:bg-red-50 rounded">
                                <X size={12} className="text-red-400" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="text-xs space-y-0.5 text-right min-w-[200px] border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">GST:</span>
                    <span className="font-mono">₹{totalGst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm border-t pt-1">
                    <span>Total:</span>
                    <span className="font-mono">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  onClick={resetForm}
                  className="px-4 py-1.5 border rounded text-gray-600 hover:bg-gray-50 text-xs"
                  tabIndex={100}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs disabled:opacity-50 flex items-center gap-1"
                  tabIndex={101}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                >
                  {saving && <Loader2 size={12} className="animate-spin" />} Save DM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
