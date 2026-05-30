import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { Zap, Play, Pause, Trash2, Settings, ChevronRight, RefreshCw } from "lucide-react";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const TRIGGERS = ["invoice_created", "stock_below_reorder", "payment_overdue", "expiry_approaching", "high_value_invoice", "payment_received", "purchase_created"];
const ACTIONS = ["send_whatsapp", "create_po", "notify_manager", "apply_discount", "webhook", "log"];

export default function AutomationBuilder() {
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", trigger: "invoice_created", triggerConfig: {}, action: "notify_manager", actionConfig: {} });
  const logRef = useRef(null);

  useEffect(() => {
    axios.get("/api/automation/rules", { headers: headers() }).then(r => setRules(r.data)).catch(() => {});
    axios.get("/api/automation/logs", { headers: headers() }).then(r => setLogs(r.data)).catch(() => {});
  }, []);

  useEffect(() => { const iv = setInterval(() => { axios.get("/api/automation/logs", { headers: headers() }).then(r => setLogs(r.data)).catch(() => {}); }, 10000); return () => clearInterval(iv); }, []);

  const createRule = async () => { try { await axios.post("/api/automation/rules", form, { headers: headers() }); setShowModal(false); setStep(1); const r = await axios.get("/api/automation/rules", { headers: headers() }); setRules(r.data); } catch (e) { alert(e.message); } };
  const toggleRule = async (id, isActive) => { try { await axios.put(`/api/automation/rules/${id}`, { isActive: !isActive }, { headers: headers() }); setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r)); } catch (e) {} };
  const deleteRule = async (id) => { if (!confirm("Delete this rule?")) return; try { await axios.delete(`/api/automation/rules/${id}`, { headers: headers() }); setRules(rules.filter(r => r.id !== id)); } catch (e) {} };
  const testRule = async (id) => { try { const r = await axios.post(`/api/automation/test/${id}`, {}, { headers: headers() }); alert(`Test fired: ${r.data.message}`); const l = await axios.get("/api/automation/logs", { headers: headers() }); setLogs(l.data); } catch (e) { alert(e.message); } };
  const resultBadge = (r) => ({ success: "bg-green-100 text-green-700", failure: "bg-red-100 text-red-700", skipped: "bg-gray-200 text-gray-600" }[r] || "bg-gray-200");
  const triggerBadge = "bg-blue-100 text-blue-700";
  const actionBadge = "bg-purple-100 text-purple-700";

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="Hyper Automation Builder" />
      <main className="flex-1 p-2 overflow-auto flex flex-col gap-2">
        <div className="flex gap-2">{[{ l: "Total Rules", v: rules.length }, { l: "Active", v: rules.filter(r => r.isActive).length }, { l: "Executions", v: logs.length }, { l: "Failures", v: logs.filter(l => l.result === "failure").length }].map(c => <div key={c.l} className="flex-1 bg-white border border-gray-300 p-2 shadow-sm"><div className="text-[10px] text-gray-500 uppercase">{c.l}</div><div className="text-lg font-bold">{c.v}</div></div>)}</div>
        <div className="bg-white border border-gray-300 shadow-sm"><div className="bg-gray-200 p-2 font-bold flex justify-between"><span className="flex items-center"><Zap className="w-4 h-4 mr-2 text-yellow-500"/> Automation Rules</span><button onClick={() => { setShowModal(true); setStep(1); setForm({ name: "", trigger: "invoice_created", triggerConfig: {}, action: "notify_manager", actionConfig: {} }); }} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">+ New Rule</button></div>
          <table className="w-full text-left border-collapse"><thead className="bg-gray-100"><tr>{["Name","WHEN","THEN","Conditions","Runs","Last Run","Active","Actions"].map(h => <th key={h} className="p-1.5 border-r border-gray-300">{h}</th>)}</tr></thead>
          <tbody>{rules.map(r => <tr key={r.id} className="border-b border-gray-200 hover:bg-blue-50"><td className="p-1.5 border-r border-gray-300 font-bold">{r.name}</td><td className="p-1.5 border-r border-gray-300"><span className={`px-1 py-0.5 rounded text-[9px] font-bold ${triggerBadge}`}>{r.trigger}</span></td><td className="p-1.5 border-r border-gray-300"><span className={`px-1 py-0.5 rounded text-[9px] font-bold ${actionBadge}`}>{r.action}</span></td><td className="p-1.5 border-r border-gray-300 text-[9px]">{JSON.stringify(r.triggerConfig || {}).substring(0, 30)}</td><td className="p-1.5 border-r border-gray-300 font-bold">{r.executionCount || 0}</td><td className="p-1.5 border-r border-gray-300 text-[9px]">{r.lastExecuted ? new Date(r.lastExecuted).toLocaleString() : "Never"}</td><td className="p-1.5 border-r border-gray-300"><button onClick={() => toggleRule(r.id, r.isActive)} className={`w-8 h-4 rounded-full relative ${r.isActive ? "bg-green-500" : "bg-gray-300"}`}><span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${r.isActive ? "right-0.5" : "left-0.5"}`}></span></button></td><td className="p-1.5 flex gap-1"><button onClick={() => testRule(r.id)} title="Test" className="bg-yellow-400 p-0.5 rounded"><Play className="w-3 h-3"/></button><button onClick={() => deleteRule(r.id)} title="Delete" className="bg-red-100 p-0.5 rounded text-red-600"><Trash2 className="w-3 h-3"/></button></td></tr>)}</tbody></table>
        </div>
        <div className="bg-white border border-gray-300 shadow-sm"><div className="bg-gray-200 p-2 font-bold flex items-center justify-between"><span className="flex items-center"><RefreshCw className="w-4 h-4 mr-2"/> Execution Log</span><span className="text-[9px] text-gray-500">Auto-refreshes every 10s</span></div>
          <table className="w-full text-left border-collapse"><thead className="bg-gray-100"><tr>{["Time","Rule","Trigger","Action","Result","Error"].map(h => <th key={h} className="p-1.5 border-r border-gray-300">{h}</th>)}</tr></thead>
          <tbody>{logs.slice(0, 20).map(l => <tr key={l.id} className="border-b border-gray-200"><td className="p-1.5 border-r border-gray-300 text-[9px]">{new Date(l.executedAt).toLocaleString()}</td><td className="p-1.5 border-r border-gray-300 font-bold">{l.ruleName || "Not Entered"}</td><td className="p-1.5 border-r border-gray-300"><span className={`px-1 rounded text-[9px] ${triggerBadge}`}>{l.trigger}</span></td><td className="p-1.5 border-r border-gray-300"><span className={`px-1 rounded text-[9px] ${actionBadge}`}>{l.action}</span></td><td className="p-1.5 border-r border-gray-300"><span className={`px-1 py-0.5 rounded text-[9px] font-bold ${resultBadge(l.result)}`}>{l.result}</span></td><td className="p-1.5 text-red-500 text-[9px]">{l.error || "-"}</td></tr>)}{logs.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-400">No executions yet</td></tr>}</tbody></table>
        </div>
      </main>
      {showModal && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"><div className="bg-white border border-gray-300 shadow-lg w-[420px] p-4"><div className="flex items-center gap-2 mb-3">{[1,2,3].map(s => <div key={s} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= s ? "bg-blue-600 text-white" : "bg-gray-200"}`}>{s}</div>)}<span className="text-xs font-bold ml-2">{step === 1 ? "WHEN (Trigger)" : step === 2 ? "THEN (Action)" : "Review"}</span></div>
        {step === 1 && <div className="flex flex-col gap-2"><input placeholder="Rule Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border border-gray-300 p-1.5 rounded text-xs"/><label className="text-[10px] font-bold text-gray-500 uppercase">When this happens:</label><select value={form.trigger} onChange={e => setForm({...form, trigger: e.target.value})} className="border border-gray-300 p-1.5 rounded text-xs">{TRIGGERS.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</select><input type="number" placeholder="Min Amount (₹)" onChange={e => setForm({...form, triggerConfig: { ...form.triggerConfig, minAmount: Number(e.target.value) }})} className="border border-gray-300 p-1.5 rounded text-xs"/><button onClick={() => setStep(2)} className="bg-blue-600 text-white py-1.5 rounded text-xs font-bold">Next <ChevronRight className="w-3 h-3 inline"/></button></div>}
        {step === 2 && <div className="flex flex-col gap-2"><label className="text-[10px] font-bold text-gray-500 uppercase">Then do this:</label><select value={form.action} onChange={e => setForm({...form, action: e.target.value})} className="border border-gray-300 p-1.5 rounded text-xs">{ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}</select>{form.action === "send_whatsapp" && <textarea placeholder="Message template: Hello {name}, your invoice #{billNo} of ₹{total}..." onChange={e => setForm({...form, actionConfig: { messageTemplate: e.target.value }})} className="border border-gray-300 p-1.5 rounded text-xs h-16"/>}{form.action === "webhook" && <input placeholder="Webhook URL" onChange={e => setForm({...form, actionConfig: { url: e.target.value }})} className="border border-gray-300 p-1.5 rounded text-xs"/>}<div className="flex gap-2"><button onClick={() => setStep(1)} className="bg-gray-300 py-1.5 px-3 rounded text-xs">Back</button><button onClick={() => setStep(3)} className="flex-1 bg-blue-600 text-white py-1.5 rounded text-xs font-bold">Next <ChevronRight className="w-3 h-3 inline"/></button></div></div>}
        {step === 3 && <div className="flex flex-col gap-2"><div className="bg-gray-50 border border-gray-200 rounded p-3"><div className="text-sm font-bold mb-2">{form.name || "Untitled Rule"}</div><div><span className="text-gray-500">WHEN:</span> <span className={`px-1 rounded text-[9px] font-bold ${triggerBadge}`}>{form.trigger}</span></div><div><span className="text-gray-500">THEN:</span> <span className={`px-1 rounded text-[9px] font-bold ${actionBadge}`}>{form.action}</span></div>{Object.keys(form.triggerConfig).length > 0 && <div className="text-[9px] text-gray-500 mt-1">Conditions: {JSON.stringify(form.triggerConfig)}</div>}</div><div className="flex gap-2"><button onClick={() => setStep(2)} className="bg-gray-300 py-1.5 px-3 rounded text-xs">Back</button><button onClick={createRule} className="flex-1 bg-green-600 text-white py-1.5 rounded text-xs font-bold">Create Rule</button></div></div>}
      </div></div>}
      <BusinessFooter />
    </div>
  );
}
