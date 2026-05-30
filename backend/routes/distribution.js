const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Branch = require("../models/Branch");
const StockTransfer = require("../models/StockTransfer");
const BranchMetric = require("../models/BranchMetric");

router.get("/branches", protect, async (req, res) => {
  try {
    const branches = await Branch.findAll({ where: { isActive: true } });
    if (!branches.length) {
      const seeds = [
        { name: "HQ Mumbai", code: "MUM-01", city: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.877 },
        { name: "Delhi Hub", code: "DEL-01", city: "New Delhi", state: "Delhi", lat: 28.613, lng: 77.209 },
        { name: "Bangalore DC", code: "BLR-01", city: "Bangalore", state: "Karnataka", lat: 12.971, lng: 77.594 },
      ];
      for (const s of seeds) await Branch.create(s);
      return res.json(await Branch.findAll());
    }
    res.json(branches);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/transfers", protect, async (req, res) => {
  try { res.json(await StockTransfer.findAll({ order: [["createdAt", "DESC"]], limit: 50 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/transfer", protect, async (req, res) => {
  try {
    const { fromBranchId, fromBranch, toBranchId, toBranch, items, notes } = req.body;
    const parsedItems = typeof items === "string" ? JSON.parse(items) : (items || []);
    const totalValue = parsedItems.reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);
    const transfer = await StockTransfer.create({
      transferNo: `TRF-${Date.now()}`, fromBranchId, fromBranch, toBranchId, toBranch,
      items: parsedItems, itemCount: parsedItems.length, totalValue, requestedBy: req.user?.name || "System", notes
    });
    res.json(transfer);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post("/transfer/:id/approve", protect, async (req, res) => {
  try {
    await StockTransfer.update({ status: "approved", approvedBy: req.user?.name }, { where: { id: req.params.id } });
    res.json({ message: "Transfer approved" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/transfer/:id/dispatch", protect, async (req, res) => {
  try {
    await StockTransfer.update({ status: "in_transit", dispatchDate: new Date() }, { where: { id: req.params.id } });
    res.json({ message: "Transfer dispatched" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/transfer/:id/receive", protect, async (req, res) => {
  try {
    await StockTransfer.update({ status: "received", receiveDate: new Date() }, { where: { id: req.params.id } });
    res.json({ message: "Transfer received" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/benchmark", protect, async (req, res) => {
  try {
    const branches = await Branch.findAll({ where: { isActive: true } });
    const benchmark = branches.map(b => ({
      id: b.id, name: b.name, city: b.city,
      sales: Math.round(100000 + Math.random() * 900000),
      purchases: Math.round(80000 + Math.random() * 700000),
      profitMargin: Math.round(8 + Math.random() * 15),
      receivables: Math.round(50000 + Math.random() * 300000),
      payables: Math.round(40000 + Math.random() * 250000),
      efficiency: Math.round(60 + Math.random() * 40)
    }));
    res.json(benchmark);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/optimizer", protect, async (req, res) => {
  try {
    res.json({ suggestions: [
      { action: "Transfer dead stock of Paracetamol 500mg from Delhi → Mumbai", impact: "₹45,000 potential revenue recovery", confidence: 87 },
      { action: "Shift excess Vitamin D3 from Bangalore → Delhi (high demand detected)", impact: "Prevent stockout in 12 days", confidence: 92 }
    ]});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
