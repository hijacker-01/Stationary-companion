import { useState, useRef, useEffect } from "react";
import axios from "../api/axios";
import { Upload, Wand2, Plus } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const blankItem = () => ({ name: "", batch: "", qty: 1, schemeQty: 0, mrp: 0, costPrice: 0, taxPercent: 12, searchStr: "" });
const fmt = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dmy = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

export default function PurchaseBills() {
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    supplierId: "", supplierName: "", invoiceNo: "", date: new Date().toISOString().split("T")[0], paymentMode: "credit",
  });
  const [items, setItems] = useState([blankItem()]);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownIndex, setDropdownIndex] = useState(0);
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [supplierStatus, setSupplierStatus] = useState(null); // { loading, customer, entries, balance } | null

  // Wizard: 1 New · 2 Select Supplier · 3 Supplier Status · 4 Bill Entry
  const [step, setStep] = useState(1);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierIndex, setSupplierIndex] = useState(0);

  const handleSubmitRef = useRef(null);

  useEffect(() => {
    axios.get("/suppliers").then((res) => setSuppliers(res.data?.rows || res.data?.items || res.data?.data || res.data || [])).catch((e) => console.error(e));
    axios.get("/items").then((res) => setInventory(res.data?.rows || res.data?.items || res.data?.data || res.data || [])).catch((e) => console.error(e));
  }, []);

  // Shift+Enter finishes/saves (capture so it isn't pre-empted by the nav hooks).
  useEffect(() => {
    const onShiftEnter = (e) => {
      if (e.key === "Enter" && e.shiftKey && step === 4) { e.preventDefault(); e.stopPropagation(); handleSubmitRef.current?.(); }
    };
    window.addEventListener("keydown", onShiftEnter, true);
    return () => window.removeEventListener("keydown", onShiftEnter, true);
  }, [step]);

  // Esc steps one stage back (4→3→2→1); useEscReverse handles in-field reverse first.
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (supplierStatus && step !== 3) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (step > 1) { e.preventDefault(); setStep((s) => s - 1); }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [step, supplierStatus]);

  // Focus the advancing control as the wizard moves, so Enter flows throughout.
  useEffect(() => {
    const f = (id) => setTimeout(() => document.getElementById(id)?.focus(), 60);
    if (step === 1) f("select-supplier-btn");
    if (step === 2) f("supplier-search");
    if (step === 3) f("proceed-billing");
    if (step === 4) f("pb-invoice");
  }, [step]);

  // ── Supplier selection ──
  const selectSupplier = (sup) => {
    if (!sup) return;
    setForm((fm) => ({ ...fm, supplierId: String(sup.id), supplierName: sup.name }));
    setStep(3);
    setSupplierStatus({ loading: true, customer: sup, entries: [], balance: sup.balance || 0 });
    axios.get(`/suppliers/${sup.id}/ledger`)
      .then((res) => setSupplierStatus({ loading: false, customer: res.data?.customer || sup, entries: res.data?.entries || [], balance: res.data?.finalBalance ?? sup.balance ?? 0 }))
      .catch(() => setSupplierStatus({ loading: false, customer: sup, entries: [], balance: sup.balance || 0, error: true }));
  };
  const proceedToBilling = () => { setStep(4); setTimeout(() => document.getElementById("pb-invoice")?.focus(), 80); };

  // ── OCR upload (auto-fills supplier + items, jumps to Bill Entry) ──
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExtracting(true);
    const fd = new FormData();
    fd.append("invoice", file);
    try {
      const res = await axios.post("/suppliers/extract-invoice", fd, { headers: { ...headers(), "Content-Type": "multipart/form-data" } });
      const data = res.data;
      const match = suppliers.find((s) => s.name.toLowerCase().includes((data.supplierName || "").split(" ")[0].toLowerCase()));
      setForm((fm) => ({ ...fm, supplierId: match ? String(match.id) : "", supplierName: data.supplierName || "", invoiceNo: data.invoiceNo || "", date: data.date || fm.date, paymentMode: data.paymentMode || "credit" }));
      setItems([...(data.items || []).map((it) => ({ ...blankItem(), ...it, searchStr: it.name || "" })), blankItem()]);
      setStep(4);
    } catch (err) { console.error(err); }
    finally { setExtracting(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  // ── Items ──
  const ensureTrailingRow = (list) => { const last = list[list.length - 1]; if (!last || last.name) list.push(blankItem()); return list; };
  const addItem = () => setItems((prev) => ensureTrailingRow([...prev]));
  const updateItem = (index, field, value) => setItems((prev) => { const next = [...prev]; next[index] = { ...next[index], [field]: value }; return ensureTrailingRow(next); });
  const handleItemSelect = (index, searchStr) => {
    const [namePart, batchPart] = searchStr.split(" | Batch: ");
    const name = namePart?.trim();
    const batch = batchPart?.trim();
    const found = inventory.find((i) => i.name === name && (batch ? i.batch === batch : true));
    setItems((prev) => {
      const next = [...prev];
      if (found) next[index] = { ...next[index], name: found.name, batch: found.batch || "", costPrice: found.cost_price || found.costPrice || 0, mrp: found.mrp || 0, taxPercent: found.gst ?? next[index].taxPercent ?? 12, searchStr: undefined };
      else next[index] = { ...next[index], name: name || searchStr, searchStr };
      return ensureTrailingRow(next);
    });
  };
  const removeItem = (index) => setItems((prev) => { const next = prev.filter((_, i) => i !== index); return next.length ? ensureTrailingRow(next) : [blankItem()]; });

  const filledItems = items.filter((i) => i.name);
  const mrpValue = filledItems.reduce((s, r) => s + parseInt(r.qty || 0) * parseFloat(r.mrp || 0), 0);
  const subtotal = filledItems.reduce((s, r) => s + parseInt(r.qty || 0) * parseFloat(r.costPrice || 0), 0);
  const gstAmount = filledItems.reduce((s, r) => { const t = parseInt(r.qty || 0) * parseFloat(r.costPrice || 0); return s + (t * parseFloat(r.taxPercent || 0)) / 100; }, 0);
  const preRound = subtotal + gstAmount;
  const grandTotal = Math.round(preRound);
  const roundOff = (grandTotal - preRound).toFixed(2);
  const activeRowData = items[activeRowIndex] || items[0] || {};

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!form.supplierId || filledItems.length === 0) return;
    setSaving(true);
    try {
      await axios.post("/suppliers/direct-purchase", { ...form, items: filledItems, subtotal: parseFloat(subtotal.toFixed(2)), gstAmount: parseFloat(gstAmount.toFixed(2)), discount: 0, total: grandTotal });
      setForm({ supplierId: "", supplierName: "", invoiceNo: "", date: new Date().toISOString().split("T")[0], paymentMode: "credit" });
      setItems([blankItem()]); setSupplierStatus(null); setStep(1);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };
  handleSubmitRef.current = handleSubmit;

  // ── Derived for the wizard ──
  const q = supplierSearch.trim().toLowerCase();
  const supplierList = suppliers.filter((s) => !q || s.name.toLowerCase().includes(q) || (s.address || "").toLowerCase().includes(q) || (s.phone || "").includes(q));
  const hs = supplierList[supplierIndex] || null;
  const now = new Date();
  const ss = supplierStatus || {};
  const ssInvoices = (ss.entries || []).filter((e) => e.type === "Invoice");
  const lastPurchase = ssInvoices.length ? ssInvoices[ssInvoices.length - 1].date : null;
  const wsteps = [
    { n: 1, label: "New" },
    { n: 2, label: "Select Supplier" },
    { n: 3, label: "Supplier Status" },
    { n: 4, label: "Bill Entry" },
  ];

  const GridHeader = () => (
    <div className="grid grid-cols-[40px_2fr_0.9fr_1.1fr_0.7fr_0.7fr_0.9fr_0.9fr_0.7fr_1fr] bg-[#1b4985] text-white text-sm font-semibold">
      <div className="px-2 py-2.5">#</div><div className="px-2 py-2.5">PRODUCT</div><div className="px-2 py-2.5">PACK</div><div className="px-2 py-2.5">BATCH</div>
      <div className="px-1 py-2.5 text-right">QTY</div><div className="px-1 py-2.5 text-right">FREE</div><div className="px-1 py-2.5 text-right">COST</div>
      <div className="px-1 py-2.5 text-right">MRP</div><div className="px-1 py-2.5 text-right">GST%</div><div className="px-2 py-2.5 text-right">AMOUNT</div>
    </div>
  );

  return (
    // zoom 0.9375 → ~15px scale on the entry wizard (rest of app stays 16px).
    <div className="flex h-screen flex-col bg-slate-100 font-sans overflow-hidden" style={{ zoom: 0.9375 }}>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,.pdf" className="hidden" />

      {/* Top bar */}
      <div className="bg-[#1b4985] text-white px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white text-[#1b4985] rounded-lg flex items-center justify-center font-extrabold text-lg">S</div>
          <div>
            <div className="font-bold leading-tight">Subhash Medicose</div>
            <div className="text-xs text-blue-200">Purchase Bill Entry · Silver-2</div>
          </div>
          <span className="ml-2 bg-white/15 text-xs font-semibold px-2 py-1 rounded">FY 2026-2027</span>
        </div>
        <div className="text-right text-xs leading-tight">
          <div className="font-bold">{now.toLocaleDateString("en-GB", { weekday: "short" })} · {now.toLocaleDateString("en-GB")}</div>
          <div className="text-blue-200">{now.toLocaleTimeString("en-GB")}</div>
        </div>
      </div>

      {/* Step tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-2 shrink-0">
        {wsteps.map((s) => (
          <button key={s.n} onClick={() => { if (s.n <= step || form.supplierName) setStep(s.n); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer ${step === s.n ? "bg-[#1b4985] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === s.n ? "bg-white text-[#1b4985]" : "bg-slate-300 text-white"}`}>{s.n}</span>
            {s.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-400">Purchase Bill</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6" data-form-scope>
        {/* STEP 1 — New */}
        {step === 1 && (
          <div className="flex gap-6">
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Supplier</div>
                  <div className="text-xl font-bold text-slate-300">No supplier selected</div>
                </div>
                <div className="flex gap-2">
                  {/* Step 1 only: ←/→ toggles focus between OCR and Select Supplier. */}
                  <button type="button" id="ocr-btn" onClick={() => fileInputRef.current?.click()} disabled={extracting}
                    onKeyDown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); document.getElementById('select-supplier-btn')?.focus(); } }}
                    className="flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 px-4 py-2.5 rounded-lg font-semibold focus:ring-2 focus:ring-brand-500">
                    {extracting ? <Wand2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {extracting ? "Extracting…" : "Upload Bill (OCR)"}
                  </button>
                  <button id="select-supplier-btn" onClick={() => setStep(2)}
                    onKeyDown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); document.getElementById('ocr-btn')?.focus(); } }}
                    className="flex items-center gap-2 bg-[#1b4985] hover:bg-[#163a6b] text-white px-5 py-2.5 rounded-lg font-semibold cursor-pointer">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">?</span> Select Supplier
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <GridHeader />
                <div className="px-4 py-3 text-[#1b4985] bg-blue-50/60 text-sm">Select a supplier to begin adding products…</div>
              </div>
            </div>
            <div className="w-72 shrink-0">
              <div className="bg-[#0e2440] text-white rounded-xl p-5">
                <div className="font-bold text-blue-200 uppercase text-sm mb-2">New Purchase</div>
                <p className="text-sm text-blue-100/80 mb-4">Press Enter or use the button to pick a supplier, or upload the supplier's invoice to auto-fill. Then enter the invoice no, date and products.</p>
                <div className="space-y-2 text-sm border-t border-white/10 pt-3">
                  <div className="flex justify-between"><span className="text-blue-300">Date</span><span>{dmy(form.date)}</span></div>
                  <div className="flex justify-between"><span className="text-blue-300">Type</span><span className="capitalize">{form.paymentMode}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Select Supplier */}
        {step === 2 && (
          <div className="flex gap-6">
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-w-0">
              <div className="px-5 py-3 flex items-center justify-between border-b border-slate-200">
                <span className="font-bold text-slate-800">Select Supplier Ledger</span>
                <span className="text-sm text-slate-400">Top Ordering · A→Z</span>
              </div>
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[#1b4985] font-bold">?&gt;&gt;</span>
                  <input id="supplier-search" value={supplierSearch} autoComplete="off" aria-expanded="true"
                    onChange={(e) => { setSupplierSearch(e.target.value); setSupplierIndex(0); }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") { e.preventDefault(); setSupplierIndex((p) => Math.min(p + 1, supplierList.length - 1)); }
                      else if (e.key === "ArrowUp") { e.preventDefault(); setSupplierIndex((p) => Math.max(p - 1, 0)); }
                      else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); if (hs) selectSupplier(hs); }
                    }}
                    placeholder="Type to search supplier…" className="flex-1 bg-transparent outline-none text-lg" />
                </div>
                <span className="text-sm text-slate-400">{supplierList.length} matches</span>
              </div>
              <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-[2fr_1.2fr_1fr] bg-slate-100 text-slate-500 text-sm font-semibold sticky top-0">
                  <div className="px-5 py-2">SUPPLIER NAME</div><div className="px-2 py-2">STATION</div><div className="px-2 py-2 text-right">BALANCE</div>
                </div>
                {supplierList.map((c, i) => (
                  <div key={c.id || i} onClick={() => setSupplierIndex(i)} onDoubleClick={() => selectSupplier(c)}
                    className={`grid grid-cols-[2fr_1.2fr_1fr] items-center cursor-pointer border-b border-slate-50 ${i === supplierIndex ? "bg-blue-50 border-l-4 border-l-[#1b4985]" : "hover:bg-slate-50 border-l-4 border-l-transparent"}`}>
                    <div className={`px-5 py-2.5 ${i === supplierIndex ? "font-bold text-[#1b4985]" : "text-slate-800"}`}>{c.name}</div>
                    <div className="px-2 py-2.5 text-slate-500">{c.address || "—"}</div>
                    <div className="px-2 py-2.5 text-right">{c.balance ? <span className={`font-bold ${c.balance > 0 ? "text-red-600" : "text-emerald-700"}`}>{fmt(Math.abs(c.balance))} <span className="text-xs">{c.balance > 0 ? "Dr" : "Cr"}</span></span> : ""}</div>
                  </div>
                ))}
                {supplierList.length === 0 && <div className="px-5 py-10 text-center text-slate-400">No matching suppliers.</div>}
              </div>
            </div>
            <div className="w-80 shrink-0">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-[#1b4985] text-white px-4 py-2.5 font-bold">Highlighted Supplier</div>
                {hs ? (
                  <div className="p-4">
                    <div className="text-lg font-bold text-slate-900 mb-2">{hs.name}</div>
                    <div className="flex gap-2 mb-3">
                      <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Creditor</span>
                      <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{hs.gstNumber ? "Registered" : "Unregistered"}</span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Address</span><span className="font-semibold">{hs.address || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Phone</span><span className="font-semibold">{hs.phone || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Balance</span><span className="font-semibold">{fmt(hs.balance)}</span></div>
                    </div>
                    <button onClick={() => selectSupplier(hs)} className="w-full mt-4 bg-[#1b4985] hover:bg-[#163a6b] text-white py-2.5 rounded-lg font-bold cursor-pointer">Select Supplier →</button>
                  </div>
                ) : <div className="p-6 text-center text-slate-400 text-sm">Type to find a supplier.</div>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Supplier Status */}
        {step === 3 && (
          <div className="flex gap-6">
            <div className="flex-1 space-y-4 min-w-0">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-400 uppercase">Supplier</div>
                  <div className="text-2xl font-bold text-slate-900">{form.supplierName}</div>
                </div>
                <span className="text-sm font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded">Payable</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-[#1b4985] text-white px-5 py-2.5 font-bold">Supplier History</div>
                <div className="grid grid-cols-2">
                  <div className="p-5 space-y-2 text-sm border-r border-slate-100">
                    {[["Purchases (Annual)", "0"], ["Credit Limit", fmt(ss.customer?.creditLimit)], ["Balance Payable", fmt(ss.balance)], ["Last Purchase", lastPurchase ? dmy(lastPurchase) : "—"], ["P.D.C.", "Nil"], ["Credit Days", ss.customer?.creditDays || "—"]].map(([k, v]) => (
                      <div key={k} className="flex justify-between"><span className="text-slate-500">{k}</span><span className="font-bold text-slate-800">{v}</span></div>
                    ))}
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-4 text-xs font-semibold text-slate-400 border-b border-slate-200 pb-2"><span>BILL</span><span>DATE</span><span className="text-right">AMOUNT</span><span className="text-right">DAYS</span></div>
                    {ssInvoices.length ? ssInvoices.slice().reverse().slice(0, 8).map((e, i) => (
                      <div key={i} className="grid grid-cols-4 text-sm py-1.5 border-b border-slate-50"><span className="font-mono">{e.ref}</span><span>{dmy(e.date)}</span><span className="text-right font-semibold">{fmt(e.debit)}</span><span className="text-right">—</span></div>
                    )) : <div className="py-10 text-center text-slate-400">No previous purchases</div>}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button id="proceed-billing" onClick={proceedToBilling} className="bg-[#1b4985] hover:bg-[#163a6b] text-white px-6 py-3 rounded-lg font-bold cursor-pointer">Proceed to Billing →</button>
              </div>
            </div>
            <div className="w-80 shrink-0">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-[#1b4985] text-white px-4 py-2.5 font-bold">Supplier Status</div>
                <div className="p-4">
                  <div className="text-lg font-bold text-slate-900 mb-2">{form.supplierName}</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Phone</span><span className="font-semibold">{ss.customer?.phone || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">GSTIN</span><span className="font-semibold">{ss.customer?.gstNumber || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Balance</span><span className="font-bold">{fmt(ss.balance)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — Bill Entry */}
        {step === 4 && (
          <div className="flex gap-6">
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              {/* Supplier header + invoice / date / type */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Supplier</div>
                  <div className="text-2xl font-bold text-slate-900">{form.supplierName || "—"}</div>
                </div>
                <div className="flex items-end gap-6">
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase">Invoice No.</div>
                    <input id="pb-invoice" value={form.invoiceNo} aria-expanded="true"
                      onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); document.getElementById("pb-date")?.focus(); } }}
                      placeholder="INV-…" className="font-bold font-mono text-slate-800 bg-transparent outline-none border-b border-slate-200 focus:border-[#1b4985] w-32" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase">Date</div>
                    <input id="pb-date" type="date" value={form.date} aria-expanded="true"
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); document.getElementById("pb-type")?.focus(); } }}
                      className="font-bold text-slate-800 bg-transparent outline-none border-b border-slate-200 focus:border-[#1b4985]" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase">Type</div>
                    <select id="pb-type" value={form.paymentMode} aria-expanded="true"
                      onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); document.getElementById("search-product-0")?.focus(); } }}
                      className={`font-bold rounded px-2 py-0.5 outline-none cursor-pointer ${form.paymentMode === "cash" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                      <option value="credit">Credit</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Product grid */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <GridHeader />
                {items.map((item, i) => {
                  const searchVal = item.searchStr !== undefined ? item.searchStr : item.name;
                  const filtered = inventory.filter((it) => !searchVal || it.name.toLowerCase().includes(searchVal.toLowerCase()));
                  const lineTotal = parseInt(item.qty || 0) * parseFloat(item.costPrice || 0);
                  return (
                    <div key={i} data-billrow className="grid grid-cols-[40px_2fr_0.9fr_1.1fr_0.7fr_0.7fr_0.9fr_0.9fr_0.7fr_1fr] items-center border-b border-slate-100 hover:bg-blue-50/40 text-base" onFocus={() => setActiveRowIndex(i)}>
                      <div className="px-2 py-1.5 text-slate-400 font-mono">{String(i + 1).padStart(2, "0")}</div>
                      <div className="px-2 py-1.5 relative">
                        <input id={`search-product-${i}`} value={searchVal}
                          onChange={(e) => { handleItemSelect(i, e.target.value); setActiveDropdown(`item-${i}`); setDropdownIndex(0); }}
                          onFocus={() => { setActiveRowIndex(i); setActiveDropdown(`item-${i}`); setDropdownIndex(0); }}
                          onBlur={() => setTimeout(() => setActiveDropdown((p) => p === `item-${i}` ? null : p), 200)}
                          aria-expanded={activeDropdown === `item-${i}` ? "true" : "false"}
                          onKeyDown={(e) => {
                            if (activeDropdown !== `item-${i}`) return;
                            if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); setDropdownIndex((p) => Math.min(p + 1, filtered.length - 1)); }
                            else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); setDropdownIndex((p) => Math.max(p - 1, 0)); }
                            else if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault(); e.stopPropagation();
                              const it = filtered[dropdownIndex];
                              if (it) handleItemSelect(i, `${it.name}${it.batch ? " | Batch: " + it.batch : ""}`);
                              else if ((searchVal || "").trim()) handleItemSelect(i, searchVal);
                              else { setActiveDropdown(null); return; }
                              setActiveDropdown(null);
                              if (i === items.length - 1) addItem();
                              setTimeout(() => { const el = document.getElementById(`pb-qty-${i}`); if (el) { el.focus(); el.select(); } }, 60);
                            } else if (e.key === "Escape") { e.preventDefault(); setActiveDropdown(null); }
                          }}
                          placeholder={i === items.length - 1 ? "Type to add item…" : ""}
                          className="w-full bg-transparent outline-none font-semibold" />
                        {activeDropdown === `item-${i}` && filtered.length > 0 && (
                          <ul className="absolute left-2 top-full mt-0.5 w-[440px] bg-white border border-gray-300 shadow-xl z-50 max-h-56 overflow-auto">
                            {filtered.map((it, di) => (
                              <li key={it.id || di} className={`px-3 py-1.5 cursor-pointer text-sm border-b border-gray-100 ${di === dropdownIndex ? "bg-blue-100" : "hover:bg-blue-50"}`}
                                onMouseDown={(e) => { e.preventDefault(); handleItemSelect(i, `${it.name}${it.batch ? " | Batch: " + it.batch : ""}`); setActiveDropdown(null); if (i === items.length - 1) addItem(); setTimeout(() => { const el = document.getElementById(`pb-qty-${i}`); if (el) { el.focus(); el.select(); } }, 60); }}>
                                <div className="flex justify-between font-semibold"><span>{it.name}</span><span className="text-emerald-700">₹{it.cost_price || it.mrp || 0}</span></div>
                                <div className="flex justify-between text-xs text-gray-500"><span>Batch {it.batch || "-"}</span><span>Stock {it.stock_qty || 0}</span></div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="px-2 py-1.5 text-slate-600">{item.pack || "—"}</div>
                      <div className="px-1 py-1.5"><input value={item.batch} onChange={(e) => updateItem(i, "batch", e.target.value)} className="w-full bg-transparent outline-none font-mono" placeholder="Batch" /></div>
                      <div className="px-1 py-1.5"><input id={`pb-qty-${i}`} type="number" min="1" value={item.qty} onChange={(e) => updateItem(i, "qty", e.target.value)} className="w-full text-right bg-transparent outline-none font-bold" /></div>
                      <div className="px-1 py-1.5"><input type="number" min="0" value={item.schemeQty} onChange={(e) => updateItem(i, "schemeQty", e.target.value)} className="w-full text-right bg-transparent outline-none text-emerald-700 font-bold" /></div>
                      <div className="px-1 py-1.5"><input type="number" value={item.costPrice} onChange={(e) => updateItem(i, "costPrice", e.target.value)} className="w-full text-right bg-transparent outline-none" /></div>
                      <div className="px-1 py-1.5"><input type="number" value={item.mrp} onChange={(e) => updateItem(i, "mrp", e.target.value)} className="w-full text-right bg-transparent outline-none" /></div>
                      <div className="px-1 py-1.5"><input type="number" value={item.taxPercent} onChange={(e) => updateItem(i, "taxPercent", e.target.value)} className="w-full text-right bg-transparent outline-none" /></div>
                      <div className="px-2 py-1.5 text-right font-bold">{item.name ? fmt(lineTotal) : ""}</div>
                    </div>
                  );
                })}
              </div>

              {/* Selected line + totals */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <div className="text-sm font-semibold text-slate-400 uppercase mb-2">Selected Line</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Item</span><span className="font-semibold">{activeRowData.name || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Batch</span><span className="font-semibold font-mono">{activeRowData.batch || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Cost</span><span className="font-semibold">{fmt(activeRowData.costPrice)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">MRP</span><span className="font-semibold">{fmt(activeRowData.mrp)}</span></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">MRP Value</span><span className="font-semibold">{fmt(mrpValue)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Value of Goods</span><span className="font-semibold">{fmt(subtotal)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">GST</span><span className="font-semibold">{fmt(gstAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Round Off</span><span className="font-semibold">{roundOff}</span></div>
                    <div className="border-t pt-2 flex justify-between items-center"><span className="font-bold text-[#1b4985]">BILL VALUE</span><span className="text-3xl font-extrabold text-[#1b4985]">{fmt(grandTotal)}</span></div>
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-2">
                <button type="button" tabIndex={-1} onClick={addItem} className="px-3 py-1.5 text-sm border border-slate-200 rounded text-slate-600 hover:bg-slate-50 flex items-center gap-1"><Plus className="w-4 h-4" /> Add Row</button>
                <button type="button" tabIndex={-1} onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-sm border border-slate-200 rounded text-slate-600 hover:bg-slate-50">Upload OCR</button>
                <button onClick={() => handleSubmitRef.current?.()} disabled={saving || filledItems.length === 0}
                  className="ml-auto px-6 py-2 bg-[#1b4985] hover:bg-[#163a6b] disabled:opacity-50 text-white rounded-lg font-bold text-sm">
                  {saving ? "Saving…" : "Save Bill (Shift + Enter)"}
                </button>
              </div>
            </div>

            {/* Supplier status panel */}
            <div className="w-80 shrink-0">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-[#1b4985] text-white px-4 py-2.5 font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Supplier Status</div>
                <div className="p-4">
                  <div className="text-lg font-bold text-slate-900 mb-3">{form.supplierName || "—"}</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Balance Payable</span><span className="font-bold">{fmt(ss.balance)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Last Purchase</span><span className="font-semibold">{lastPurchase ? dmy(lastPurchase) : "—"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">GSTIN</span><span className="font-semibold">{ss.customer?.gstNumber || "—"}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* F-key bar */}
      <div className="bg-white border-t border-slate-200 px-6 py-2 flex items-center gap-3 text-sm text-slate-500 shrink-0">
        {[["F2", "New"], ["F3", "Edit"], ["F4", "Ledger"], ["F6", "PDC"], ["F7", "All"], ["F8", "O/S"], ["F10", "Balance"], ["?", "Search"], ["Alt+S", "Filter"]].map(([k, l]) => (
          <span key={k}><span className="font-bold text-[#1b4985] bg-slate-100 px-1.5 py-0.5 rounded">{k}</span> {l}</span>
        ))}
        <span className="ml-auto">Esc <span className="text-slate-400">= step back</span></span>
      </div>
    </div>
  );
}
