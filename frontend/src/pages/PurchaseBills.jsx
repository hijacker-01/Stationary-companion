import { useState, useRef, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { Upload, FileText, CheckCircle2, AlertCircle, Plus, Trash2, Wand2, ArrowLeft, Printer, Eye } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const emptyItem = { sNo:"", hsn:"3004", name:"", pack:"", qty:1, free:0, batch:"", exp:"", mrp:0, rate:0, disc:0, sch:0, sgst:0, cgst:0, amount:0 };

const calcAmount = (item) => {
  const base = item.qty * item.rate;
  const discAmt = base * (item.disc/100);
  const afterDisc = base - discAmt;
  const sgstAmt = afterDisc * (item.sgst/100);
  const cgstAmt = afterDisc * (item.cgst/100);
  return parseFloat((afterDisc + sgstAmt + cgstAmt).toFixed(2));
};

export default function PurchaseBills() {
  const [suppliers, setSuppliers] = useState([]);
  const [view, setView] = useState("list");
  const [bills, setBills] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeBill, setActiveBill] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    supplierId:"", supplierName:"", supplierGstin:"", invoiceNo:"", date:new Date().toISOString().split("T")[0],
    dueDate:"", orderNo:"", lrNo:"", cases:0, transport:"", paymentMode:"credit", discountPct:5, crDrNote:0
  });
  const [items, setItems] = useState([{...emptyItem}]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/suppliers", { headers: headers() }).then(r => setSuppliers(r.data)).catch(console.error);
    axios.get("http://localhost:5000/api/suppliers/orders", { headers: headers() }).then(r => setBills(r.data)).catch(console.error);
  }, []);

  const handleSupplierSelect = (e) => {
    const s = suppliers.find(x => x.id === parseInt(e.target.value));
    setForm(f => ({...f, supplierId: e.target.value, supplierName: s?.name||"", supplierGstin: s?.gst||""}));
  };

  const updateItem = (i, field, val) => {
    const ni = [...items]; ni[i] = {...ni[i], [field]: val};
    ni[i].amount = calcAmount(ni[i]);
    setItems(ni);
  };

  const addItem = () => setItems([...items, {...emptyItem}]);
  const removeItem = (i) => setItems(items.filter((_,x) => x!==i));

  const subTotal = items.reduce((s,it) => s + (it.qty * it.rate), 0);
  const discountAmt = subTotal * (parseFloat(form.discountPct||0)/100);
  const afterDiscount = subTotal - discountAmt;
  const totalSgst = items.reduce((s,it) => { const b=it.qty*it.rate*(1-it.disc/100); return s+b*(it.sgst/100); }, 0);
  const totalCgst = items.reduce((s,it) => { const b=it.qty*it.rate*(1-it.disc/100); return s+b*(it.cgst/100); }, 0);
  const beforeRound = afterDiscount + totalSgst + totalCgst - parseFloat(form.crDrNote||0);
  const roundoff = parseFloat((Math.round(beforeRound) - beforeRound).toFixed(2));
  const grandTotal = Math.round(beforeRound);

  const numberToWords = (n) => {
    const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    if(n===0) return 'Zero';
    const s=('000000000'+n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if(!s) return ''; let r='';
    r+=(s[1]!=0)?(a[Number(s[1])]||b[s[1][0]]+' '+a[s[1][1]])+' Crore ':'';
    r+=(s[2]!=0)?(a[Number(s[2])]||b[s[2][0]]+' '+a[s[2][1]])+' Lakh ':'';
    r+=(s[3]!=0)?(a[Number(s[3])]||b[s[3][0]]+' '+a[s[3][1]])+' Thousand ':'';
    r+=(s[4]!=0)?(a[Number(s[4])]||b[s[4][0]]+' '+a[s[4][1]])+' Hundred ':'';
    r+=(s[5]!=0)?((r?'and ':'')+((a[Number(s[5])])||b[s[5][0]]+' '+a[s[5][1]])):'';
    return r.trim()+' Only';
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    setExtracting(true);
    const fd = new FormData(); fd.append("invoice", file);
    try {
      const res = await axios.post("http://localhost:5000/api/suppliers/extract-invoice", fd, {
        headers: {...headers(), "Content-Type":"multipart/form-data"}
      });
      const d = res.data;
      let mid = "";
      const m = suppliers.find(s => s.name.toLowerCase().includes(d.supplierName.split(' ')[0].toLowerCase()));
      if(m) mid = m.id.toString();
      setForm(f => ({...f, supplierId:mid, supplierName:d.supplierName, invoiceNo:d.invoiceNo, date:d.date, paymentMode:d.paymentMode||"credit"}));
      if(d.items?.length) setItems(d.items.map(it => ({...emptyItem, ...it, rate:it.costPrice||it.rate||0, amount:calcAmount({...emptyItem,...it,rate:it.costPrice||it.rate||0})})));
      alert("Invoice extracted via AI OCR!");
      setView("create");
    } catch(err) { alert("Extraction failed: "+(err.response?.data?.error||err.message)); }
    finally { setExtracting(false); if(fileInputRef.current) fileInputRef.current.value=""; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.supplierId) return alert("Select a supplier.");
    if(items.length===0||!items[0].name) return alert("Add at least one item.");
    setSaving(true);
    try {
      const payload = {...form, items: items.map(it => ({...it, costPrice:it.rate, taxPercent:(it.sgst+it.cgst), schemeQty:it.free})),
        subtotal:subTotal, gstAmount:totalSgst+totalCgst, discount:discountAmt, total:grandTotal};
      await axios.post("http://localhost:5000/api/suppliers/direct-purchase", payload, { headers: headers() });
      alert("Purchase Bill Saved & Inventory Updated!");
      setForm({supplierId:"",supplierName:"",supplierGstin:"",invoiceNo:"",date:new Date().toISOString().split("T")[0],dueDate:"",orderNo:"",lrNo:"",cases:0,transport:"",paymentMode:"credit",discountPct:5,crDrNote:0});
      setItems([{...emptyItem}]);
      axios.get("http://localhost:5000/api/suppliers/orders",{headers:headers()}).then(r=>setBills(r.data));
      setView("list");
    } catch(err) { alert("Error: "+err.message); }
    finally { setSaving(false); }
  };

  // -- LIST VIEW --
  if(view==="list") return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-7 h-7 text-teal-600" /> Purchase Bill Reading
            </h1>
            <p className="text-sm text-slate-500 mt-1">Record inward GST invoices matching actual pharma bill format.</p>
          </div>
          <div className="flex gap-3">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,.pdf" className="hidden" />
            <button onClick={()=>fileInputRef.current?.click()} disabled={extracting}
              className="bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm">
              {extracting ? <Wand2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
              {extracting ? "Extracting..." : "Upload Bill (AI OCR)"}
            </button>
            <button onClick={()=>setView("create")}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition">
              <Plus className="w-4 h-4"/> New Bill Entry
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            {label:"Total Bills", value:bills.length, border:"border-teal-500", bg:"text-teal-600 bg-teal-50"},
            {label:"Total Purchase Value", value:`?${bills.reduce((s,b)=>s+(b.total||0),0).toLocaleString("en-IN",{minimumFractionDigits:2})}`, border:"border-emerald-500", bg:"text-emerald-600 bg-emerald-50"},
            {label:"Credit Bills", value:bills.filter(b=>b.paymentMode==="credit").length, border:"border-rose-500", bg:"text-rose-600 bg-rose-50"},
          ].map((c,i)=>(
            <div key={i} className={`bg-white border-l-4 ${c.border} border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between`}>
              <div><p className="text-2xl font-bold text-slate-900">{c.value}</p><p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-1">{c.label}</p></div>
              <div className={`p-2.5 rounded-lg ${c.bg}`}><FileText className="w-5 h-5"/></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="data-table w-full text-sm">
            <thead className="bg-slate-50"><tr>
              <th className="px-4 py-3 text-left font-bold text-slate-600">PO/Invoice</th>
              <th className="px-4 py-3 text-left font-bold text-slate-600">Supplier</th>
              <th className="px-4 py-3 text-left font-bold text-slate-600">Date</th>
              <th className="px-4 py-3 text-left font-bold text-slate-600">Items</th>
              <th className="px-4 py-3 text-right font-bold text-slate-600">Total</th>
              <th className="px-4 py-3 text-left font-bold text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-bold text-slate-600">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {bills.map(b=>(
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-teal-600 font-bold">{b.poNumber}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{b.supplierName}</td>
                  <td className="px-4 py-3 text-slate-600">{b.receivedDate||b.createdAt?.split("T")[0]}</td>
                  <td className="px-4 py-3 text-slate-500">{b.items?.length||0} items</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">?{(b.total||0).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${b.status==="received"?"bg-emerald-50 text-emerald-700 border-emerald-200":"bg-amber-50 text-amber-700 border-amber-200"}`}>{b.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={()=>{setActiveBill(b);setView("preview");}} className="text-teal-600 hover:text-teal-800 text-xs font-semibold mr-3">View</button>
                  </td>
                </tr>
              ))}
              {bills.length===0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">No purchase bills recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );

  // -- CREATE VIEW (matches actual pharma bill format) --
  if(view==="create") return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto max-h-screen">
        <div className="p-8 pb-40 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2"><FileText className="w-6 h-6 text-teal-600"/> GST Purchase Invoice Entry</h1>
              <p className="text-sm text-slate-500 mt-1">Enter bill exactly as per supplier GST invoice format.</p>
            </div>
            <button onClick={()=>setView("list")} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4"/> Back
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Invoice Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-bold text-slate-700 text-sm mb-4 pb-2 border-b border-slate-100 uppercase tracking-wider">Invoice Header</h2>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Supplier (M/s)</label>
                  <select required value={form.supplierId} onChange={handleSupplierSelect} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 bg-white outline-none">
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">GSTIN</label>
                  <input type="text" value={form.supplierGstin} onChange={e=>setForm({...form,supplierGstin:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-teal-400" placeholder="22AAAAA0000A1Z5"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Invoice No</label>
                  <input type="text" required value={form.invoiceNo} onChange={e=>setForm({...form,invoiceNo:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-teal-400" placeholder="CR000468"/>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4">
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Date</label>
                  <input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"/></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"/></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Order No</label>
                  <input type="text" value={form.orderNo} onChange={e=>setForm({...form,orderNo:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"/></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">LR No</label>
                  <input type="text" value={form.lrNo} onChange={e=>setForm({...form,lrNo:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"/></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Cases</label>
                  <input type="number" min="0" value={form.cases} onChange={e=>setForm({...form,cases:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"/></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Transport</label>
                  <input type="text" value={form.transport} onChange={e=>setForm({...form,transport:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"/></div>
              </div>
            </div>

            {/* Line Items - Exact bill column format */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b flex justify-between items-center">
                <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Line Items (GST Invoice Format)</h2>
                <button type="button" onClick={addItem} className="text-teal-600 text-sm font-semibold flex items-center gap-1 hover:text-teal-800"><Plus className="w-4 h-4"/> Add Row</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gradient-to-r from-slate-100 to-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-2 py-3 text-center w-10">S.</th>
                      <th className="px-2 py-3 text-left w-16">HSN</th>
                      <th className="px-2 py-3 text-left min-w-[180px]">Product</th>
                      <th className="px-2 py-3 text-left w-20">Pack</th>
                      <th className="px-2 py-3 text-center w-14">Qty</th>
                      <th className="px-2 py-3 text-center w-14">Free</th>
                      <th className="px-2 py-3 text-left w-24">Batch</th>
                      <th className="px-2 py-3 text-left w-24">Exp</th>
                      <th className="px-2 py-3 text-right w-16">MRP</th>
                      <th className="px-2 py-3 text-right w-16">Rate</th>
                      <th className="px-2 py-3 text-center w-14">DIS%</th>
                      <th className="px-2 py-3 text-center w-14">SCH%</th>
                      <th className="px-2 py-3 text-center w-14">SGST%</th>
                      <th className="px-2 py-3 text-center w-14">CGST%</th>
                      <th className="px-2 py-3 text-right w-20">Amount</th>
                      <th className="px-2 py-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-teal-50/30 transition">
                        <td className="px-2 py-2 text-center"><input type="text" value={item.sNo || idx+1} onChange={e=>updateItem(idx,"sNo",e.target.value)} className="w-full text-center bg-transparent outline-none text-slate-400 font-bold text-xs" /></td>
                        <td className="px-1 py-2"><input type="text" value={item.hsn} onChange={e=>updateItem(idx,"hsn",e.target.value)} className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-teal-400 font-mono"/></td>
                        <td className="px-1 py-2"><input type="text" required value={item.name} onChange={e=>updateItem(idx,"name",e.target.value)} className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-teal-400" placeholder="Product name"/></td>
                        <td className="px-1 py-2"><input type="text" value={item.pack} onChange={e=>updateItem(idx,"pack",e.target.value)} className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-teal-400" placeholder="10x10"/></td>
                        <td className="px-1 py-2"><input type="number" min="1" value={item.qty} onChange={e=>updateItem(idx,"qty",parseFloat(e.target.value)||0)} className="w-full border border-slate-200 rounded px-1 py-1 text-xs text-center outline-none focus:ring-1 focus:ring-teal-400"/></td>
                        <td className="px-1 py-2"><input type="number" min="0" value={item.free} onChange={e=>updateItem(idx,"free",parseFloat(e.target.value)||0)} className="w-full border border-slate-200 rounded px-1 py-1 text-xs text-center outline-none focus:ring-1 focus:ring-emerald-400 bg-emerald-50/50"/></td>
                        <td className="px-1 py-2"><input type="text" value={item.batch} onChange={e=>updateItem(idx,"batch",e.target.value)} className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-teal-400 font-mono" placeholder="BATCH"/></td>
                        <td className="px-1 py-2"><input type="text" value={item.exp} onChange={e=>updateItem(idx,"exp",e.target.value)} className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-teal-400" placeholder="MM/YY"/></td>
                        <td className="px-1 py-2"><input type="number" step="0.01" value={item.mrp} onChange={e=>updateItem(idx,"mrp",parseFloat(e.target.value)||0)} className="w-full border border-slate-200 rounded px-1 py-1 text-xs text-right outline-none focus:ring-1 focus:ring-teal-400"/></td>
                        <td className="px-1 py-2"><input type="number" step="0.01" value={item.rate} onChange={e=>updateItem(idx,"rate",parseFloat(e.target.value)||0)} className="w-full border border-slate-200 rounded px-1 py-1 text-xs text-right outline-none focus:ring-1 focus:ring-teal-400 font-bold"/></td>
                        <td className="px-1 py-2"><input type="number" step="0.01" min="0" max="100" value={item.disc} onChange={e=>updateItem(idx,"disc",parseFloat(e.target.value)||0)} className="w-full border border-slate-200 rounded px-1 py-1 text-xs text-center outline-none focus:ring-1 focus:ring-amber-400 bg-amber-50/50"/></td>
                        <td className="px-1 py-2"><input type="number" step="0.01" min="0" max="100" value={item.sch} onChange={e=>updateItem(idx,"sch",parseFloat(e.target.value)||0)} className="w-full border border-slate-200 rounded px-1 py-1 text-xs text-center outline-none focus:ring-1 focus:ring-amber-400 bg-amber-50/50"/></td>
                        <td className="px-1 py-2"><input type="number" step="0.01" value={item.sgst} onChange={e=>updateItem(idx,"sgst",parseFloat(e.target.value)||0)} className="w-full border border-slate-200 rounded px-1 py-1 text-xs text-center outline-none focus:ring-1 focus:ring-blue-400 bg-blue-50/50"/></td>
                        <td className="px-1 py-2"><input type="number" step="0.01" value={item.cgst} onChange={e=>updateItem(idx,"cgst",parseFloat(e.target.value)||0)} className="w-full border border-slate-200 rounded px-1 py-1 text-xs text-center outline-none focus:ring-1 focus:ring-blue-400 bg-blue-50/50"/></td>
                        <td className="px-2 py-2 text-right font-bold text-slate-800">{item.amount.toFixed(2)}</td>
                        <td className="px-1 py-2 text-center">{items.length>1 && <button type="button" onClick={()=>removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Totals - matching actual bill */}
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Amount in Words</p>
                <p className="text-sm font-semibold text-slate-700 italic">Rs. {numberToWords(grandTotal)}</p>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Payment Mode</p>
                  <div className="flex gap-2">
                    {["cash","upi","card","credit"].map(m=>(
                      <button key={m} type="button" onClick={()=>setForm({...form,paymentMode:m})}
                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${form.paymentMode===m?"bg-teal-600 text-white border-teal-600":"bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                        {m.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-600"><span>SUB TOTAL</span><span className="font-bold">?{subTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-slate-600 items-center"><span>Discount</span>
                    <div className="flex items-center gap-1"><input type="number" step="0.1" min="0" max="100" value={form.discountPct} onChange={e=>setForm({...form,discountPct:parseFloat(e.target.value)||0})} className="w-14 border rounded px-1.5 py-0.5 text-xs text-right outline-none focus:ring-1 focus:ring-teal-400"/>% <span className="font-bold text-red-500">-?{discountAmt.toFixed(2)}</span></div>
                  </div>
                  <div className="flex justify-between text-slate-600"><span>SGST</span><span className="font-bold text-blue-600">?{totalSgst.toFixed(2)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>CGST</span><span className="font-bold text-blue-600">?{totalCgst.toFixed(2)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Roundoff</span><span className="font-bold">{roundoff>=0?"+":""}?{roundoff.toFixed(2)}</span></div>
                  <div className="flex justify-between text-slate-600 items-center"><span>CR/DR NOTE</span>
                    <input type="number" step="0.01" value={form.crDrNote} onChange={e=>setForm({...form,crDrNote:parseFloat(e.target.value)||0})} className="w-20 border rounded px-1.5 py-0.5 text-xs text-right outline-none focus:ring-1 focus:ring-teal-400"/>
                  </div>
                  <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-2 border-t border-slate-200"><span>GRAND TOTAL</span><span className="text-teal-700">?{grandTotal.toLocaleString("en-IN",{minimumFractionDigits:2})}</span></div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] p-4 flex justify-end z-10">
              <button type="submit" disabled={saving||!items[0]?.name}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition shadow flex items-center gap-2">
                {saving?"Saving...":"Save Bill & Update Inventory"} {!saving && <CheckCircle2 className="w-5 h-5"/>}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );

  // -- PREVIEW VIEW --
  if(view==="preview" && activeBill) {
    const bi = activeBill;
    const billItems = bi.items || [];
    return (
      <div className="flex min-h-screen bg-slate-100 print:bg-white">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto max-h-screen print:p-0">
          <div className="flex items-center justify-between mb-6 max-w-[210mm] mx-auto print:hidden">
            <button onClick={()=>setView("list")} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4"/> Back
            </button>
            <button onClick={()=>window.print()} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md transition">
              <Printer className="w-4 h-4"/> Print / PDF
            </button>
          </div>

          <div className="max-w-[210mm] mx-auto bg-white border border-slate-200 shadow-lg print:shadow-none print:border-none" style={{fontFamily:"'Courier New', monospace", fontSize:"11px", padding:"20px"}}>
            {/* Bill Header */}
            <div style={{textAlign:"center", borderBottom:"2px solid #000", paddingBottom:"8px", marginBottom:"8px"}}>
              <h2 style={{fontSize:"18px", fontWeight:"bold", margin:"0"}}>{bi.supplierName || "SUPPLIER NAME"}</h2>
              <p style={{fontSize:"10px", margin:"2px 0"}}>GST INVOICE</p>
            </div>

            <div style={{display:"flex", justifyContent:"space-between", fontSize:"10px", marginBottom:"8px", borderBottom:"1px solid #000", paddingBottom:"6px"}}>
              <div><strong>Invoice No:</strong> {bi.poNumber}</div>
              <div><strong>Date:</strong> {bi.receivedDate || bi.createdAt?.split("T")[0]}</div>
              <div><strong>Status:</strong> {bi.status}</div>
            </div>

            {/* Items Table */}
            <table style={{width:"100%", borderCollapse:"collapse", fontSize:"10px", marginBottom:"10px"}}>
              <thead>
                <tr style={{borderBottom:"2px solid #000", borderTop:"2px solid #000"}}>
                  <th style={{padding:"4px 2px", textAlign:"center"}}>S.</th>
                  <th style={{padding:"4px 2px", textAlign:"left"}}>HSN</th>
                  <th style={{padding:"4px 2px", textAlign:"left"}}>Product</th>
                  <th style={{padding:"4px 2px", textAlign:"left"}}>Pack</th>
                  <th style={{padding:"4px 2px", textAlign:"center"}}>Qty</th>
                  <th style={{padding:"4px 2px", textAlign:"center"}}>Free</th>
                  <th style={{padding:"4px 2px", textAlign:"left"}}>Batch</th>
                  <th style={{padding:"4px 2px", textAlign:"right"}}>MRP</th>
                  <th style={{padding:"4px 2px", textAlign:"right"}}>Rate</th>
                  <th style={{padding:"4px 2px", textAlign:"right"}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {billItems.map((it,i) => (
                  <tr key={i} style={{borderBottom:"1px solid #ddd"}}>
                    <td style={{padding:"3px 2px", textAlign:"center"}}>{it.sNo || i+1}</td>
                    <td style={{padding:"3px 2px"}}>{it.hsn||"3004"}</td>
                    <td style={{padding:"3px 2px"}}>{it.name}</td>
                    <td style={{padding:"3px 2px"}}>{it.pack||"-"}</td>
                    <td style={{padding:"3px 2px", textAlign:"center"}}>{it.qty}</td>
                    <td style={{padding:"3px 2px", textAlign:"center"}}>{it.schemeQty||it.free||0}</td>
                    <td style={{padding:"3px 2px"}}>{it.batch||"-"}</td>
                    <td style={{padding:"3px 2px", textAlign:"right"}}>{(it.mrp||0).toFixed(2)}</td>
                    <td style={{padding:"3px 2px", textAlign:"right"}}>{(it.costPrice||it.rate||0).toFixed(2)}</td>
                    <td style={{padding:"3px 2px", textAlign:"right", fontWeight:"bold"}}>{((it.qty||1)*(it.costPrice||it.rate||0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{display:"flex", justifyContent:"flex-end"}}>
              <div style={{width:"250px", fontSize:"11px"}}>
                <div style={{display:"flex", justifyContent:"space-between", padding:"2px 0"}}><span>SUB TOTAL</span><strong>?{(bi.subtotal||0).toFixed(2)}</strong></div>
                <div style={{display:"flex", justifyContent:"space-between", padding:"2px 0"}}><span>GST</span><strong>?{(bi.gstAmount||0).toFixed(2)}</strong></div>
                <div style={{display:"flex", justifyContent:"space-between", padding:"2px 0"}}><span>Discount</span><strong>-?{(bi.discount||0).toFixed(2)}</strong></div>
                <div style={{display:"flex", justifyContent:"space-between", padding:"4px 0", borderTop:"2px solid #000", fontWeight:"bold", fontSize:"14px"}}><span>GRAND TOTAL</span><span>?{(bi.total||0).toLocaleString("en-IN",{minimumFractionDigits:2})}</span></div>
              </div>
            </div>
            <p style={{marginTop:"10px", fontSize:"10px", fontStyle:"italic"}}>Rs. {numberToWords(Math.round(bi.total||0))}</p>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
