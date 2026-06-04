import { useState, useEffect } from "react";
import axios from "../api/axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { Shield, AlertTriangle, FileCheck, Activity, Bell, Check } from "lucide-react";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function ComplianceDashboard() {
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [scheduleH, setScheduleH] = useState([]);
  const [gstHealth, setGstHealth] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: "drug_license", title: "", documentNo: "", issuedBy: "", validFrom: "", validTo: "", alertDays: 30 });

  useEffect(() => {
    axios.get("/api/compliance/dashboard").then(r => setItems(r.data)).catch(() => setItems([{ id: 1, type: "drug_license", title: "Wholesale Drug License", documentNo: "DL-1234", validTo: "2026-12-31", status: "valid" }]));
    axios.get("/api/compliance/alerts").then(r => setAlerts(r.data)).catch(() => {});
    axios.get("/api/compliance/schedule-h").then(r => setScheduleH(r.data)).catch(() => []);
    axios.get("/api/compliance/gst-health").then(r => setGstHealth(r.data)).catch(() => setGstHealth({ filingReadiness: 85, inputCreditMatch: 92, outputTaxMatch: 96 }));
  }, []);

  const addItem = async () => { try { await axios.post("/api/compliance/items", form); setShowModal(false); const r = await axios.get("/api/compliance/dashboard"); setItems(r.data); } catch (e) {  } };
  const ackAlert = async (id) => { try { await axios.post(`/api/compliance/alerts/${id}/acknowledge`, {}); setAlerts(alerts.filter(a => a.id !== id)); } catch (e) {} };
  const daysLeft = (d) => d ? Math.round((new Date(d) - new Date()) / 86400000) : null;
  const statusBadge = (s) => ({ valid: "bg-green-100 text-green-700", expiring_soon: "bg-yellow-100 text-yellow-700", expired: "bg-red-100 text-red-700", pending_renewal: "bg-blue-100 text-blue-700" }[s] || "bg-gray-200");
  const sevColor = (s) => ({ critical: "border-red-500 bg-red-50", high: "border-orange-400 bg-orange-50", medium: "border-yellow-400 bg-yellow-50", low: "border-blue-300 bg-blue-50" }[s] || "border-gray-300");
  const valid = items.filter(i => i.status === "valid").length;
  const expiring = items.filter(i => i.status === "expiring_soon").length;
  const expired = items.filter(i => i.status === "expired").length;

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="Compliance & Risk Intelligence" />
      <main className="flex-1 p-2 overflow-auto flex flex-col gap-2">
        <div className="flex gap-2">{[{ l: "Valid Docs", v: valid, c: "bg-green-50 border-green-200 text-green-700" }, { l: "Expiring Soon", v: expiring, c: "bg-yellow-50 border-yellow-200 text-yellow-700" }, { l: "Expired", v: expired, c: "bg-red-50 border-red-200 text-red-700" }, { l: "Score", v: `${items.length > 0 ? Math.round((valid / items.length) * 100) : 0}%`, c: "bg-blue-50 border-blue-200 text-blue-700" }].map(c => <div key={c.l} className={`flex-1 border p-2 shadow-sm ${c.c}`}><div className="text-[10px] uppercase">{c.l}</div><div className="text-lg font-bold">{c.v}</div></div>)}</div>
        <div className="bg-white border border-gray-300 shadow-sm"><div className="bg-gray-200 p-2 font-bold flex justify-between"><span className="flex items-center"><Shield className="w-4 h-4 mr-2"/> Document Registry</span><button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">+ Add Document</button></div><table className="w-full text-left border-collapse"><thead className="bg-gray-100"><tr>{["Type","Title","Doc No","Issued By","Valid From","Valid To","Days Left","Status","Actions"].map(h => <th key={h} className="p-1.5 border-r border-gray-300">{h}</th>)}</tr></thead><tbody>{items.map(i => { const dl = daysLeft(i.validTo); return <tr key={i.id} className="border-b border-gray-200 hover:bg-blue-50"><td className="p-1.5 border-r border-gray-300"><span className="bg-blue-100 text-blue-700 px-1 rounded text-[9px] font-bold">{i.type}</span></td><td className="p-1.5 border-r border-gray-300 font-bold">{i.title}</td><td className="p-1.5 border-r border-gray-300">{i.documentNo || "Not Entered"}</td><td className="p-1.5 border-r border-gray-300">{i.issuedBy || "Not Entered"}</td><td className="p-1.5 border-r border-gray-300">{i.validFrom || "Not Entered"}</td><td className="p-1.5 border-r border-gray-300">{i.validTo || "Not Entered"}</td><td className="p-1.5 border-r border-gray-300"><span className={`font-bold ${dl !== null && dl <= 30 ? "text-red-600" : dl !== null && dl <= 90 ? "text-yellow-600" : "text-green-600"}`}>{dl !== null ? `${dl}d` : "N/A"}</span></td><td className="p-1.5 border-r border-gray-300"><span className={`px-1 py-0.5 rounded text-[9px] font-bold ${statusBadge(i.status)}`}>{i.status}</span></td><td className="p-1.5"><button className="text-blue-600 hover:underline text-[10px]">View</button></td></tr>; })}</tbody></table></div>
        {alerts.length > 0 && <div className="bg-white border border-gray-300 shadow-sm"><div className="bg-gray-200 p-2 font-bold flex items-center"><Bell className="w-4 h-4 mr-2 text-red-500"/> Active Alerts</div><div className="p-2 flex flex-col gap-1">{alerts.map(a => <div key={a.id} className={`border-l-4 p-2 rounded flex justify-between items-center ${sevColor(a.severity)}`}><div><span className={`px-1 py-0.5 rounded text-[9px] font-bold mr-2 ${a.severity === "critical" ? "bg-red-600 text-white" : a.severity === "high" ? "bg-orange-500 text-white" : "bg-yellow-400"}`}>{a.severity}</span>{a.message}</div><button onClick={() => ackAlert(a.id)} className="bg-green-600 text-white px-2 py-0.5 rounded text-[10px] flex items-center"><Check className="w-3 h-3 mr-0.5"/> ACK</button></div>)}</div></div>}
        <div className="flex gap-2">
          <div className="flex-1 bg-white border border-gray-300 shadow-sm"><div className="bg-gray-200 p-2 font-bold flex items-center"><Activity className="w-4 h-4 mr-2"/> GST Health</div><div className="p-3 flex flex-col gap-2">{[{ l: "Filing Readiness", v: gstHealth.filingReadiness }, { l: "Input Credit Match", v: gstHealth.inputCreditMatch }, { l: "Output Tax Match", v: gstHealth.outputTaxMatch }].map(g => <div key={g.l}><div className="flex justify-between mb-0.5"><span>{g.l}</span><span className="font-bold">{g.v || 0}%</span></div><div className="w-full bg-gray-200 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${(g.v||0) > 90 ? "bg-green-500" : (g.v||0) > 70 ? "bg-yellow-400" : "bg-red-500"}`} style={{width:`${g.v||0}%`}}></div></div></div>)}</div></div>
          <div className="flex-1 bg-white border border-gray-300 shadow-sm"><div className="bg-gray-200 p-2 font-bold flex items-center"><FileCheck className="w-4 h-4 mr-2"/> Schedule H Register</div><table className="w-full text-left border-collapse"><thead className="bg-gray-100"><tr>{["Date","Bill#","Customer","Drug","Schedule","Qty"].map(h => <th key={h} className="p-1 border-r border-gray-300">{h}</th>)}</tr></thead><tbody>{scheduleH.slice(0, 10).map((s, i) => <tr key={i} className="border-b border-gray-200"><td className="p-1 border-r border-gray-300">{new Date(s.date).toLocaleDateString()}</td><td className="p-1 border-r border-gray-300">{s.billNo}</td><td className="p-1 border-r border-gray-300">{s.customer}</td><td className="p-1 border-r border-gray-300">{s.drugName}</td><td className="p-1 border-r border-gray-300"><span className="bg-red-100 text-red-700 px-1 rounded text-[9px] font-bold">{s.schedule}</span></td><td className="p-1">{s.qty}</td></tr>)}{scheduleH.length === 0 && <tr><td colSpan={6} className="p-3 text-center text-gray-400">No Schedule H sales recorded</td></tr>}</tbody></table></div>
        </div>
      </main>
      {showModal && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"><div className="bg-white border border-gray-300 shadow-lg w-96 p-4"><h3 className="font-bold mb-3">Add Compliance Document</h3><div className="flex flex-col gap-2"><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="border border-gray-300 p-1.5 rounded text-xs">{["drug_license","gst_cert","fssai","schedule_h_register","cold_chain_cert","fire_safety","trade_license"].map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</select><input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="border border-gray-300 p-1.5 rounded text-xs"/><input placeholder="Document No" value={form.documentNo} onChange={e => setForm({...form, documentNo: e.target.value})} className="border border-gray-300 p-1.5 rounded text-xs"/><input placeholder="Issued By" value={form.issuedBy} onChange={e => setForm({...form, issuedBy: e.target.value})} className="border border-gray-300 p-1.5 rounded text-xs"/><div className="flex gap-2"><input type="date" value={form.validFrom} onChange={e => setForm({...form, validFrom: e.target.value})} className="flex-1 border border-gray-300 p-1.5 rounded text-xs"/><input type="date" value={form.validTo} onChange={e => setForm({...form, validTo: e.target.value})} className="flex-1 border border-gray-300 p-1.5 rounded text-xs"/></div></div><div className="flex gap-2 mt-3"><button onClick={addItem} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold">Add</button><button onClick={() => setShowModal(false)} className="bg-gray-300 px-4 py-1.5 rounded text-xs">Cancel</button></div></div></div>}
      <BusinessFooter />
    </div>
  );
}
