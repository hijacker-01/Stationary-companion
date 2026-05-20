/**
 * ai-proxy.js  — Thin Node.js proxy to Python AI microservice
 * All routes under /api/ai/* are forwarded to http://localhost:8000
 */
const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const { protect } = require("../middleware/auth");

const AI_URL   = process.env.AI_SERVICE_URL || "http://localhost:8000";
const upload   = multer({ storage: multer.memoryStorage() });

// ── helper: forward JSON requests ────────────────────────────────────────────
async function proxyJSON(aiPath, res, method = "GET", body = null) {
  try {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    const r    = await fetch(`${AI_URL}${aiPath}`, opts);
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(503).json({ error: "AI service unavailable", detail: err.message });
  }
}

// ── Invoice ───────────────────────────────────────────────────────────────────
// POST /api/ai/invoice/parse   (multipart image)
router.post("/invoice/parse", protect, upload.single("invoice"), async (req, res) => {
  try {
    const form = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    form.append("file", blob, req.file.originalname);

    const r    = await fetch(`${AI_URL}/ai/invoice/parse`, { method: "POST", body: form });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(503).json({ error: "AI service unavailable", detail: err.message });
  }
});

// POST /api/ai/invoice/sync-rag
router.post("/invoice/sync-rag", protect, (req, res) => proxyJSON("/ai/invoice/sync-rag", res, "POST"));

// ── Reorder ───────────────────────────────────────────────────────────────────
// GET  /api/ai/reorder/suggestions
router.get("/reorder/suggestions", protect, (req, res) => proxyJSON("/ai/reorder/suggestions", res));

// POST /api/ai/reorder/run-agent
router.post("/reorder/run-agent", protect, (req, res) => proxyJSON("/ai/reorder/run-agent", res, "POST"));

// GET  /api/ai/reorder/draft-orders
router.get("/reorder/draft-orders", protect, (req, res) => proxyJSON("/ai/reorder/draft-orders", res));

// ── Expiry ────────────────────────────────────────────────────────────────────
// GET  /api/ai/expiry/risks
router.get("/expiry/risks", protect, (req, res) => proxyJSON("/ai/expiry/risks", res));

// POST /api/ai/expiry/suggest/:id
router.post("/expiry/suggest/:id", protect, (req, res) =>
  proxyJSON(`/ai/expiry/suggest/${req.params.id}`, res, "POST")
);

// POST /api/ai/expiry/run-agent
router.post("/expiry/run-agent", protect, (req, res) => proxyJSON("/ai/expiry/run-agent", res, "POST"));

// ── Health check ──────────────────────────────────────────────────────────────
router.get("/health", async (req, res) => {
  try {
    const r = await fetch(`${AI_URL}/health`);
    res.json(await r.json());
  } catch {
    res.status(503).json({ status: "AI service is offline" });
  }
});

module.exports = router;
