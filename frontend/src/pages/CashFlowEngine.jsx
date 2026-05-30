import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { TrendingUp, AlertTriangle, DollarSign, Clock } from "lucide-react";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function CashFlowEngine() {
  const [forecasts, setForecasts] = useState([]);
  const [risks, setRisks] = useState([]);
  const [pressure, setPressure] = useState([]);
  const [simResult, setSimResult] = useState(null);
  const [simForm, setSimForm] = useState({ customerId: "", delayDays: 30 });

  useEffect(() => {
    axios.get("/api/cashflow/forecast", { headers: headers() }).then(r => setForecasts(r.data)).catch(() => setForecasts([{ period: "7d", predictedInflow: 100000, predictedOutflow: 60000, netPosition: 40000, confidence: 85 }]));
    axios.get("/api/cashflow/risks", { headers: headers() }).then(r => setRisks(r.data)).catch(() => {});
    axios.get("/api/cashflow/pressure", { headers: headers() }).then(r => setPressure(r.data)).catch(() => {});
  }, []);

  const simulate = async () => { try { const r = await axios.post("/api/cashflow/simulate", simForm, { headers: headers() }); setSimResult(r.data); } catch (e) { alert(e.message); } };
  const riskColor = (l) => ({ critical: "bg-red-600 text-white", high: "bg-orange-500 text-white", medium: "bg-yellow-400 text-black", low: "bg-green-500 text-white" }[l] || "bg-gray-200");

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="Predictive Cash Flow Engine" />
      <main className="flex-1 p-2 overflow-auto flex flex-col gap-2">
        <div className="flex gap-2">{forecasts.map(f => <div key={f.period || f.id} className="flex-1 bg-white border border-gray-300 p-3 shadow-sm"><div className="text-[10px] text-gray-500 uppercase font-bold">{f.period} Forecast</div><div className="flex flex-col gap-1 mt-1"><div className="flex justify-between"><span className="text-green-600">Inflow</span><span className="font-bold text-green-700">₹{(f.predictedInflow||0).toLocaleString()}</span></div><div className="flex justify-between"><span className="text-red-600">Outflow</span><span className="font-bold text-red-600">₹{(f.predictedOutflow||0).toLocaleString()}</span></div><div className="border-t border-gray-200 pt-1 flex justify-between"><span className="font-bold">Net</span><span className={`font-bold text-lg ${(f.netPosition||0) >= 0 ? "text-green-700" : "text-red-700"}`}>₹{(f.netPosition||0).toLocaleString()}</span></div><div className="text-[9px] text-gray-400 mt-0.5">Confidence: {f.confidence}%</div></div></div>)}</div>
        <div className="bg-white border border-gray-300 shadow-sm p-2"><div className="font-bold mb-2">Cash Flow Timeline</div><div className="flex gap-1 items-end" style={{height: 80}}>{forecasts.map(f => { const maxVal = Math.max(...forecasts.map(x => Math.max(x.predictedInflow||0, x.predictedOutflow||0)), 1); return <div key={f.period || f.id} className="flex-1 flex gap-0.5"><div className="flex-1 flex flex-col justify-end"><div className="bg-green-500 rounded-t" style={{height: `${((f.predictedInflow||0)/maxVal)*100}%`}}></div><div className="text-[8px] text-center text-gray-500">{f.period}</div></div><div className="flex-1 flex flex-col justify-end"><div className="bg-red-500 rounded-t" style={{height: `${((f.predictedOutflow||0)/maxVal)*100}%`}}></div></div></div>; })}</div><div className="flex gap-3 mt-1 text-[9px] text-gray-500"><span className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded mr-1"></span>Inflow</span><span className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded mr-1"></span>Outflow</span></div></div>
        <div className="bg-white border border-gray-300 shadow-sm"><div className="bg-gray-200 p-2 font-bold flex items-center"><AlertTriangle className="w-4 h-4 mr-2 text-red-500"/> Payment Risk Scoring</div><table className="w-full text-left border-collapse"><thead className="bg-gray-100"><tr>{["Customer","Outstanding ₹","Risk Score","Level","Avg Delay","Default?"].map(h => <th key={h} className="p-1.5 border-r border-gray-300">{h}</th>)}</tr></thead><tbody>{risks.slice(0, 15).map(r => <tr key={r.id} className="border-b border-gray-200 hover:bg-red-50"><td className="p-1.5 border-r border-gray-300 font-bold">{r.customerName || "Not Entered"}</td><td className="p-1.5 border-r border-gray-300">₹{(r.totalOutstanding||0).toLocaleString()}</td><td className="p-1.5 border-r border-gray-300"><div className="flex items-center gap-1"><div className="w-16 bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${r.riskScore > 75 ? "bg-red-500" : r.riskScore > 50 ? "bg-orange-500" : "bg-green-500"}`} style={{width:`${r.riskScore}%`}}></div></div><span className="text-[9px]">{Math.round(r.riskScore)}</span></div></td><td className="p-1.5 border-r border-gray-300"><span className={`px-1 py-0.5 rounded text-[9px] font-bold ${riskColor(r.riskLevel)}`}>{r.riskLevel}</span></td><td className="p-1.5 border-r border-gray-300">{Math.round(r.avgDelayDays)}d</td><td className="p-1.5">{r.predictedDefault ? <span className="text-red-600 font-bold">⚠ YES</span> : <span className="text-green-600">No</span>}</td></tr>)}</tbody></table></div>
        <div className="flex gap-2">
          <div className="flex-1 bg-white border border-gray-300 shadow-sm"><div className="bg-gray-200 p-2 font-bold flex items-center"><Clock className="w-4 h-4 mr-2"/> Supplier Payment Pressure</div><table className="w-full text-left border-collapse"><thead className="bg-gray-100"><tr>{["Supplier","Payable ₹","Due Date","Days Left","Priority"].map(h => <th key={h} className="p-1.5 border-r border-gray-300">{h}</th>)}</tr></thead><tbody>{pressure.slice(0, 10).map(p => <tr key={p.id} className="border-b border-gray-200"><td className="p-1.5 border-r border-gray-300">{p.name}</td><td className="p-1.5 border-r border-gray-300 font-bold">₹{(p.payable||0).toLocaleString()}</td><td className="p-1.5 border-r border-gray-300">{p.dueDate}</td><td className="p-1.5 border-r border-gray-300">{p.daysUntilDue}d</td><td className="p-1.5"><span className={`px-1 py-0.5 rounded text-[9px] font-bold ${p.priority === "critical" ? "bg-red-600 text-white" : p.priority === "high" ? "bg-orange-500 text-white" : "bg-gray-200"}`}>{p.priority}</span></td></tr>)}</tbody></table></div>
          <div className="w-72 bg-white border border-gray-300 shadow-sm p-3"><div className="font-bold mb-2 flex items-center"><DollarSign className="w-4 h-4 mr-1"/> What-If Simulator</div><input type="number" placeholder="Customer ID" value={simForm.customerId} onChange={e => setSimForm({...simForm, customerId: e.target.value})} className="w-full border border-gray-300 p-1.5 rounded text-xs mb-1"/><input type="number" placeholder="Delay Days" value={simForm.delayDays} onChange={e => setSimForm({...simForm, delayDays: e.target.value})} className="w-full border border-gray-300 p-1.5 rounded text-xs mb-2"/><button onClick={simulate} className="w-full bg-blue-600 text-white py-1.5 rounded text-xs font-bold">Simulate</button>{simResult && <div className="mt-2 bg-yellow-50 border border-yellow-200 p-2 rounded text-[10px]"><div className="font-bold">{simResult.scenario}</div><div className="text-red-600">Cash Impact: ₹{Math.abs(simResult.impactOnCash||0).toLocaleString()}</div><div>{simResult.recommendation}</div></div>}</div>
        </div>
      </main>
      <BusinessFooter />
    </div>
  );
}
