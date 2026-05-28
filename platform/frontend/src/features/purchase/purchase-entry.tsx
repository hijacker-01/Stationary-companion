import { useEffect, useMemo, useState } from "react";
import { usePostPurchaseInvoice } from "./api";
import { registerShortcut, unregisterShortcut } from "@/lib/shortcuts";

type Line = {
  item_id: string;
  item_batch_id: string;
  quantity: number;
  free_quantity: number;
  rate: number;
  gst_rate: number;
};

export function PurchaseEntry() {
  const [companyId, setCompanyId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const mutation = usePostPurchaseInvoice();

  const addLine = () => setLines((prev) => [...prev, { item_id: "", item_batch_id: "", quantity: 1, free_quantity: 0, rate: 0, gst_rate: 12 }]);
  const deleteLastLine = () => setLines((prev) => prev.slice(0, -1));

  const updateLine = (idx: number, key: keyof Line, value: string) => {
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, [key]: ["item_id", "item_batch_id"].includes(key) ? value : Number(value) } : l));
  };

  const submit = () => {
    if (!invoiceNo || !companyId || !branchId || !supplierId || lines.length === 0 || mutation.isPending) return;
    mutation.mutate({
      company_id: companyId,
      branch_id: branchId,
      supplier_id: supplierId,
      invoice_no: invoiceNo,
      invoice_date: new Date().toISOString().slice(0, 10),
      discount_amount: 0,
      lines,
    });
  };

  useMemo(() => {
    registerShortcut("ctrl+enter", submit);
    registerShortcut("alt+n", addLine);
    registerShortcut("alt+d", deleteLastLine);
  }, [invoiceNo, companyId, branchId, supplierId, lines, mutation.isPending]);

  useEffect(() => () => {
    unregisterShortcut("ctrl+enter");
    unregisterShortcut("alt+n");
    unregisterShortcut("alt+d");
  }, []);

  return (
    <section className="p-3 border border-slate-800 rounded bg-slate-900 space-y-2">
      <h2 className="text-sm font-semibold">Purchase Entry (Ctrl+Enter save, Alt+N add row, Alt+D delete row)</h2>
      <div className="grid grid-cols-3 gap-2">
        <input value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-1" placeholder="Company ID" />
        <input value={branchId} onChange={(e) => setBranchId(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-1" placeholder="Branch ID" />
        <input value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-1" placeholder="Supplier ID" />
      </div>
      <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1" placeholder="Invoice no" />
      <button type="button" onClick={addLine} className="px-2 py-1 border border-slate-700 rounded">Add Line</button>
      {lines.map((line, idx) => (
        <div key={idx} className="grid grid-cols-6 gap-1">
          <input placeholder="Item" value={line.item_id} onChange={(e) => updateLine(idx, "item_id", e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-1" />
          <input placeholder="Batch" value={line.item_batch_id} onChange={(e) => updateLine(idx, "item_batch_id", e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-1" />
          <input type="number" placeholder="Qty" value={line.quantity} onChange={(e) => updateLine(idx, "quantity", e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-1" />
          <input type="number" placeholder="Free" value={line.free_quantity} onChange={(e) => updateLine(idx, "free_quantity", e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-1" />
          <input type="number" placeholder="Rate" value={line.rate} onChange={(e) => updateLine(idx, "rate", e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-1" />
          <input type="number" placeholder="GST" value={line.gst_rate} onChange={(e) => updateLine(idx, "gst_rate", e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-1" />
        </div>
      ))}
    </section>
  );
}
