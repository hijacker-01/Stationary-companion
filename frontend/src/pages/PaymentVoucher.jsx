import React, { useState, useEffect, useCallback } from "react";
import axios from "../api/axios";
import {
  Plus,
  X,
  Wallet,
  Loader2,
  Trash2,
} from "lucide-react";

const API = "http://localhost:5000";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const modeLabel = {
  cash: "Cash",
  bank: "Bank",
  upi: "UPI",
  cheque: "Cheque",
};

export default function PaymentVoucher() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    supplierName: "",
    amount: "",
    mode: "cash",
    reference: "",
    remarks: "",
  });

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/vouchers`, {
        
        params: { direction: "out" },
      });
      setVouchers(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const resetForm = () => {
    setForm({ supplierName: "", amount: "", mode: "cash", reference: "", remarks: "" });
    setShowModal(false);
  };

  const handleSave = async () => {
    if (!form.supplierName.trim() || !form.amount) return;
    setSaving(true);
    try {
      await axios.post(
        `${API}/api/vouchers`,
        {
          type: "supplier",
          direction: "out",
          partyName: form.supplierName,
          amount: parseFloat(form.amount) || 0,
          mode: form.mode,
          reference: form.reference,
          note: form.remarks,
        },
        {  }
      );
      showToast("Payment saved successfully");
      resetForm();
      fetchVouchers();
    } catch (e) {
      showToast("Error saving payment");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this payment voucher?")) return;
    try {
      await axios.delete(`${API}/api/vouchers/${id}`);
      showToast("Payment deleted");
      fetchVouchers();
    } catch (e) {
      showToast("Error deleting payment");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") resetForm();
    if (e.key === "Enter" && e.shiftKey && showModal && form.supplierName && form.amount) handleSave();
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
          <Wallet size={16} className="text-orange-600" />
          <h1 className="text-sm font-semibold text-gray-800">Payment Vouchers</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 bg-orange-600 text-white text-xs px-3 py-1.5 rounded hover:bg-orange-700"
        >
          <Plus size={13} /> New Payment
        </button>
      </div>

      {/* Table */}
      <div className="p-3">
        <div className="bg-white border rounded shadow-sm overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 border-b text-left">
                <th className="px-3 py-2 font-semibold">Voucher No</th>
                <th className="px-3 py-2 font-semibold">Supplier</th>
                <th className="px-3 py-2 font-semibold text-right">Amount (₹)</th>
                <th className="px-3 py-2 font-semibold text-center">Mode</th>
                <th className="px-3 py-2 font-semibold">Reference</th>
                <th className="px-3 py-2 font-semibold">Date</th>
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
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-400">
                    No payment vouchers found
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v._id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-1.5 font-mono">{v.voucherNo || v._id?.slice(-6)}</td>
                    <td className="px-3 py-1.5">{v.partyName}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-orange-700 font-semibold">
                      {(v.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-semibold uppercase">
                        {modeLabel[v.mode] || v.mode || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">{v.reference || "-"}</td>
                    <td className="px-3 py-1.5">{v.createdAt ? new Date(v.createdAt).toLocaleDateString("en-IN") : v.date ? new Date(v.date).toLocaleDateString("en-IN") : "-"}</td>
                    <td className="px-3 py-1.5 text-center">
                      <button onClick={() => handleDelete(v._id)} className="p-1 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 size={13} className="text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {vouchers.length > 0 && (
          <div className="mt-2 flex justify-end">
            <div className="bg-white border rounded px-4 py-2 text-xs">
              <span className="text-gray-500">Total Payments:</span>{" "}
              <span className="font-mono font-bold text-orange-700">
                ₹{vouchers.reduce((s, v) => s + (v.amount || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-gray-400 ml-3">({vouchers.length} entries)</span>
            </div>
          </div>
        )}
      </div>

      {/* New Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center pt-16">
          <div className="bg-white rounded shadow-lg w-full max-w-md m-4" onKeyDown={handleKeyDown} tabIndex={-1}>
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
              <span className="text-sm font-semibold">New Payment Voucher</span>
              <button onClick={resetForm} className="p-1 hover:bg-gray-200 rounded">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 mb-0.5">Supplier Name *</label>
                <input
                  type="text"
                  value={form.supplierName}
                  onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                  className="w-full border rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-400 outline-none"
                  autoFocus
                  tabIndex={1}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-0.5">Amount (₹) *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full border rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-400 outline-none"
                    min={0}
                    step="0.01"
                    tabIndex={2}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-0.5">Mode</label>
                  <select
                    value={form.mode}
                    onChange={(e) => setForm({ ...form, mode: e.target.value })}
                    className="w-full border rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-400 outline-none bg-white"
                    tabIndex={3}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-600 mb-0.5">Reference No</label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  className="w-full border rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-400 outline-none"
                  placeholder="Cheque no / UTR / Transaction ID"
                  tabIndex={4}
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-0.5">Remarks</label>
                <textarea
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full border rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-400 outline-none resize-none"
                  rows={2}
                  tabIndex={5}
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  onClick={resetForm}
                  className="px-4 py-1.5 border rounded text-gray-600 hover:bg-gray-50 text-xs"
                  tabIndex={6}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  tabIndex={-1}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-xs disabled:opacity-50 flex items-center gap-1"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />} Finish Payment
                  <span className="text-xs">(Shift + Enter)</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs disabled:opacity-50 flex items-center gap-1"
                  tabIndex={7}
                >
                  {saving && <Loader2 size={12} className="animate-spin" />} Save Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
