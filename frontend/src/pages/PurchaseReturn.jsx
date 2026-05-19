import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function PurchaseReturn() {
  const [returns, setReturns] = useState([]);
  const [items, setItems] = useState([]);
  const [view, setView] = useState("list");
  const [returnItems, setReturnItems] = useState([{ name: "", batch: "", qty: 1, selling_price: 0, gst: 12 }]);
  const [supplierName, setSupplierName] = useState("");
  const [originalPoNo, setOriginalPoNo] = useState("");
  const [reason, setReason] = useState("");
  const [activeReturn, setActiveReturn] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  const fetchReturns = () => axios.get("http://localhost:5000/api/purchase-return", { headers: headers() }).then(r => setReturns(r.data));
  const fetchItems = () => axios.get("http://localhost:5000/api/items", { headers: headers() }).then(r => setItems(r.data));
  const fetchSuppliers = () => axios.get("http://localhost:5000/api/suppliers", { headers: headers() }).then(r => setSuppliers(r.data));

  useEffect(() => { fetchReturns(); fetchItems(); fetchSuppliers(); }, []);

  const handleItemSelect = (idx, searchStr) => {
    const [namePart, batchPart] = searchStr.split(" | Batch: ");
    const found = items.find(i => i.name === namePart?.trim() && (batchPart ? i.batch === batchPart.trim() : true));
    const u = [...returnItems];
    u[idx] = found ? { ...u[idx], name: found.name, batch: found.batch || "", selling_price: found.cost_price || 0, gst: 12 } : { ...u[idx], name: namePart || searchStr, batch: "" };
    setReturnItems(u);
  };

  const subtotal = returnItems.reduce((s, i) => s + parseFloat(i.selling_price || 0) * parseInt(i.qty || 0), 0);
  const gstAmt = returnItems.reduce((s, i) => { const b = parseFloat(i.selling_price || 0) * parseInt(i.qty || 0); return s + (b * (i.gst || 0) / 100); }, 0);

  const handleSubmit = async () => {
    if (!supplierName) return alert("Supplier required");
    const valid = returnItems.filter(i => i.name && i.qty > 0);
    if (!valid.length) return alert("Add items");
    try {
      const res = await axios.post("http://localhost:5000/api/purchase-return", { supplierName, originalPoNo, reason, items: valid, subtotal: +subtotal.toFixed(2), gstAmount: +gstAmt.toFixed(2), totalAmount: +(subtotal + gstAmt).toFixed(2) }, { headers: headers() });
      setActiveReturn(res.data); setView("preview"); fetchReturns(); fetchItems();
    } catch (err) { alert(err.response?.data?.error || "Failed"); }
  };

  const handleDelete = async (id) => { if (!confirm("Delete?")) return; await axios.delete(`http://localhost:5000/api/purchase-return/${id}`, { headers: headers() }); fetchReturns(); fetchItems(); };

  if (view === "preview" && activeReturn) return (
    <div className="flex min-h-screen bg-gray-100"><Sidebar /><main className="flex-1 p-8">
      <div className="flex justify-between mb-6 print:hidden">
        <button onClick={() => { setView("list"); setActiveReturn(null); }} className="text-sm text-gray-500">← Back</button>
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">🖨️ Print</button>
      </div>
      <div className="bg-white max-w-[210mm] mx-auto p-8 shadow-lg text-xs">
        <h1 className="text-xl font-extrabold text-center uppercase border-b-2 pb-3 mb-4">DEBIT NOTE</h1>
        <div className="flex justify-between mb-4">
          <p className="font-bold">Supplier: {activeReturn.supplierName}</p>
          <div className="text-right"><p><b>No:</b> {activeReturn.returnNo}</p><p><b>Date:</b> {new Date(activeReturn.createdAt).toLocaleDateString("en-IN")}</p></div>
        </div>
        <table className="w-full border border-gray-400 mb-4 text-[10px]"><thead className="bg-gray-100"><tr><th className="border p-1">S.No</th><th className="border p-1 text-left">Product</th><th className="border p-1">Batch</th><th className="border p-1">Qty</th><th className="border p-1">Rate</th><th className="border p-1 text-right">Amount</th></tr></thead>
          <tbody>{(activeReturn.items||[]).map((it,i)=><tr key={i}><td className="border p-1 text-center">{i+1}</td><td className="border p-1 font-bold">{it.name}</td><td className="border p-1 text-center">{it.batch||"—"}</td><td className="border p-1 text-center">{it.qty}</td><td className="border p-1 text-right">₹{it.selling_price}</td><td className="border p-1 text-right">₹{(parseFloat(it.selling_price||0)*parseInt(it.qty||0)*(1+(it.gst||0)/100)).toFixed(2)}</td></tr>)}</tbody>
        </table>
        <div className="text-right text-sm"><p>Subtotal: ₹{activeReturn.subtotal?.toFixed(2)}</p><p>GST: ₹{activeReturn.gstAmount?.toFixed(2)}</p><p className="font-bold text-lg mt-1">Total: ₹{activeReturn.totalAmount?.toFixed(2)}</p></div>
      </div>
    </main></div>
  );

  if (view === "create") return (
    <div className="flex min-h-screen bg-gray-100"><Sidebar /><main className="flex-1 p-8">
      <div className="flex justify-between mb-6"><h1 className="text-2xl font-bold">📤 New Purchase Return</h1><button onClick={()=>setView("list")} className="text-sm text-gray-500">← Back</button></div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-xs font-medium text-gray-600 block mb-1">Supplier *</label><input list="pr-sup" value={supplierName} onChange={e=>setSupplierName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /><datalist id="pr-sup">{suppliers.map(s=><option key={s.id} value={s.name}/>)}</datalist></div>
              <div><label className="text-xs font-medium text-gray-600 block mb-1">PO No</label><input value={originalPoNo} onChange={e=>setOriginalPoNo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-medium text-gray-600 block mb-1">Reason</label><select value={reason} onChange={e=>setReason(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="">Select</option><option>Damaged</option><option>Wrong item</option><option>Near expiry</option><option>Other</option></select></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <table className="w-full text-sm mb-4"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Rate</th><th className="px-3 py-2">GST%</th><th className="px-3 py-2 text-right">Amt</th><th></th></tr></thead>
              <tbody>{returnItems.map((ri,i)=><tr key={i}><td className="px-2 py-2"><input list={`pri-${i}`} value={ri.name} onChange={e=>handleItemSelect(i,e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" /><datalist id={`pri-${i}`}>{items.map(it=><option key={it.id} value={`${it.name}${it.batch?' | Batch: '+it.batch:''}`}/>)}</datalist></td><td className="px-2 py-2"><input type="number" min="1" value={ri.qty} onChange={e=>{const u=[...returnItems];u[i].qty=e.target.value;setReturnItems(u)}} className="w-16 border rounded px-2 py-1.5 text-sm text-center"/></td><td className="px-2 py-2"><input type="number" value={ri.selling_price} onChange={e=>{const u=[...returnItems];u[i].selling_price=e.target.value;setReturnItems(u)}} className="w-20 border rounded px-2 py-1.5 text-sm"/></td><td className="px-2 py-2"><input type="number" value={ri.gst} onChange={e=>{const u=[...returnItems];u[i].gst=e.target.value;setReturnItems(u)}} className="w-16 border rounded px-2 py-1.5 text-sm text-center"/></td><td className="px-2 py-2 text-right font-semibold">₹{(parseFloat(ri.selling_price||0)*parseInt(ri.qty||0)*(1+(ri.gst||0)/100)).toFixed(2)}</td><td className="px-2 py-2">{returnItems.length>1&&<button onClick={()=>setReturnItems(returnItems.filter((_,idx)=>idx!==i))} className="text-red-400">×</button>}</td></tr>)}</tbody>
            </table>
            <button onClick={()=>setReturnItems([...returnItems,{name:"",batch:"",qty:1,selling_price:0,gst:12}])} className="text-blue-600 text-sm hover:underline">+ Add Row</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 h-fit">
          <h2 className="font-semibold mb-4">Summary</h2>
          <div className="space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div><div className="flex justify-between"><span>GST</span><span>₹{gstAmt.toFixed(2)}</span></div><div className="border-t pt-2 flex justify-between font-bold text-red-600 text-lg"><span>Total</span><span>₹{(subtotal+gstAmt).toFixed(2)}</span></div></div>
          <button onClick={handleSubmit} className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-sm">📤 Issue Debit Note</button>
        </div>
      </div>
    </main></div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100"><Sidebar /><main className="flex-1 p-8">
      <div className="flex justify-between mb-6"><div><h1 className="text-2xl font-bold">📤 Purchase Returns</h1><p className="text-sm text-gray-500 mt-1">Debit Notes for goods returned to suppliers</p></div>
        <button onClick={()=>{setReturnItems([{name:"",batch:"",qty:1,selling_price:0,gst:12}]);setSupplierName("");setView("create")}} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow">+ New Return</button></div>
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-6 py-4 text-left">Debit Note</th><th className="px-6 py-4 text-left">Supplier</th><th className="px-6 py-4 text-left">Date</th><th className="px-6 py-4 text-left">Items</th><th className="px-6 py-4 text-left">Amount</th><th className="px-6 py-4 text-left">Actions</th></tr></thead>
          <tbody className="divide-y">{returns.map(r=><tr key={r.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-mono text-red-600 font-bold">{r.returnNo}</td><td className="px-6 py-4 font-semibold">{r.supplierName}</td><td className="px-6 py-4 text-gray-500">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td><td className="px-6 py-4">{r.items?.length||0}</td><td className="px-6 py-4 font-bold text-red-600">₹{r.totalAmount}</td><td className="px-6 py-4 flex gap-3"><button onClick={()=>{setActiveReturn(r);setView("preview")}} className="text-blue-600 hover:underline text-xs">View</button><button onClick={()=>handleDelete(r.id)} className="text-red-500 hover:underline text-xs">Delete</button></td></tr>)}{returns.length===0&&<tr><td colSpan={6} className="text-center py-12 text-gray-400">No purchase returns yet.</td></tr>}</tbody>
        </table>
      </div>
    </main></div>
  );
}
