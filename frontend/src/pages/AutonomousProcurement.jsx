import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { ShoppingCart, TrendingUp, Award, Zap, ChevronDown, ChevronRight, Check, X } from "lucide-react";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function AutonomousProcurement() {
  const [tab, setTab] = useState("scores");
  const [scores, setScores] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [autoPOs, setAutoPOs] = useState([]);
  const [dashboard, setDashboard] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ itemName: "", requiredQty: "", urgency: "medium", deadline: "" });
  const [expandedRfq, setExpandedRfq] = useState(null);
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    axios.get("/api/procurement/dashboard", { headers: headers() }).then(r => setDashboard(r.data)).catch(() => {});
    axios.get("/api/procurement/supplier-scores", { headers: headers() }).then(r => setScores(r.data)).catch(() => setScores([{ id: 1, supplierName: "MedSupply Co", onTimeDeliveryRate: 92, qualityScore: 88, avgLeadDays: 5, totalOrders: 45, overallScore: 89 }]));
    axios.get("/api/procurement/rfqs", { headers: headers() }).then(r => setRfqs(r.data)).catch(() => {});
    axios.get("/api/procurement/auto-po", { headers: headers() }).then(r => setAutoPOs(r.data)).catch(() => {});
  }, []);

  const createRFQ = async () => {
    try { await axios.post("/api/procurement/rfq", form, { headers: headers() }); setShowModal(false); setForm({ itemName: "", requiredQty: "", urgency: "medium", deadline: "" }); const r = await axios.get("/api/procurement/rfqs", { headers: headers() }); setRfqs(r.data); } catch (e) { alert(e.response?.data?.error || e.message); }
  };
  const viewResponses = async (rfqId) => { if (expandedRfq === rfqId) { setExpandedRfq(null); return; } try { const r = await axios.get(`/api/procurement/rfq/${rfqId}/responses`, { headers: headers() }); setResponses(r.data); setExpandedRfq(rfqId); } catch (e) {} };
  const scoreColor = (s) => s >= 80 ? "text-green-700 bg-green-100" : s >= 50 ? "text-yellow-700 bg-yellow-100" : "text-red-700 bg-red-100";
  const urgencyBadge = (u) => ({ critical: "bg-red-600 text-white", high: "bg-orange-500 text-white", medium: "bg-yellow-400 text-black", low: "bg-gray-300 text-gray-700" }[u] || "bg-gray-200");

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="Autonomous Procurement Network" />
      <main className="flex-1 p-2 overflow-auto">
        <div className="flex gap-2 mb-2">
          {[{ k: "totalRfqs", l: "Total RFQs", c: "blue" }, { k: "pendingResponses", l: "Pending", c: "yellow" }, { k: "aiPOs", l: "AI POs", c: "purple" }, { k: "avgSupplierScore", l: "Avg Score", c: "green" }].map(c => (
            <div key={c.k} className={`flex-1 bg-white border border-gray-300 p-2 shadow-sm`}><div className="text-[10px] text-gray-500 uppercase">{c.l}</div><div className="text-lg font-bold">{dashboard[c.k] || 0}</div></div>
          ))}
        </div>
        <div className="flex gap-1 mb-2 bg-white border border-gray-300 p-1">
          {[["scores","Supplier Scores"],["rfqs","Active RFQs"],["auto","AI Draft POs"]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-3 py-1 text-xs font-bold rounded ${tab === k ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{l}</button>
          ))}
        </div>
        {tab === "scores" && (
          <div className="bg-white border border-gray-300 shadow-sm">
            <div className="bg-gray-200 p-2 font-bold flex items-center"><Award className="w-4 h-4 mr-2"/> Supplier Performance Rankings</div>
            <table className="w-full text-left border-collapse"><thead className="bg-gray-100 border-b border-gray-300"><tr>{["#","Supplier","On-Time %","Quality","Lead Days","Orders","Overall"].map(h => <th key={h} className="p-1.5 border-r border-gray-300 font-bold">{h}</th>)}</tr></thead>
            <tbody>{scores.map((s, i) => (<tr key={s.id} className="border-b border-gray-200 hover:bg-blue-50"><td className="p-1.5 border-r border-gray-300 font-bold">{i+1}</td><td className="p-1.5 border-r border-gray-300">{s.supplierName || "Not Entered"}</td><td className="p-1.5 border-r border-gray-300"><span className={`px-1 rounded ${scoreColor(s.onTimeDeliveryRate)}`}>{s.onTimeDeliveryRate}%</span></td><td className="p-1.5 border-r border-gray-300"><span className={`px-1 rounded ${scoreColor(s.qualityScore)}`}>{s.qualityScore}</span></td><td className="p-1.5 border-r border-gray-300">{s.avgLeadDays}d</td><td className="p-1.5 border-r border-gray-300">{s.totalOrders}</td><td className="p-1.5"><span className={`px-2 py-0.5 rounded font-bold ${scoreColor(s.overallScore)}`}>{s.overallScore}/100</span></td></tr>))}</tbody></table>
          </div>
        )}
        {tab === "rfqs" && (
          <div className="bg-white border border-gray-300 shadow-sm">
            <div className="bg-gray-200 p-2 font-bold flex items-center justify-between"><span className="flex items-center"><ShoppingCart className="w-4 h-4 mr-2"/> Active RFQs</span><button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">+ New RFQ</button></div>
            <table className="w-full text-left border-collapse"><thead className="bg-gray-100 border-b border-gray-300"><tr>{["RFQ#","Item","Qty","Urgency","Responses","Best Price","Status",""].map(h => <th key={h} className="p-1.5 border-r border-gray-300">{h}</th>)}</tr></thead>
            <tbody>{rfqs.map(r => (<>
              <tr key={r.id} className="border-b border-gray-200 hover:bg-blue-50"><td className="p-1.5 border-r border-gray-300 font-bold text-blue-700">{r.rfqNumber}</td><td className="p-1.5 border-r border-gray-300">{r.itemName}</td><td className="p-1.5 border-r border-gray-300">{r.requiredQty}</td><td className="p-1.5 border-r border-gray-300"><span className={`px-1 py-0.5 rounded text-[9px] font-bold ${urgencyBadge(r.urgency)}`}>{r.urgency}</span></td><td className="p-1.5 border-r border-gray-300">{r.responsesCount || 0}</td><td className="p-1.5 border-r border-gray-300">{r.bestLandedCost ? `₹${r.bestLandedCost}` : "-"}</td><td className="p-1.5 border-r border-gray-300"><span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-[9px] font-bold">{r.status}</span></td><td className="p-1.5"><button onClick={() => viewResponses(r.id)} className="text-blue-600 hover:underline">{expandedRfq === r.id ? "Hide" : "Responses"}</button></td></tr>
              {expandedRfq === r.id && <tr><td colSpan={8} className="bg-gray-50 p-2">{responses.length ? <table className="w-full text-left"><thead><tr className="bg-gray-200"><th className="p-1">Supplier</th><th className="p-1">Unit Price</th><th className="p-1">Delivery</th><th className="p-1">Free Qty</th><th className="p-1">Landed Cost</th><th className="p-1">Selected</th></tr></thead><tbody>{responses.map(rr => <tr key={rr.id} className={rr.selected ? "bg-green-50" : ""}><td className="p-1">{rr.supplierName}</td><td className="p-1">₹{rr.unitPrice}</td><td className="p-1">{rr.deliveryDays}d</td><td className="p-1">{rr.freeQty}</td><td className="p-1 font-bold">₹{rr.landedCost}</td><td className="p-1">{rr.selected ? <Check className="w-3 h-3 text-green-600"/> : "-"}</td></tr>)}</tbody></table> : <p className="text-gray-500">No responses yet</p>}</td></tr>}
            </>))}</tbody></table>
          </div>
        )}
        {tab === "auto" && (
          <div className="bg-white border border-gray-300 shadow-sm">
            <div className="bg-gray-200 p-2 font-bold flex items-center"><Zap className="w-4 h-4 mr-2"/> AI-Generated Draft Purchase Orders</div>
            <table className="w-full text-left border-collapse"><thead className="bg-gray-100 border-b border-gray-300"><tr>{["PO#","Supplier","Items","Total ₹","AI Confidence","Source","Actions"].map(h => <th key={h} className="p-1.5 border-r border-gray-300">{h}</th>)}</tr></thead>
            <tbody>{autoPOs.map(po => (<tr key={po.id} className="border-b border-gray-200 hover:bg-blue-50"><td className="p-1.5 border-r border-gray-300 font-bold">{po.poNumber}</td><td className="p-1.5 border-r border-gray-300">{po.supplierName || "Not Entered"}</td><td className="p-1.5 border-r border-gray-300">{(po.items || []).length}</td><td className="p-1.5 border-r border-gray-300 font-bold">₹{(po.total || 0).toLocaleString()}</td><td className="p-1.5 border-r border-gray-300"><div className="w-20 bg-gray-200 rounded-full h-3"><div className="bg-green-500 h-3 rounded-full" style={{width:`${po.autoScore||0}%`}}></div></div><span className="text-[9px]">{Math.round(po.autoScore||0)}%</span></td><td className="p-1.5 border-r border-gray-300"><span className="bg-purple-100 text-purple-700 px-1 rounded text-[9px] font-bold">{po.source}</span></td><td className="p-1.5"><button className="bg-green-600 text-white px-2 py-0.5 rounded mr-1 text-[10px]">Approve</button><button className="bg-red-500 text-white px-2 py-0.5 rounded text-[10px]">Reject</button></td></tr>))}</tbody></table>
          </div>
        )}
      </main>
      {showModal && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"><div className="bg-white border border-gray-300 shadow-lg w-96 p-4"><h3 className="font-bold mb-3">New RFQ</h3><div className="flex flex-col gap-2"><input placeholder="Item Name" value={form.itemName} onChange={e => setForm({...form, itemName: e.target.value})} className="border border-gray-300 p-1.5 text-xs rounded"/><input type="number" placeholder="Required Qty" value={form.requiredQty} onChange={e => setForm({...form, requiredQty: e.target.value})} className="border border-gray-300 p-1.5 text-xs rounded"/><select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})} className="border border-gray-300 p-1.5 text-xs rounded"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select><input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="border border-gray-300 p-1.5 text-xs rounded"/></div><div className="flex gap-2 mt-3"><button onClick={createRFQ} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold">Create RFQ</button><button onClick={() => setShowModal(false)} className="bg-gray-300 px-4 py-1.5 rounded text-xs">Cancel</button></div></div></div>}
      <BusinessFooter />
    </div>
  );
}
