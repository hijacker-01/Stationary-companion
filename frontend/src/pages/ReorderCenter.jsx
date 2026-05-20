import { useState, useEffect } from "react";
import axios from "axios";

const API   = "http://localhost:5000/api";
const token = () => localStorage.getItem("token");
const ax    = (method, url, data) =>
  axios({ method, url: `${API}${url}`, data,
          headers: { Authorization: `Bearer ${token()}` } });

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background:"#0f172a", border:`1px solid ${color}33`, borderRadius:14,
                  padding:"20px 24px", flex:1 }}>
      <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
      <div style={{ color:"#64748b", fontSize:12, marginBottom:4 }}>{label}</div>
      <div style={{ color, fontSize:26, fontWeight:700 }}>{value}</div>
    </div>
  );
}

// ── Reorder row ───────────────────────────────────────────────────────────────
function ReorderRow({ item, onApprove }) {
  const deficitPct = Math.min(100, Math.round((item.deficit / item.reorderPoint) * 100));
  const urgency    = item.stock_qty === 0 ? "OUT" : deficitPct > 75 ? "CRITICAL" : "LOW";
  const urgColor   = urgency === "OUT" ? "#ef4444" : urgency === "CRITICAL" ? "#f97316" : "#eab308";

  return (
    <tr style={{ borderBottom:"1px solid #1e293b" }}>
      <td style={{ padding:"14px 16px" }}>
        <div style={{ color:"#e2e8f0", fontWeight:600, fontSize:14 }}>{item.name}</div>
        <div style={{ color:"#64748b", fontSize:12 }}>{item.category}</div>
      </td>
      <td style={{ padding:"14px 16px", textAlign:"center" }}>
        <span style={{ color: item.stock_qty === 0 ? "#ef4444" : "#f97316",
                       fontWeight:700, fontSize:15 }}>
          {item.stock_qty}
        </span>
        <span style={{ color:"#475569", fontSize:12 }}> {item.unit}</span>
      </td>
      <td style={{ padding:"14px 16px", textAlign:"center", color:"#64748b" }}>
        {item.reorderPoint}
      </td>
      <td style={{ padding:"14px 16px", textAlign:"center" }}>
        <div style={{ background:"#1e293b", borderRadius:99, height:8, width:80, overflow:"hidden" }}>
          <div style={{ background: urgColor, height:"100%", width:`${deficitPct}%`, borderRadius:99 }} />
        </div>
        <div style={{ color: urgColor, fontSize:11, marginTop:3 }}>−{item.deficit}</div>
      </td>
      <td style={{ padding:"14px 16px", textAlign:"center" }}>
        <span style={{ background: urgColor+"22", color: urgColor, border:`1px solid ${urgColor}55`,
                       borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:600 }}>
          {urgency}
        </span>
      </td>
      <td style={{ padding:"14px 16px", textAlign:"center" }}>
        <button onClick={() => onApprove(item)}
          style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff",
                   border:"none", borderRadius:8, padding:"7px 18px",
                   cursor:"pointer", fontSize:13, fontWeight:600 }}>
          Run AI Agent
        </button>
      </td>
    </tr>
  );
}

// ── Draft PO card ─────────────────────────────────────────────────────────────
function DraftPOCard({ po }) {
  const items = Array.isArray(po.items) ? po.items : [];
  return (
    <div style={{ background:"#0f172a", border:"1px solid #6366f133", borderRadius:12,
                  padding:"16px 20px", marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ color:"#818cf8", fontWeight:700, fontSize:14 }}>{po.poNumber}</div>
          <div style={{ color:"#64748b", fontSize:12, marginTop:2 }}>{po.supplierName}</div>
        </div>
        <div style={{ color:"#475569", fontSize:11 }}>{po.createdAt?.split("T")[0]}</div>
      </div>
      <div style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:6 }}>
        {items.map((it, i) => (
          <span key={i} style={{ background:"#1e293b", borderRadius:6, padding:"3px 10px",
                                  color:"#94a3b8", fontSize:12 }}>
            {it.name} × {it.qty}
          </span>
        ))}
      </div>
      {po.notes && (
        <div style={{ marginTop:8, color:"#64748b", fontSize:11, fontStyle:"italic" }}>
          {po.notes}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function ReorderCenter() {
  const [suggestions,  setSuggestions]  = useState([]);
  const [draftPOs,     setDraftPOs]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentLog,     setAgentLog]     = useState([]);
  const [activeTab,    setActiveTab]    = useState("alerts");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [sug, dpo] = await Promise.all([
        ax("get", "/ai/reorder/suggestions"),
        ax("get", "/ai/reorder/draft-orders"),
      ]);
      setSuggestions(sug.data);
      setDraftPOs(dpo.data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }

  async function runFullAgent() {
    setAgentRunning(true);
    setAgentLog(["🤖 Starting AI Reorder Agent sweep…"]);
    try {
      const { data } = await ax("post", "/ai/reorder/run-agent");
      const logs = (data.results || []).map(r => `✅ ${r.item}: ${r.agent_output}`);
      setAgentLog(logs.length ? logs : ["✅ " + (data.message || "Done")]);
      await fetchAll();
    } catch (e) {
      setAgentLog(["❌ Agent failed: " + (e.response?.data?.detail || e.message)]);
    } finally { setAgentRunning(false); }
  }

  async function runSingleAgent(item) {
    setActiveTab("log");
    setAgentRunning(true);
    setAgentLog([`🤖 Running agent for "${item.name}"…`]);
    try {
      const { data } = await ax("post", "/ai/reorder/run-agent");
      const r = (data.results || []).find(r => r.item === item.name);
      setAgentLog(r ? [`✅ ${r.item}: ${r.agent_output}`] : ["✅ Done"]);
      await fetchAll();
    } catch (e) {
      setAgentLog(["❌ " + (e.response?.data?.detail || e.message)]);
    } finally { setAgentRunning(false); }
  }

  const outOfStock   = suggestions.filter(s => s.stock_qty === 0).length;
  const criticalLow  = suggestions.filter(s => s.stock_qty > 0).length;

  return (
    <div style={{ minHeight:"100vh", background:"#020617", color:"#e2e8f0",
                  fontFamily:"'Inter',sans-serif", padding:"24px 32px" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:700,
                       background:"linear-gradient(135deg,#f97316,#eab308)",
                       WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            🔄 AI Reorder Center
          </h1>
          <p style={{ margin:"4px 0 0", color:"#64748b", fontSize:14 }}>
            LangChain ReAct agent monitors stock · drafts POs · learns from 90-day velocity
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={fetchAll} disabled={loading}
            style={{ background:"#1e293b", border:"1px solid #334155", color:"#94a3b8",
                     borderRadius:8, padding:"9px 18px", cursor:"pointer", fontSize:13 }}>
            ↻ Refresh
          </button>
          <button onClick={runFullAgent} disabled={agentRunning}
            style={{ background:"linear-gradient(135deg,#f97316,#ea580c)", color:"#fff",
                     border:"none", borderRadius:10, padding:"9px 22px",
                     cursor:"pointer", fontSize:14, fontWeight:700,
                     opacity: agentRunning ? 0.6 : 1 }}>
            {agentRunning ? "🤖 Agent Running…" : "🤖 Run Full AI Sweep"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:16, marginBottom:28 }}>
        <StatCard icon="🚨" label="Out of Stock"  value={outOfStock}           color="#ef4444" />
        <StatCard icon="⚠️" label="Low Stock"     value={criticalLow}          color="#f97316" />
        <StatCard icon="📋" label="Draft POs (AI)" value={draftPOs.length}     color="#6366f1" />
        <StatCard icon="📦" label="Total Alerts"  value={suggestions.length}   color="#22d3ee" />
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:0, marginBottom:0, borderBottom:"1px solid #1e293b" }}>
        {[["alerts","⚠️ Stock Alerts"],["drafts","📋 AI Draft POs"],["log","🤖 Agent Log"]].map(([id,label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ background: activeTab===id ? "#0f172a" : "transparent",
                     border:"none", borderBottom: activeTab===id ? "2px solid #6366f1" : "2px solid transparent",
                     color: activeTab===id ? "#818cf8" : "#475569",
                     padding:"12px 24px", cursor:"pointer", fontSize:14, fontWeight:600 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Alerts */}
      {activeTab === "alerts" && (
        <div style={{ background:"#0f172a", borderRadius:"0 0 12px 12px", border:"1px solid #1e293b",
                      borderTop:"none", overflow:"hidden" }}>
          {loading ? (
            <div style={{ padding:40, textAlign:"center", color:"#475569" }}>Loading stock data…</div>
          ) : suggestions.length === 0 ? (
            <div style={{ padding:60, textAlign:"center" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
              <div style={{ color:"#22c55e", fontSize:16, fontWeight:600 }}>All items are well stocked!</div>
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#1e293b" }}>
                  {["Item","Stock","Reorder Point","Deficit","Status","Action"].map(h => (
                    <th key={h} style={{ padding:"12px 16px", color:"#64748b",
                                         fontWeight:600, textAlign: h==="Item"?"left":"center", fontSize:12 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suggestions.map(item => (
                  <ReorderRow key={item.id} item={item} onApprove={runSingleAgent} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Draft POs */}
      {activeTab === "drafts" && (
        <div style={{ background:"#0f172a", borderRadius:"0 0 12px 12px",
                      border:"1px solid #1e293b", borderTop:"none", padding:20 }}>
          {draftPOs.length === 0 ? (
            <div style={{ padding:40, textAlign:"center", color:"#475569" }}>
              No AI draft POs yet. Run the agent to generate some.
            </div>
          ) : draftPOs.map(po => <DraftPOCard key={po.id} po={po} />)}
        </div>
      )}

      {/* Tab: Agent Log */}
      {activeTab === "log" && (
        <div style={{ background:"#0f172a", borderRadius:"0 0 12px 12px",
                      border:"1px solid #1e293b", borderTop:"none", padding:20 }}>
          {agentLog.length === 0 ? (
            <div style={{ color:"#475569", textAlign:"center", padding:40 }}>
              Run the agent to see reasoning logs here.
            </div>
          ) : (
            <div style={{ fontFamily:"'Courier New',monospace", fontSize:13 }}>
              {agentLog.map((line, i) => (
                <div key={i} style={{ padding:"8px 12px", borderBottom:"1px solid #1e293b",
                                      color: line.startsWith("✅")?"#22c55e":line.startsWith("❌")?"#ef4444":"#94a3b8" }}>
                  {line}
                </div>
              ))}
              {agentRunning && (
                <div style={{ padding:"8px 12px", color:"#6366f1", animation:"pulse 1s infinite" }}>
                  ⏳ Agent is reasoning…
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
