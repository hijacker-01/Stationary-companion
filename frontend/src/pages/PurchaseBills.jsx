import { useState, useRef, useEffect } from "react";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import SmartSelect from "../components/SmartSelect";
import { focusFirstField } from "../utils/focusHelpers";
import { Upload, FileText, CheckCircle2, AlertCircle, Plus, Trash2, Wand2 } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const blankItem = () => ({ name: "", batch: "", qty: 1, schemeQty: 0, mrp: 0, costPrice: 0, taxPercent: 12, searchStr: "" });

export default function PurchaseBills() {
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    supplierId: "", supplierName: "", invoiceNo: "", date: new Date().toISOString().split("T")[0], paymentMode: "credit"
  });

  // Start with one blank row so the grid is ready for Enter-driven entry.
  const [items, setItems] = useState([blankItem()]);

  // Product-search dropdown state (mirrors the sales bill).
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownIndex, setDropdownIndex] = useState(0);

  const handleSubmitRef = useRef(null);

  useEffect(() => {
    axios.get("/suppliers")
      .then(res => { setSuppliers(res.data?.rows || res.data?.items || res.data?.data || res.data || []); setLoadingSuppliers(false); })
      .catch(err => console.error(err));
    axios.get("/items")
      .then(res => setInventory(res.data?.rows || res.data?.items || res.data?.data || res.data || []))
      .catch(err => console.error(err));
  }, []);

  // Auto-focus supplier field on mount
  useEffect(() => {
    focusFirstField('form');
  }, []);

  // Shift+Enter finishes/saves the bill from anywhere in the form (capture phase
  // so it isn't pre-empted by the global Enter-navigation hooks).
  useEffect(() => {
    const onShiftEnter = (e) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleSubmitRef.current?.();
      }
    };
    window.addEventListener('keydown', onShiftEnter, true);
    return () => window.removeEventListener('keydown', onShiftEnter, true);
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
      const res = await axios.post("/suppliers/extract-invoice", formData, {
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

      setItems([...(data.items || []).map(it => ({ ...blankItem(), ...it, searchStr: it.name || "" })), blankItem()]);

    } catch (err) {
      console.error(err);
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Keep exactly one trailing blank row so the user can always Enter into a new line.
  const ensureTrailingRow = (list) => {
    const last = list[list.length - 1];
    if (!last || last.name) list.push(blankItem());
    return list;
  };

  const addItem = () => setItems(prev => [...prev, blankItem()]);

  const updateItem = (index, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return ensureTrailingRow(next);
    });
  };

  // Select a product from inventory (or accept typed text), auto-filling cost/MRP/GST/batch.
  const handleItemSelect = (index, searchStr) => {
    const [namePart, batchPart] = searchStr.split(" | Batch: ");
    const name = namePart?.trim();
    const batch = batchPart?.trim();
    const found = inventory.find(i => i.name === name && (batch ? i.batch === batch : true));

    setItems(prev => {
      const next = [...prev];
      if (found) {
        next[index] = {
          ...next[index],
          name: found.name,
          batch: found.batch || "",
          costPrice: found.cost_price || found.costPrice || 0,
          mrp: found.mrp || 0,
          taxPercent: found.gst ?? next[index].taxPercent ?? 12,
          searchStr: undefined,
        };
      } else {
        next[index] = { ...next[index], name: name || searchStr, searchStr };
      }
      return ensureTrailingRow(next);
    });
  };

  const removeItem = (index) => {
    setItems(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? ensureTrailingRow(next) : [blankItem()];
    });
  };

  // Rows that actually carry a product (the trailing blank is ignored on save/calc).
  const filledItems = items.filter(i => i.name);

  // Calculations
  const subtotal = filledItems.reduce((acc, curr) => acc + (parseInt(curr.qty || 0) * parseFloat(curr.costPrice || 0)), 0);
  const gstAmount = filledItems.reduce((acc, curr) => {
    const lineTotal = parseInt(curr.qty || 0) * parseFloat(curr.costPrice || 0);
    return acc + (lineTotal * (parseFloat(curr.taxPercent || 0) / 100));
  }, 0);
  const total = subtotal + gstAmount;

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!form.supplierId) return;
    if (filledItems.length === 0) return;

    setSaving(true);
    try {
      const payload = { ...form, items: filledItems, subtotal, gstAmount, discount: 0, total };
      await axios.post("/suppliers/direct-purchase", payload);

      setForm({ supplierId: "", supplierName: "", invoiceNo: "", date: new Date().toISOString().split("T")[0], paymentMode: "credit" });
      setItems([blankItem()]);
    } catch (err) {

    } finally {
      setSaving(false);
    }
  };
  handleSubmitRef.current = handleSubmit;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 pb-32 max-w-6xl mx-auto">

          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-6 h-6 text-brand-600" /> Purchase Bill Entry
              </h1>
              <p className="text-sm text-slate-500 mt-1">Directly record inward invoices to update inventory and ledgers.</p>
            </div>

            <div className="flex gap-3">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,.pdf" className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting}
                tabIndex={-1}
                className="bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm"
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
                  <SmartSelect
                    value={form.supplierId}
                    onChange={handleSupplierSelect}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    placeholder="-- Select Supplier --"
                    autoFocus
                    options={[
                      { value: '', label: '-- Select Supplier --' },
                      ...(!loadingSuppliers ? suppliers.map(s => ({
                        value: s.id.toString(),
                        label: `${s.name}${form.supplierName && form.supplierName.includes(s.name) ? ' (Matched)' : ''}`
                      })) : [])
                    ]}
                  />
                  {form.supplierName && !form.supplierId && (
                    <p className="text-xs text-orange-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> AI Extracted: {form.supplierName}. Please map to existing.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Number</label>
                  <input type="text" required value={form.invoiceNo} onChange={e=>setForm({...form, invoiceNo:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 font-mono" placeholder="INV-..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bill Date</label>
                  <input type="date" required value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                <h2 className="font-bold text-slate-700">Line Items <span className="text-xs font-normal text-slate-400 ml-2">Type to search · Enter to move across · Shift + Enter to finish</span></h2>
                <button type="button" onClick={addItem} tabIndex={-1} className="text-brand-600 text-sm font-semibold flex items-center gap-1 hover:text-brand-800">
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
                      const searchVal = item.searchStr !== undefined ? item.searchStr : item.name;
                      const filtered = inventory.filter(it => !searchVal || it.name.toLowerCase().includes(searchVal.toLowerCase()));
                      return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2 relative">
                          <input
                            type="text"
                            id={`search-product-${idx}`}
                            value={searchVal}
                            onChange={e=>handleItemSelect(idx, e.target.value)}
                            onFocus={() => { setActiveDropdown(`item-${idx}`); setDropdownIndex(0); }}
                            onBlur={() => setTimeout(() => setActiveDropdown(prev => prev === `item-${idx}` ? null : prev), 200)}
                            aria-expanded={activeDropdown === `item-${idx}` ? 'true' : 'false'}
                            onKeyDown={(e) => {
                              if (activeDropdown !== `item-${idx}`) return;
                              if (e.key === 'ArrowDown') {
                                e.preventDefault(); e.stopPropagation();
                                setDropdownIndex(prev => Math.min(prev + 1, filtered.length - 1));
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault(); e.stopPropagation();
                                setDropdownIndex(prev => Math.max(prev - 1, 0));
                              } else if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault(); e.stopPropagation();
                                const typed = searchVal || '';
                                if (filtered[dropdownIndex]) {
                                  const it = filtered[dropdownIndex];
                                  handleItemSelect(idx, `${it.name}${it.batch ? ' | Batch: ' + it.batch : ''}`);
                                } else if (typed.trim()) {
                                  handleItemSelect(idx, typed);
                                } else {
                                  setActiveDropdown(null);
                                  return;
                                }
                                setActiveDropdown(null);
                                // Jump to Qty for this row.
                                setTimeout(() => {
                                  const tr = e.target.closest('tr');
                                  const qtyInput = tr?.querySelector('input[type="number"]');
                                  if (qtyInput) { qtyInput.focus(); qtyInput.select(); }
                                }, 50);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setActiveDropdown(null);
                              }
                            }}
                            className="w-full border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-brand-400"
                            placeholder={idx === items.length - 1 ? "Type to add item..." : "Product name"}
                          />
                          {activeDropdown === `item-${idx}` && filtered.length > 0 && (
                            <ul className="absolute left-4 top-full mt-0.5 w-[360px] bg-white border border-gray-400 shadow-xl z-50 max-h-48 overflow-y-auto">
                              {filtered.map((it, di) => (
                                <li
                                  key={it.id || di}
                                  className={`px-2 py-1 cursor-pointer text-xs text-black border-b border-gray-100 last:border-0 ${dropdownIndex === di ? 'bg-blue-200' : 'hover:bg-blue-50'}`}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleItemSelect(idx, `${it.name}${it.batch ? ' | Batch: ' + it.batch : ''}`);
                                    setActiveDropdown(null);
                                    setTimeout(() => {
                                      const qtyInput = document.querySelector(`tr:nth-child(${idx+1}) input[type="number"]`);
                                      if (qtyInput) qtyInput.focus();
                                    }, 50);
                                  }}
                                >
                                  <div className="flex justify-between font-bold"><span>{it.name}</span><span className="text-emerald-700">₹{it.cost_price || it.mrp || 0}</span></div>
                                  <div className="flex justify-between text-[10px] text-gray-500"><span>Batch: {it.batch || '-'}</span><span>Stock: {it.stock_qty || 0}</span></div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" value={item.batch} onChange={e=>updateItem(idx, "batch", e.target.value)} className="w-full border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-brand-400 font-mono" placeholder="Batch" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" min="1" value={item.qty} onChange={e=>updateItem(idx, "qty", e.target.value)} className="w-full border rounded px-2 py-1 text-sm outline-none text-right focus:ring-1 focus:ring-brand-400" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" min="0" value={item.schemeQty} onChange={e=>updateItem(idx, "schemeQty", e.target.value)} className="w-full border rounded px-2 py-1 text-sm outline-none text-right bg-green-50 text-green-700 focus:ring-1 focus:ring-green-400" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" step="0.01" value={item.costPrice} onChange={e=>updateItem(idx, "costPrice", e.target.value)} className="w-full border rounded px-2 py-1 text-sm outline-none text-right focus:ring-1 focus:ring-brand-400" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" step="0.01" value={item.mrp} onChange={e=>updateItem(idx, "mrp", e.target.value)} className="w-full border rounded px-2 py-1 text-sm outline-none text-right focus:ring-1 focus:ring-brand-400" />
                        </td>
                        <td className="px-4 py-2">
                          <SmartSelect
                            value={item.taxPercent}
                            onChange={e => updateItem(idx, "taxPercent", e.target.value)}
                            className="w-full border rounded px-1 py-1 text-sm outline-none text-right focus:ring-1 focus:ring-brand-400 bg-white"
                            options={[
                              { value: '0', label: '0%' },
                              { value: '5', label: '5%' },
                              { value: '12', label: '12%' },
                              { value: '18', label: '18%' }
                            ]}
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-slate-700">
                          {lineTotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button type="button" tabIndex={-1} onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4 mx-auto" /></button>
                        </td>
                      </tr>
                    )})}
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
                  <div className="text-2xl font-extrabold text-brand-700">₹{total.toFixed(2)}</div>
                </div>
              </div>
              <button
                type="submit"
                disabled={saving || filledItems.length === 0}
                className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition shadow flex items-center gap-2"
              >
                {saving ? "Saving..." : "Finish Bill & Update Inventory"}
                {!saving && <CheckCircle2 className="w-5 h-5" />}
                {!saving && <span className="text-xs font-normal opacity-90">(Shift + Enter)</span>}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}
