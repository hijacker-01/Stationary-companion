import { useState, useEffect } from "react";
import axios from "../api/axios";

const API   = "";
const token = () => localStorage.getItem("token");
const ax    = (method, url, data) =>
  axios({ method, url: `${API}${url}`, data,
          headers: { Authorization: `Bearer ${token()}` } });

const TIER_CONFIG = {
  CRITICAL: { color:"#ef4444", bg:"#ef444411", label:"🚨 Critical",  border:"#ef444433" },
  HIGH:     { color:"#f97316", bg:"#f9731611", label:"🔴 High Risk", border:"#f9731633" },
  MEDIUM:   { color:"#eab308", bg:"#eab30811", label:"🟡 Medium",    border:"#eab30833" },
  LOW:      { color:"#3b82f6", bg:"#3b82f611", label:"🔵 Low",       border:"#3b82f633" },
  WATCH:    { color:"#8b5cf6", bg:"#8b5cf611", label:"👁 Watch",     border:"#8b5cf633" },
  SAFE:     { color:"#22c55e", bg:"#22c55e11", label:"✅ Safe",      border:"#22c55e33" },
};

// ── Risk badge ────────────────────────────────────────────────────────────────
function RiskBadge({ label }) {
  const t = TIER_CONFIG[label] || TIER_CONFIG.SAFE;
  return (
    <span style={{ background:t.bg, color:t.color, border:`1px solid ${t.border}`,
                   borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:600 }}>
      {t.label}
    </span>
  );
}

// ── Action badge ──────────────────────────────────────────────────────────────
function ActionBadge({ action }) {
  const colors = {
    DISCOUNT:           "#22c55e",
    RETURN_TO_SUPPLIER: "#3b82f6",
    TRANSFER:           "#8b5cf6",
    URGENT_SELL:        "#f97316",
    DISPOSE:            "#ef4444",
  };
  return (
    <span style={{ background:(colors[action]||"#64748b")+"22",
                   color: colors[action]||"#94a3b8",
                   border:`1px solid ${(colors[action]||"#64748b")}55`,
                   borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:700 }}>
      {action?.replace(/_/g," ")}
    </span>
  );
}

// ── Item card ─────────────────────────────────────────────────────────────────
function ExpiryCard({ item, onSuggest }) {
  const [suggestion, setSuggestion] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const t = TIER_CONFIG[item.risk_label] || TIER_CONFIG.SAFE;

  async function getSuggestion() {
    if (suggestion) { setSuggestion(null); return; }
    setLoading(true);
    try {
      const { data } = await onSuggest(item.id);
      setSuggestion(data);
    } catch (e) {
      setSuggestion({ error: e.response?.data?.detail || "Failed" });
    } finally { setLoading(false); }
  }

  const daysColor = item.days_left <= 7 ? "#ef4444" : item.days_left <= 15 ? "#f97316" : "#eab308";

  return (
    <div style={{ background:"#0f172a", border:`1px solid ${t.border}`, borderRadius:14,
                  padding:"18px 20px", transition:"all .2s" }}>
      {/* Top row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:15, marginBottom:2 }}>{item.name}</div>
          <div style={{ color:"#64748b", fontSize:12 }}>
            {item.category} · Batch: {item.batch || "—"} · {item.stock_qty} {item.unit}
          </div>
        </div>
        <RiskBadge label={item.risk_label} />
      </div>

      {/* Expiry countdown bar */}
      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ color:"#64748b", fontSize:12 }}>Expires: {item.expiry}</span>
          <span style={{ color: daysColor, fontWeight:700, fontSize:13 }}>
            {item.days_left <= 0 ? "EXPIRED" : `${item.days_left} days left`}
          </span>
        </div>
        <div style={{ background:"#1e293b", borderRadius:99, height:6 }}>
          <div style={{
            background: `linear-gradient(90deg, ${daysColor}, ${daysColor}88)`,
            height:"100%", borderRadius:99,
            width: `${Math.max(2, Math.min(100, (item.days_left/90)*100))}%`,
            transition:"width .5s",
          }} />
        </div>
      </div>

      {/* Price info */}
      <div style={{ display:"flex", gap:16, marginBottom:14 }}>
        <div style={{ color:"#64748b", fontSize:12 }}>MRP: <span style={{ color:"#e2e8f0" }}>₹{item.mrp}</span></div>
        <div style={{ color:"#64748b", fontSize:12 }}>Cost: <span style={{ color:"#e2e8f0" }}>₹{item.cost_price}</span></div>
        {item.suggested_discount > 0 && (
          <div style={{ color:"#22c55e", fontSize:12, fontWeight:600 }}>
            Suggested Discount: {item.suggested_discount}%
          </div>
        )}
      </div>

      {/* AI Suggest button */}
      <button onClick={getSuggestion} disabled={loading}
        style={{ width:"100%", background: suggestion ? "#1e293b" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                 color: suggestion ? "#94a3b8" : "#fff", border:"none", borderRadius:8,
                 padding:"9px", cursor:"pointer", fontSize:13, fontWeight:600,
                 opacity: loading ? 0.6 : 1 }}>
        {loading ? "🤖 AI Thinking…" : suggestion ? "▲ Hide AI Suggestion" : "🤖 Get AI Suggestion"}
      </button>

      {/* AI suggestion panel */}
      {suggestion && !suggestion.error && (
        <div style={{ marginTop:12, background:"#020617", border:"1px solid #1e293b",
                      borderRadius:10, padding:"14px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <ActionBadge action={suggestion.action} />
            <span style={{ color:"#64748b", fontSize:12 }}>Urgency: {suggestion.urgency}</span>
          </div>
          {suggestion.discount_percent > 0 && (
            <div style={{ color:"#22c55e", fontSize:13, fontWeight:600, marginBottom:6 }}>
              Apply {suggestion.discount_percent}% discount → Sell at ₹{(item.mrp * (1-suggestion.discount_percent/100)).toFixed(2)}
            </div>
          )}
          <div style={{ color:"#94a3b8", fontSize:13, marginBottom:6 }}>
            💡 {suggestion.reason}
          </div>
          <div style={{ color:"#64748b", fontSize:12, fontStyle:"italic" }}>
            📦 FIFO: {suggestion.fifo_note}
          </div>
        </div>
      )}
      {suggestion?.error && (
        <div style={{ marginTop:10, color:"#ef4444", fontSize:12 }}>❌ {suggestion.error}</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function ExpiryGuard() {
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [sweeping,   setSweeping]   = useState(false);
  const [sweepLog,   setSweepLog]   = useState(null);
  const [filter,     setFilter]     = useState("ALL");
  const [search,     setSearch]     = useState("");

  useEffect(() => { fetchRisks(); }, []);

  async function fetchRisks() {
    setLoading(true);
    try {
      const { data } = await ax("get", "/ai/expiry/risks");
      setItems(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function getSuggestion(itemId) {
    return await ax("post", `/ai/expiry/suggest/${itemId}`);
  }

  async function runSweep() {
    setSweeping(true); setSweepLog(null);
    try {
      const { data } = await ax("post", "/ai/expiry/run-agent");
      setSweepLog(data);
    } catch (e) {
      setSweepLog({ error: e.response?.data?.detail || "Sweep failed" });
    } finally { setSweeping(false); }
  }

  const tiers = ["ALL","CRITICAL","HIGH","MEDIUM","LOW","WATCH"];
  const displayed = items.filter(it =>
    (filter === "ALL" || it.risk_label === filter) &&
    it.name.toLowerCase().includes(search.toLowerCase())
  );

  // Summary counts
  const counts = { CRITICAL:0, HIGH:0, MEDIUM:0, LOW:0, WATCH:0 };
  items.forEach(it => { if (counts[it.risk_label] !== undefined) counts[it.risk_label]++; });

  return (
    <div style={{ minHeight:"100vh", background:"#020617", color:"#e2e8f0",
                  fontFamily:"'Inter',sans-serif", padding:"24px 32px" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:700,
                       background:"linear-gradient(135deg,#ef4444,#f97316)",
                       WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            🛡️ Expiry Guard
          </h1>
          <p style={{ margin:"4px 0 0", color:"#64748b", fontSize:14 }}>
            AI monitors expiry dates · suggests discount / return / dispose actions · FIFO enforcement
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={fetchRisks} disabled={loading}
            style={{ background:"#1e293b", border:"1px solid #334155", color:"#94a3b8",
                     borderRadius:8, padding:"9px 18px", cursor:"pointer", fontSize:13 }}>
            ↻ Refresh
          </button>
          <button onClick={runSweep} disabled={sweeping}
            style={{ background:"linear-gradient(135deg,#ef4444,#dc2626)", color:"#fff",
                     border:"none", borderRadius:10, padding:"9px 22px",
                     cursor:"pointer", fontSize:14, fontWeight:700,
                     opacity: sweeping ? 0.6 : 1 }}>
            {sweeping ? "🤖 AI Sweeping…" : "🤖 Run Full AI Sweep"}
          </button>
        </div>
      </div>

      {/* Tier summary row */}
      <div style={{ display:"flex", gap:12, marginBottom:24 }}>
        {Object.entries(counts).map(([tier, count]) => {
          const t = TIER_CONFIG[tier];
          return (
            <div key={tier} onClick={() => setFilter(filter===tier?"ALL":tier)}
              style={{ flex:1, background: filter===tier ? t.bg : "#0f172a",
                       border:`1px solid ${filter===tier?t.color:t.border}`,
                       borderRadius:12, padding:"14px 16px", cursor:"pointer", transition:"all .2s" }}>
              <div style={{ color: t.color, fontWeight:700, fontSize:20 }}>{count}</div>
              <div style={{ color:"#64748b", fontSize:11, marginTop:2 }}>{t.label}</div>
            </div>
          );
        })}
      </div>

      {/* Search + filter bar */}
      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        <input placeholder="Search items…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ flex:1, background:"#0f172a", border:"1px solid #334155", color:"#e2e8f0",
                   borderRadius:8, padding:"10px 16px", fontSize:14, outline:"none" }} />
        <div style={{ display:"flex", gap:6 }}>
          {tiers.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              style={{ background: filter===t ? "#6366f1" : "#0f172a",
                       border:`1px solid ${filter===t?"#6366f1":"#334155"}`,
                       color: filter===t ? "#fff" : "#64748b",
                       borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:12, fontWeight:600 }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Sweep results */}
      {sweepLog && (
        <div style={{ background:"#0f172a", border:"1px solid #f9731633", borderRadius:12,
                      padding:20, marginBottom:24 }}>
          <div style={{ color:"#f97316", fontWeight:700, marginBottom:12 }}>🤖 AI Sweep Results</div>
          {sweepLog.error ? (
            <div style={{ color:"#ef4444" }}>❌ {sweepLog.error}</div>
          ) : (
            <>
              <div style={{ color:"#64748b", fontSize:13, marginBottom:12 }}>
                Processed {sweepLog.processed} items
              </div>
              {(sweepLog.actions||[]).map((a, i) => (
                <div key={i} style={{ borderBottom:"1px solid #1e293b", padding:"10px 0",
                                      display:"flex", gap:12, alignItems:"flex-start" }}>
                  <span style={{ color:"#e2e8f0", fontWeight:600, fontSize:13 }}>{a.item_name}</span>
                  <ActionBadge action={a.action} />
                  <span style={{ color:"#64748b", fontSize:12 }}>{a.reason}</span>
                  <span style={{ color:"#ef4444", fontSize:12, marginLeft:"auto" }}>{a.days_left}d left</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Item cards grid */}
      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:"#475569" }}>Loading expiry data…</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign:"center", padding:60 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
          <div style={{ color:"#22c55e", fontSize:16, fontWeight:600 }}>No items match this filter!</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:16 }}>
          {displayed.map(item => (
            <ExpiryCard key={item.id} item={item} onSuggest={getSuggestion} />
          ))}
        </div>
      )}
    </div>
  );
}
