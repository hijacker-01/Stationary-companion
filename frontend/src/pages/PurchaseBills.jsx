import { useState, useRef, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { Upload, FileText, CheckCircle2, AlertCircle, Plus, Trash2, Wand2 } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function PurchaseBills() {
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    supplierId: "", supplierName: "", invoiceNo: "", date: new Date().toISOString().split("T")[0], paymentMode: "credit"
  });
  
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/suppliers", { headers: headers() })
      .then(res => { setSuppliers(res.data); setLoadingSuppliers(false); })
      .catch(err => console.error(err));
  }, []);

  const handleSupplierSelect = (e) => {
    const id = e.target.value;
    const s = suppliers.find(sup => sup.id === parseInt(id));
    setForm(f => ({ ...f, supplierId: id, supplierName: s?.name || "" }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setExtracting(true);
    
    const formData = new FormData();
    formData.append("invoice", file);

    try {
      const res = await axios.post("http://localhost:5000/api/suppliers/extract-invoice", formData, {
        headers: {
          ...headers(),
          "Content-Type": "multipart/form-data"
        }
      });
      const data = res.data;
      
      // Auto-match supplier or just use extracted name
      let matchedSupplierId = "";
      const match = suppliers.find(s => s.name.toLowerCase().includes(data.supplierName.split(' ')[0].toLowerCase()));
      if (match) matchedSupplierId = match.id.toString();

      setForm(f => ({
        ...f,
        supplierId: matchedSupplierId,
        supplierName: data.supplierName,
        invoiceNo: data.invoiceNo,
        date: data.date,
        paymentMode: data.paymentMode
      }));

      setItems(data.items);
      alert("✅ Invoice successfully extracted using AI OCR!");
    } catch (err) {
      alert("Extraction failed: " + (err.response?.data?.error || err.message));
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addItem = () => {
    setItems([...items, { name: "", batch: "", qty: 1, schemeQty: 0, mrp: 0, costPrice: 0, taxPercent: 12 }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, curr) => acc + (parseInt(curr.qty||0) * parseFloat(curr.costPrice||0)), 0);
  const gstAmount = items.reduce((acc, curr) => {
    const lineTotal = parseInt(curr.qty||0) * parseFloat(curr.costPrice||0);
    return acc + (lineTotal * (parseFloat(curr.taxPercent||0)/100));
  }, 0);
  const total = subtotal + gstAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId) return alert("Please select a valid supplier from the master.");
    if (items.length === 0) return alert("Add at least one item to the bill.");

    setSaving(true);
    try {
      const payload = { ...form, items, subtotal, gstAmount, discount: 0, total };
      await axios.post("http://localhost:5000/api/suppliers/direct-purchase", payload, { headers: headers() });
      alert("🎉 Purchase Bill Saved & Inventory Updated Successfully!");
      setForm({ supplierId: "", supplierName: "", invoiceNo: "", date: new Date().toISOString().split("T")[0], paymentMode: "credit" });
      setItems([]);
    } catch (err) {
      alert("Error saving bill: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 pb-32 max-w-6xl mx-auto">
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-6 h-6 text-teal-600" /> Purchase Bill Entry
              </h1>
              <p className="text-sm text-slate-500 mt-1">Directly record inward invoices to update inventory and ledgers.</p>
            </div>
            
            <div className="flex gap-3">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,.pdf" className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting}
                className="bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm"
              >
                {extracting ? <Wand2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {extracting ? "Extracting..." : "Upload Bill (AI OCR)"}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Header Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="grid grid-cols-4 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier</label>
                  <select required value={form.supplierId} onChange={handleSupplierSelect} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                    <option value="">-- Select Supplier --</option>
                    {!loadingSuppliers && suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} {form.supplierName && form.supplierName.includes(s.name) ? "(Matched)" : ""}</option>
                    ))}
                  </select>
                  {form.supplierName && !form.supplierId && (
                    <p className="text-xs text-orange-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> AI Extracted: {form.supplierName}. Please map to existing.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Number</label>
                  <input type="text" required value={form.invoiceNo} onChange={e=>setForm({...form, invoiceNo:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 font-mono" placeholder="INV-..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bill Date</label>
                  <input type="date" required value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                <h2 className="font-bold text-slate-700">Line Items</h2>
                <button type="button" onClick={addItem} className="text-teal-600 text-sm font-semibold flex items-center gap-1 hover:text-teal-800">
                  <Plus className="w-4 h-4" /> Add Row
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead className="bg-slate-50 text-slate-500 text-xs border-b">
                    <tr>
                      <th>Product Name</th>
                      <th>Batch</th>
                      <th>Qty</th>
                      <th className="text-emerald-600">Free</th>
                      <th>Cost (₹)</th>
                      <th>MRP (₹)</th>
                      <th>GST %</th>
                      <th>Total (₹)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => {
                      const lineTotal = parseInt(item.qty||0) * parseFloat(item.costPrice||0);
                      return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2">
                          <input type="text" required value={item.name} onChange={e=>updateItem(idx, "name", e.target.value)} className="w-full border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-teal-400" placeholder="Product name" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" required value={item.batch} onChange={e=>updateItem(idx, "batch", e.target.value)} className="w-full border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-teal-400 font-mono" placeholder="Batch" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" min="1" required value={item.qty} onChange={e=>updateItem(idx, "qty", e.target.value)} className="w-full border rounded px-2 py-1 text-sm outline-none text-right focus:ring-1 focus:ring-teal-400" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" min="0" value={item.schemeQty} onChange={e=>updateItem(idx, "schemeQty", e.target.value)} className="w-full border rounded px-2 py-1 text-sm outline-none text-right bg-green-50 text-green-700 focus:ring-1 focus:ring-green-400" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" step="0.01" required value={item.costPrice} onChange={e=>updateItem(idx, "costPrice", e.target.value)} className="w-full border rounded px-2 py-1 text-sm outline-none text-right focus:ring-1 focus:ring-teal-400" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" step="0.01" required value={item.mrp} onChange={e=>updateItem(idx, "mrp", e.target.value)} className="w-full border rounded px-2 py-1 text-sm outline-none text-right focus:ring-1 focus:ring-teal-400" />
                        </td>
                        <td className="px-4 py-2">
                          <select value={item.taxPercent} onChange={e=>updateItem(idx, "taxPercent", e.target.value)} className="w-full border rounded px-1 py-1 text-sm outline-none text-right focus:ring-1 focus:ring-teal-400 bg-white">
                            <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-slate-700">
                          {lineTotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4 mx-auto" /></button>
                        </td>
                      </tr>
                    )})}
                    {items.length === 0 && (
                      <tr><td colSpan={9} className="text-center py-12 text-slate-400">No items added. Click "Upload Bill" to auto-fill or add manually.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Totals & Save */}
            <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] p-4 flex justify-between items-center z-10">
              <div className="flex gap-8 px-4">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Subtotal (Taxable)</div>
                  <div className="text-xl font-bold text-slate-800">₹{subtotal.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Total GST</div>
                  <div className="text-xl font-bold text-purple-600">₹{gstAmount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Grand Total</div>
                  <div className="text-2xl font-extrabold text-teal-700">₹{total.toFixed(2)}</div>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={saving || items.length === 0}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition shadow flex items-center gap-2"
              >
                {saving ? "Saving..." : "Save Bill & Update Inventory"}
                {!saving && <CheckCircle2 className="w-5 h-5" />}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}
