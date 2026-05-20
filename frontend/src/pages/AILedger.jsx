import { useState, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const token = () => localStorage.getItem("token");
const ax    = (method, url, data, cfg = {}) =>
  axios({ method, url: `${API}${url}`, data, ...cfg,
          headers: { Authorization: `Bearer ${token()}`, ...cfg.headers } });

// ── Status badge ──────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  return (
    <span style={{ background: color + "22", color, border: `1px solid ${color}55`,
                   borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
      {label}
    </span>
  );
}

// ── Editable item row ─────────────────────────────────────────────────────────
function ItemRow({ item, idx, onChange, onRemove }) {
  const fields = ["name","batch","hsn","pack","qty","schemeQty","expiry","mrp","costPrice","taxPercent"];
  return (
    <tr style={{ background: idx % 2 === 0 ? "#0f172a" : "#1e293b" }}>
      {fields.map(f => (
        <td key={f} style={{ padding: "6px 4px" }}>
          <input
            value={item[f] ?? ""}
            onChange={e => onChange(idx, f, e.target.value)}
            style={{ width: f === "name" ? 180 : f === "expiry" ? 110 : 70,
                     background: "transparent", border: "1px solid #334155",
                     color: "#e2e8f0", borderRadius: 4, padding: "3px 6px", fontSize: 12 }}
          />
        </td>
      ))}
      <td style={{ padding: "6px 4px", textAlign: "center" }}>
        {item.rag_matched && <Badge label={`RAG ✓ ${Math.round((item.rag_score||0)*100)}%`} color="#22c55e" />}
      </td>
      <td style={{ padding: "6px 4px", textAlign: "center" }}>
        <button onClick={() => onRemove(idx)}
          style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444455",
                   borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
      </td>
    </tr>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AILedger() {
  const [step,         setStep]         = useState("upload");   // upload | review | saved
  const [dragging,     setDragging]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [extracted,    setExtracted]    = useState(null);
  const [items,        setItems]        = useState([]);
  const [ocrDebug,     setOcrDebug]     = useState("");
  const [savedPO,      setSavedPO]      = useState(null);

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFile = (e) => { if (e.target.files[0]) processFile(e.target.files[0]); };

  // ── Call AI service ──────────────────────────────────────────────────────────
  async function processFile(file) {
    setLoading(true); setError(""); setStep("upload");
    try {
      const fd = new FormData();
      fd.append("invoice", file);
      const { data } = await ax("post", "/ai/invoice/parse", fd,
        { headers: { "Content-Type": "multipart/form-data" } });
      setExtracted(data);
      setItems(data.items || []);
      setOcrDebug(data.ocr_text || "");
      setStep("review");
    } catch (e) {
      setError(e.response?.data?.detail || e.response?.data?.error || "AI service error");
    } finally { setLoading(false); }
  }

  // ── Edit item ────────────────────────────────────────────────────────────────
  function updateItem(idx, field, val) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  }
  function removeItem(idx) { setItems(prev => prev.filter((_, i) => i !== idx)); }
  function addRow() {
    setItems(prev => [...prev, { name:"", batch:"", hsn:"", pack:"", qty:1,
                                  schemeQty:0, expiry:"", mrp:0, costPrice:0, taxPercent:0 }]);
  }

  // ── Save to ERP ──────────────────────────────────────────────────────────────
  async function saveBill() {
    setLoading(true); setError("");
    try {
      const sub = items.reduce((a, i) => a + Number(i.qty||0) * Number(i.costPrice||0), 0);
      const gst = items.reduce((a, i) => a + Number(i.qty||0) * Number(i.costPrice||0) * (Number(i.taxPercent||0)/100), 0);
      const payload = {
        supplierId:   extracted?.supplierId   || "",
        supplierName: extracted?.supplierName || "Unknown",
        invoiceNo:    extracted?.invoiceNo    || `INV-${Date.now()}`,
        date:         extracted?.invoiceDate  || new Date().toISOString().split("T")[0],
        items, subtotal: sub, gstAmount: gst, discount: 0,
        total: sub + gst, paymentMode: "credit",
      };
      const { data } = await ax("post", "/suppliers/direct-purchase", payload);
      setSavedPO(data);
      setStep("saved");
    } catch (e) {
      setError(e.response?.data?.error || "Save failed");
    } finally { setLoading(false); }
  }

  // ── Sync RAG ─────────────────────────────────────────────────────────────────
  async function syncRag() {
    setLoading(true);
    try {
      const { data } = await ax("post", "/ai/invoice/sync-rag");
      alert(`✅ RAG synced — ${data.synced} products embedded`);
    } catch { alert("RAG sync failed"); }
    finally { setLoading(false); }
  }

  // ── Computed totals ───────────────────────────────────────────────────────────
  const subtotal = items.reduce((a,i) => a + Number(i.qty||0)*Number(i.costPrice||0), 0);
  const gst      = items.reduce((a,i) => a + Number(i.qty||0)*Number(i.costPrice||0)*(Number(i.taxPercent||0)/100), 0);

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#e2e8f0",
                  fontFamily: "'Inter', sans-serif", padding: "24px 32px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700,
                       background: "linear-gradient(135deg,#6366f1,#22d3ee)", WebkitBackgroundClip: "text",
                       WebkitTextFillColor: "transparent" }}>
            📸 AI Smart Ledger
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            Photo → OCR → LLM → RAG correction → ERP entry
          </p>
        </div>
        <button onClick={syncRag} disabled={loading}
          style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8",
                   borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13 }}>
          🔄 Sync RAG Knowledge Base
        </button>
      </div>

      {/* ── Pipeline steps ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {["upload","review","saved"].map((s, i) => {
          const labels = ["1. Upload Photo", "2. Review & Edit", "3. Saved to ERP"];
          const active = step === s;
          const done   = ["upload","review","saved"].indexOf(step) > i;
          return (
            <div key={s} style={{ flex:1, padding:"10px 16px", borderRadius:10,
                                   background: active ? "#6366f122" : done ? "#22c55e11" : "#0f172a",
                                   border: `1px solid ${active?"#6366f1":done?"#22c55e44":"#1e293b"}`,
                                   color: active?"#818cf8":done?"#22c55e":"#475569", fontSize:13, fontWeight:600 }}>
              {done?"✓ ":""}{labels[i]}
            </div>
          );
        })}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background:"#ef444411", border:"1px solid #ef444433", borderRadius:8,
                      padding:"12px 16px", marginBottom:20, color:"#fca5a5", fontSize:13 }}>
          ❌ {error}
        </div>
      )}

      {/* ══ STEP 1: Upload ══ */}
      {step === "upload" && (
        <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)}
             onDrop={handleDrop}
             style={{ border:`2px dashed ${dragging?"#6366f1":"#334155"}`, borderRadius:16,
                      background: dragging?"#6366f111":"#0f172a", textAlign:"center",
                      padding:"60px 40px", cursor:"pointer", transition:"all .2s" }}>
          {loading ? (
            <div>
              <div style={{ fontSize:48, marginBottom:16 }}>🤖</div>
              <p style={{ color:"#6366f1", fontSize:16, fontWeight:600 }}>AI is reading your invoice…</p>
              <p style={{ color:"#475569", fontSize:13 }}>OCR → LLM extraction → RAG product matching</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize:56, marginBottom:12 }}>📷</div>
              <p style={{ fontSize:18, fontWeight:600, color:"#e2e8f0", margin:"0 0 8px" }}>
                Drop invoice photo here
              </p>
              <p style={{ color:"#64748b", fontSize:13, marginBottom:20 }}>
                Supports JPG, PNG, WEBP · Powered by EasyOCR + Llama 3.2 + ChromaDB RAG
              </p>
              <label style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff",
                               borderRadius:10, padding:"10px 28px", cursor:"pointer", fontSize:14, fontWeight:600 }}>
                Browse File
                <input type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
              </label>
            </>
          )}
        </div>
      )}

      {/* ══ STEP 2: Review ══ */}
      {step === "review" && extracted && (
        <div>
          {/* Supplier + Invoice info */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
            {[
              ["Supplier",     extracted.supplierName],
              ["Invoice No",   extracted.invoiceNo],
              ["Invoice Date", extracted.invoiceDate],
            ].map(([label, val]) => (
              <div key={label} style={{ background:"#0f172a", borderRadius:10,
                                        border:"1px solid #1e293b", padding:"14px 18px" }}>
                <div style={{ color:"#64748b", fontSize:11, marginBottom:4 }}>{label}</div>
                <div style={{ color:"#e2e8f0", fontWeight:600, fontSize:15 }}>{val || "—"}</div>
              </div>
            ))}
          </div>

          {/* Items table */}
          <div style={{ background:"#0f172a", borderRadius:12, border:"1px solid #1e293b",
                        overflowX:"auto", marginBottom:20 }}>
            <div style={{ padding:"14px 18px", borderBottom:"1px solid #1e293b",
                          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontWeight:600, fontSize:15 }}>
                📦 Extracted Items ({items.length})
              </span>
              <button onClick={addRow}
                style={{ background:"#6366f122", border:"1px solid #6366f155", color:"#818cf8",
                         borderRadius:8, padding:"6px 16px", cursor:"pointer", fontSize:13 }}>
                + Add Row
              </button>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:"#1e293b" }}>
                  {["Name","Batch","HSN","Pack","Qty","Sch.Qty","Expiry","MRP","Cost","Tax%","RAG",""].map(h => (
                    <th key={h} style={{ padding:"8px 6px", color:"#64748b", fontWeight:600,
                                         textAlign:"left", fontSize:11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <ItemRow key={idx} item={item} idx={idx} onChange={updateItem} onRemove={removeItem} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals + actions */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={() => { setStep("upload"); setExtracted(null); setItems([]); }}
                style={{ background:"#1e293b", border:"1px solid #334155", color:"#94a3b8",
                         borderRadius:8, padding:"10px 22px", cursor:"pointer" }}>
                ← Re-upload
              </button>
              <button onClick={() => setOcrDebug(p => p ? "" : extracted?.ocr_text||"")}
                style={{ background:"#1e293b", border:"1px solid #334155", color:"#94a3b8",
                         borderRadius:8, padding:"10px 22px", cursor:"pointer" }}>
                {ocrDebug?"Hide":"Show"} OCR Debug
              </button>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ color:"#64748b", fontSize:12, marginBottom:4 }}>
                Subtotal ₹{subtotal.toFixed(2)} + GST ₹{gst.toFixed(2)}
              </div>
              <div style={{ color:"#22d3ee", fontSize:20, fontWeight:700, marginBottom:12 }}>
                Total ₹{(subtotal+gst).toFixed(2)}
              </div>
              <button onClick={saveBill} disabled={loading || items.length===0}
                style={{ background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"#fff",
                         borderRadius:10, padding:"12px 32px", cursor:"pointer",
                         fontSize:15, fontWeight:700, border:"none",
                         opacity: loading||items.length===0 ? 0.5 : 1 }}>
                {loading ? "Saving…" : "✅ Save to ERP"}
              </button>
            </div>
          </div>

          {/* OCR debug panel */}
          {ocrDebug && (
            <div style={{ marginTop:20, background:"#0f172a", border:"1px solid #334155",
                          borderRadius:10, padding:16 }}>
              <div style={{ color:"#64748b", fontSize:11, marginBottom:8 }}>RAW OCR OUTPUT (for debugging)</div>
              <pre style={{ color:"#94a3b8", fontSize:11, whiteSpace:"pre-wrap", maxHeight:200, overflowY:"auto" }}>
                {ocrDebug}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ══ STEP 3: Saved ══ */}
      {step === "saved" && (
        <div style={{ textAlign:"center", padding:"60px 40px" }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
          <h2 style={{ color:"#22c55e", marginBottom:8 }}>Purchase Bill Saved!</h2>
          <p style={{ color:"#64748b", marginBottom:32 }}>
            Invoice processed by AI and recorded in your ERP. Inventory updated automatically.
          </p>
          <button onClick={() => { setStep("upload"); setExtracted(null); setItems([]); setSavedPO(null); }}
            style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff",
                     borderRadius:10, padding:"12px 32px", cursor:"pointer", fontSize:15, fontWeight:700, border:"none" }}>
            📷 Scan Another Invoice
          </button>
        </div>
      )}
    </div>
  );
}
