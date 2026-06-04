import { useState, useEffect } from "react";
import axios from "../api/axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { Building2, ArrowRightLeft, BarChart3, MapPin, TrendingUp } from "lucide-react";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function ControlTower() {
  const [branches, setBranches] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [benchmark, setBenchmark] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fromBranch: "", toBranch: "", fromBranchId: "", toBranchId: "", items: "[]", notes: "" });

  useEffect(() => {
    axios.get("/api/distribution/branches").then(r => setBranches(r.data)).catch(() => setBranches([{ id: 1, name: "HQ Mumbai", city: "Mumbai", code: "MUM-01" }]));
    axios.get("/api/distribution/transfers").then(r => setTransfers(r.data)).catch(() => {});
    axios.get("/api/distribution/benchmark").then(r => setBenchmark(r.data)).catch(() => {});
    axios.get("/api/distribution/optimizer").then(r => setSuggestions(r.data?.suggestions || [])).catch(() => {});
  }, []);

  const createTransfer = async () => { try { await axios.post("/api/distribution/transfer", form); setShowModal(false); const r = await axios.get("/api/distribution/transfers"); setTransfers(r.data); } catch (e) {  } };
  const statusBadge = (s) => ({ draft: "bg-gray-200", approved: "bg-green-100 text-green-700", in_transit: "bg-blue-100 text-blue-700", received: "bg-green-600 text-white", cancelled: "bg-red-100 text-red-700" }[s] || "bg-gray-200");

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="National Distribution Control Tower" />
      <main className="flex-1 p-2 overflow-auto flex flex-col gap-2">
        <div className="flex gap-2">
          {[{ l: "Branches", v: branches.length, c: "bg-blue-50 border-blue-200" }, { l: "In-Transit", v: transfers.filter(t => t.status === "in_transit").length, c: "bg-yellow-50 border-yellow-200" }, { l: "Network Sales", v: `₹${benchmark.reduce((s, b) => s + (b.sales || 0), 0).toLocaleString()}`, c: "bg-green-50 border-green-200" }].map(c => (
            <div key={c.l} className={`flex-1 border p-2 shadow-sm ${c.c}`}><div className="text-[10px] text-gray-500 uppercase">{c.l}</div><div className="text-lg font-bold">{c.v}</div></div>
          ))}
        </div>
        {suggestions.length > 0 && <div className="bg-purple-50 border border-purple-200 p-2 shadow-sm"><div className="font-bold text-purple-700 mb-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1"/> AI Redistribution Suggestions</div>{suggestions.map((s, i) => <div key={i} className="flex justify-between items-center py-1 border-b border-purple-100 last:border-0"><span>{s.action}</span><span className="text-purple-600 font-bold">{s.confidence}% confidence</span></div>)}</div>}
        <div className="bg-white border border-gray-300 shadow-sm"><div className="bg-gray-200 p-2 font-bold flex items-center"><Building2 className="w-4 h-4 mr-2"/> Branch Network</div>
          <div className="flex flex-wrap gap-2 p-2">{branches.map(b => <div key={b.id} className="border border-gray-300 p-2 w-48 bg-white shadow-sm hover:shadow-md transition-shadow"><div className="font-bold text-blue-700">{b.name}</div><div className="flex items-center text-gray-500"><MapPin className="w-3 h-3 mr-1"/>{b.city || "Not Entered"}, {b.state || ""}</div><div className="text-[10px] mt-1">Code: {b.code}</div><div className="mt-1"><span className="bg-green-100 text-green-700 px-1 rounded text-[9px] font-bold">Active</span></div></div>)}</div>
        </div>
        <div className="bg-white border border-gray-300 shadow-sm"><div className="bg-gray-200 p-2 font-bold flex justify-between items-center"><span className="flex items-center"><ArrowRightLeft className="w-4 h-4 mr-2"/> Stock Transfers</span><button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">+ New Transfer</button></div>
          <table className="w-full text-left border-collapse"><thead className="bg-gray-100 border-b border-gray-300"><tr>{["Transfer#","From","To","Items","Value ₹","Status","Actions"].map(h => <th key={h} className="p-1.5 border-r border-gray-300">{h}</th>)}</tr></thead>
          <tbody>{transfers.map(t => <tr key={t.id} className="border-b border-gray-200 hover:bg-blue-50"><td className="p-1.5 border-r border-gray-300 font-bold">{t.transferNo}</td><td className="p-1.5 border-r border-gray-300">{t.fromBranch || "Not Entered"}</td><td className="p-1.5 border-r border-gray-300">{t.toBranch || "Not Entered"}</td><td className="p-1.5 border-r border-gray-300">{t.itemCount}</td><td className="p-1.5 border-r border-gray-300">₹{(t.totalValue || 0).toLocaleString()}</td><td className="p-1.5 border-r border-gray-300"><span className={`px-1 py-0.5 rounded text-[9px] font-bold ${statusBadge(t.status)}`}>{t.status}</span></td><td className="p-1.5"><button className="text-blue-600 hover:underline text-[10px]">View</button></td></tr>)}</tbody></table>
        </div>
        <div className="bg-white border border-gray-300 shadow-sm"><div className="bg-gray-200 p-2 font-bold flex items-center"><BarChart3 className="w-4 h-4 mr-2"/> Branch Benchmarking</div>
          <table className="w-full text-left border-collapse"><thead className="bg-gray-100 border-b border-gray-300"><tr>{["Branch","Sales ₹","Purchases ₹","Margin %","Receivables ₹","Payables ₹","Efficiency"].map(h => <th key={h} className="p-1.5 border-r border-gray-300">{h}</th>)}</tr></thead>
          <tbody>{benchmark.map(b => <tr key={b.id} className="border-b border-gray-200 hover:bg-blue-50"><td className="p-1.5 border-r border-gray-300 font-bold">{b.name}</td><td className="p-1.5 border-r border-gray-300 text-green-700">₹{(b.sales||0).toLocaleString()}</td><td className="p-1.5 border-r border-gray-300">₹{(b.purchases||0).toLocaleString()}</td><td className="p-1.5 border-r border-gray-300 font-bold">{b.profitMargin}%</td><td className="p-1.5 border-r border-gray-300">₹{(b.receivables||0).toLocaleString()}</td><td className="p-1.5 border-r border-gray-300 text-red-600">₹{(b.payables||0).toLocaleString()}</td><td className="p-1.5"><div className="w-16 bg-gray-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{width:`${b.efficiency}%`}}></div></div></td></tr>)}</tbody></table>
        </div>
      </main>
      {showModal && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"><div className="bg-white border border-gray-300 shadow-lg w-96 p-4"><h3 className="font-bold mb-3">New Stock Transfer</h3><div className="flex flex-col gap-2"><select onChange={e => { const b = branches.find(x => x.id == e.target.value); setForm({...form, fromBranchId: e.target.value, fromBranch: b?.name}); }} className="border border-gray-300 p-1.5 text-xs rounded"><option>From Branch...</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select><select onChange={e => { const b = branches.find(x => x.id == e.target.value); setForm({...form, toBranchId: e.target.value, toBranch: b?.name}); }} className="border border-gray-300 p-1.5 text-xs rounded"><option>To Branch...</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select><textarea placeholder='Items JSON: [{"name":"Dolo","qty":100,"rate":25}]' value={form.items} onChange={e => setForm({...form, items: e.target.value})} className="border border-gray-300 p-1.5 text-xs rounded h-20"/><input placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="border border-gray-300 p-1.5 text-xs rounded"/></div><div className="flex gap-2 mt-3"><button onClick={createTransfer} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold">Create</button><button onClick={() => setShowModal(false)} className="bg-gray-300 px-4 py-1.5 rounded text-xs">Cancel</button></div></div></div>}
      <BusinessFooter />
    </div>
  );
}
