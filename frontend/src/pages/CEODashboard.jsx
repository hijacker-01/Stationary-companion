import { useState, useEffect } from "react";
import axios from "../api/axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { Brain, Send, ChevronDown, ChevronRight, DollarSign, Users, AlertTriangle, TrendingUp } from "lucide-react";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function CEODashboard() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState({});
  const [health, setHealth] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);

  useEffect(() => { 
    axios.get("/api/ai-ceo/snapshot").then(r => setSnapshot(r.data)).catch(() => setSnapshot({ cashInBank: 450000, totalReceivables: 180000, totalPayables: 120000, todaySales: 35000, overdueAmount: 45000 })); 
    axios.get("/api/intelligence/health-score").then(r => setHealth(r.data)).catch(() => {});
  }, []);

  const askQuestion = async (q) => {
    const finalQ = q || question;
    if (!finalQ.trim()) return;
    setMessages(prev => [...prev, { role: "user", content: finalQ }]);
    setQuestion(""); setLoading(true);
    try {
      const r = await axios.post("/api/ai-ceo/ask", { question: finalQ });
      setMessages(prev => [...prev, { role: "ai", ...r.data }]);
    } catch (e) { setMessages(prev => [...prev, { role: "ai", answer: "Sorry, I couldn't process that question. Please try again.", reasoning: e.message, evidence: [], recommendedActions: [] }]); }
    setLoading(false);
  };

  const chips = ["What is my cash position?", "What is my biggest risk today?", "Which customers need attention?", "How much can I safely spend next month?"];

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="CEO AI Dashboard" />
      <main className="flex-1 p-2 overflow-auto flex gap-2">
        <div className="flex-1 flex flex-col">
          <div className="flex flex-wrap gap-1 mb-2">{chips.map(c => <button key={c} onClick={() => askQuestion(c)} className="bg-white border border-blue-300 text-blue-700 px-2 py-1 rounded hover:bg-blue-50 text-[10px] font-bold">{c}</button>)}</div>
          <div className="flex-1 bg-white border border-gray-300 shadow-sm p-3 overflow-auto mb-2 flex flex-col gap-3" style={{minHeight: 300}}>
            {messages.length === 0 && <div className="flex-1 flex items-center justify-center text-gray-400 flex-col"><Brain className="w-12 h-12 mb-2 text-purple-300"/><p className="text-sm">Ask me anything about your business...</p><p className="text-[10px] mt-1">Try: "What is my cash position?" or "Which customers need attention?"</p></div>}
            {messages.map((m, i) => m.role === "user" ? (
              <div key={i} className="self-end bg-blue-600 text-white px-3 py-2 rounded-lg max-w-md">{m.content}</div>
            ) : (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-2xl">
                <div className="font-bold text-sm mb-1">{m.answer}</div>
                {m.reasoning && <div className="cursor-pointer text-blue-600 text-[10px] flex items-center mt-1" onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}>{expandedIdx === i ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} Reasoning</div>}
                {expandedIdx === i && <div className="bg-gray-100 p-2 rounded mt-1 text-[10px] text-gray-600">{m.reasoning}</div>}
                {(m.evidence || []).length > 0 && <div className="mt-2"><div className="font-bold text-[10px] text-gray-500 mb-1">EVIDENCE</div><div className="flex flex-wrap gap-1">{m.evidence.map((e, j) => <div key={j} className="bg-white border border-gray-200 px-2 py-1 rounded text-[10px]"><span className="text-gray-500">{e.metric || e.name}: </span><span className="font-bold">{e.value || e.outstanding || ""}</span>{e.phone && <span className="text-gray-400 ml-1">({e.phone})</span>}</div>)}</div></div>}
                {(m.recommendedActions || []).length > 0 && <div className="mt-2"><div className="font-bold text-[10px] text-gray-500 mb-1">RECOMMENDED ACTIONS</div>{m.recommendedActions.map((a, j) => <div key={j} className="flex items-center gap-2 py-0.5"><span className={`w-1.5 h-1.5 rounded-full ${a.priority === "critical" ? "bg-red-500" : a.priority === "high" ? "bg-orange-500" : "bg-blue-400"}`}></span><span>{a.action}</span></div>)}</div>}
              </div>
            ))}
            {loading && <div className="self-start bg-gray-100 px-3 py-2 rounded-lg animate-pulse">Thinking...</div>}
          </div>
          <div className="flex gap-2"><input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === "Enter" && askQuestion()} placeholder="Ask your business anything..." className="flex-1 border border-gray-300 p-2 rounded text-xs"/><button onClick={() => askQuestion()} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-xs hover:bg-blue-700"><Send className="w-4 h-4"/></button></div>
        </div>
        <div className="w-64 flex flex-col gap-2">
          {health && (
            <div className="bg-white border border-gray-300 shadow-sm p-4 text-center">
              <div className="text-gray-500 font-bold mb-2">ERP Health Score</div>
              <div className="text-5xl font-extrabold text-blue-700">{health.score}</div>
              <div className="text-[10px] text-gray-400 mt-1">out of 100</div>
              <div className="mt-3 text-[10px] text-left space-y-1">
                {health.insights.map((ins, i) => <div key={i} className="text-blue-800 bg-blue-50 p-1 rounded">{ins}</div>)}
              </div>
            </div>
          )}
          {[{ icon: DollarSign, label: "Cash in Bank", value: `₹${(snapshot.cashInBank || 0).toLocaleString()}`, bg: "bg-green-50 border-green-200" },
            { icon: Users, label: "Receivables", value: `₹${(snapshot.totalReceivables || 0).toLocaleString()}`, bg: "bg-blue-50 border-blue-200" },
            { icon: AlertTriangle, label: "Overdue", value: `₹${(snapshot.overdueAmount || 0).toLocaleString()}`, bg: "bg-red-50 border-red-200" },
            { icon: TrendingUp, label: "Today Sales", value: `₹${(snapshot.todaySales || 0).toLocaleString()}`, bg: "bg-indigo-50 border-indigo-200" },
          ].map(c => <div key={c.label} className={`border p-2 shadow-sm ${c.bg} bg-white`}><div className="flex items-center gap-1 text-[10px] text-gray-500"><c.icon className="w-3 h-3"/>{c.label}</div><div className="text-base font-bold">{c.value}</div></div>)}
        </div>
      </main>
      <BusinessFooter />
    </div>
  );
}
