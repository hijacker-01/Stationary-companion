const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { Op } = require("sequelize");
const Branch = require("../models/Branch");
const StockTransfer = require("../models/StockTransfer");
const BranchMetric = require("../models/BranchMetric");
const Bill = require("../models/Bill");
const PurchaseOrder = require("../models/PurchaseOrder");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Item = require("../models/Item");

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
    const benchmark = [];
    for (const b of branches) {
      const scope = { branchId: b.id };
      const [sales, purchases, salesSub, salesTotal] = await Promise.all([
        Bill.sum("total", { where: scope }) || 0,
        PurchaseOrder.sum("total", { where: scope }) || 0,
        Bill.sum("subtotal", { where: scope }) || 0,
        Bill.sum("total", { where: scope }) || 0,
      ]);
      const customers = await Customer.findAll({ where: { ...scope, balance: { [Op.gt]: 0 } }, attributes: ["balance"] });
      const suppliers = await Supplier.findAll({ where: { ...scope, balance: { [Op.gt]: 0 } }, attributes: ["balance"] });
      const receivables = customers.reduce((s, c) => s + (parseFloat(c.balance) || 0), 0);
      const payables = suppliers.reduce((s, x) => s + (parseFloat(x.balance) || 0), 0);
      // Gross margin from GST-exclusive subtotal vs total is not cost; approximate
      // margin as gst-exclusive sales share, and efficiency as collection ratio.
      const profitMargin = salesTotal > 0 ? Math.round(((salesSub || 0) / salesTotal) * 100) : 0;
      const efficiency = (sales + receivables) > 0 ? Math.round((sales / (sales + receivables)) * 100) : 0;
      benchmark.push({
        id: b.id, name: b.name, city: b.city,
        sales: Math.round(sales), purchases: Math.round(purchases),
        profitMargin, receivables: Math.round(receivables), payables: Math.round(payables), efficiency,
      });
    }
    res.json(benchmark);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Real rebalancing suggestions: items overstocked in one branch (>2x reorder)
// while below reorder in another branch.
router.get("/optimizer", protect, async (req, res) => {
  try {
    const items = await Item.findAll({
      attributes: ["name", "batch", "branchId", "stock_qty", "reorderPoint", "cost_price"],
    });
    const branches = await Branch.findAll();
    const branchName = branches.reduce((acc, b) => { acc[b.id] = b.name; return acc; }, {});

    // Group by item name.
    const byName = {};
    for (const it of items) {
      (byName[it.name] = byName[it.name] || []).push(it);
    }

    const suggestions = [];
    for (const [name, rows] of Object.entries(byName)) {
      if (rows.length < 2) continue;
      const surplus = rows.filter((r) => r.reorderPoint > 0 && r.stock_qty > r.reorderPoint * 2);
      const shortage = rows.filter((r) => r.stock_qty <= (r.reorderPoint || 0));
      for (const sh of shortage) {
        const src = surplus.find((s) => s.branchId !== sh.branchId);
        if (!src) continue;
        const moveQty = Math.min(src.stock_qty - src.reorderPoint * 2 + 1, (sh.reorderPoint * 2) - sh.stock_qty);
        if (moveQty <= 0) continue;
        suggestions.push({
          action: `Transfer ${moveQty} units of ${name} from ${branchName[src.branchId] || "Branch " + src.branchId} → ${branchName[sh.branchId] || "Branch " + sh.branchId}`,
          impact: `Prevents stockout at ${branchName[sh.branchId] || "destination"}; frees overstock worth ~Rs.${Math.round(moveQty * (parseFloat(src.cost_price) || 0)).toLocaleString("en-IN")}`,
          itemName: name, fromBranchId: src.branchId, toBranchId: sh.branchId, quantity: moveQty,
        });
      }
    }
    res.json({ suggestions: suggestions.slice(0, 20) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
