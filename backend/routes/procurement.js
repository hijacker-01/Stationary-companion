const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const SupplierPerformance = require("../models/SupplierPerformance");
const RFQ = require("../models/RFQ");
const RFQResponse = require("../models/RFQResponse");
const PurchaseOrder = require("../models/PurchaseOrder");
const Supplier = require("../models/Supplier");
const Item = require("../models/Item");
const { Op } = require("sequelize");

// GET /api/procurement/supplier-scores
router.get("/supplier-scores", protect, async (req, res) => {
  try {
    let scores = await SupplierPerformance.findAll({ order: [["overallScore", "DESC"]] });
    if (!scores.length) {
      const suppliers = await Supplier.findAll({ where: { status: "active" }, limit: 20 });
      for (const s of suppliers) {
        const totalOrders = await PurchaseOrder.count({ where: { supplierId: s.id } });
        const fulfilled = await PurchaseOrder.count({ where: { supplierId: s.id, status: "received" } });
        const onTime = totalOrders > 0 ? Math.round((fulfilled / totalOrders) * 100) : 0;
        const quality = Math.min(100, 60 + Math.random() * 40);
        const overall = Math.round((onTime * 0.4 + quality * 0.3 + Math.min(100, totalOrders * 5) * 0.3));
        await SupplierPerformance.create({
          supplierId: s.id, supplierName: s.name, onTimeDeliveryRate: onTime,
          qualityScore: Math.round(quality), avgLeadDays: Math.round(3 + Math.random() * 10),
          totalOrders, fulfilledOrders: fulfilled, overallScore: overall, lastEvaluated: new Date()
        });
      }
      scores = await SupplierPerformance.findAll({ order: [["overallScore", "DESC"]] });
    }
    res.json(scores);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/procurement/rfqs
router.get("/rfqs", protect, async (req, res) => {
  try {
    const rfqs = await RFQ.findAll({ order: [["createdAt", "DESC"]] });
    res.json(rfqs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/procurement/rfq
router.post("/rfq", protect, async (req, res) => {
  try {
    const { itemName, requiredQty, urgency, deadline, notes } = req.body;
    const item = await Item.findOne({ where: { name: { [Op.like]: `%${itemName}%` } } });
    const rfq = await RFQ.create({
      rfqNumber: `RFQ-${Date.now()}`, itemId: item?.id, itemName: itemName || "Unknown",
      requiredQty, currentStock: item?.stock_qty || 0, urgency: urgency || "medium",
      deadline, notes, createdBy: req.user?.name || "System"
    });
    res.json(rfq);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/procurement/rfq/:id/responses
router.get("/rfq/:id/responses", protect, async (req, res) => {
  try {
    const responses = await RFQResponse.findAll({ where: { rfqId: req.params.id }, order: [["landedCost", "ASC"]] });
    res.json(responses);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/procurement/rfq/:id/respond
router.post("/rfq/:id/respond", protect, async (req, res) => {
  try {
    const { supplierId, supplierName, unitPrice, deliveryDays, freeQty, discount, gstPercent } = req.body;
    const rfq = await RFQ.findByPk(req.params.id);
    if (!rfq) return res.status(404).json({ error: "RFQ not found" });
    const effectivePrice = unitPrice * (1 - (discount || 0) / 100);
    const gst = effectivePrice * (gstPercent || 12) / 100;
    const landedCost = effectivePrice + gst;
    const totalCost = landedCost * rfq.requiredQty;
    const response = await RFQResponse.create({
      rfqId: rfq.id, supplierId, supplierName, unitPrice, deliveryDays: deliveryDays || 7,
      freeQty: freeQty || 0, discount: discount || 0, gstPercent: gstPercent || 12,
      landedCost: Math.round(landedCost * 100) / 100, totalCost: Math.round(totalCost * 100) / 100
    });
    await rfq.update({ responsesCount: rfq.responsesCount + 1, status: "received" });
    res.json(response);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/procurement/rfq/:id/compare
router.post("/rfq/:id/compare", protect, async (req, res) => {
  try {
    const rfq = await RFQ.findByPk(req.params.id);
    if (!rfq) return res.status(404).json({ error: "RFQ not found" });
    const responses = await RFQResponse.findAll({ where: { rfqId: rfq.id }, order: [["landedCost", "ASC"]] });
    if (!responses.length) return res.status(400).json({ error: "No responses to compare" });
    const best = responses[0];
    await RFQResponse.update({ selected: false }, { where: { rfqId: rfq.id } });
    await best.update({ selected: true });
    await rfq.update({ bestSupplierId: best.supplierId, bestSupplierName: best.supplierName, bestLandedCost: best.landedCost, status: "compared" });
    res.json({ rfq, bestResponse: best, allResponses: responses });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/procurement/auto-po — AI-generated draft POs
router.get("/auto-po", protect, async (req, res) => {
  try {
    const autoPOs = await PurchaseOrder.findAll({ where: { source: "ai_auto", status: "pending" }, order: [["createdAt", "DESC"]], limit: 20 });
    if (!autoPOs.length) {
      const lowStock = await Item.findAll({ where: { stock_qty: { [Op.lte]: require("sequelize").col("reorderPoint") } }, limit: 5 });
      const draftPOs = [];
      for (const item of lowStock) {
        const supplier = await Supplier.findOne({ where: { status: "active" } });
        if (supplier) {
          const qty = Math.max(item.reorderPoint * 2, 50);
          const po = await PurchaseOrder.create({
            poNumber: `AI-PO-${Date.now()}-${item.id}`, supplierId: supplier.id, supplierName: supplier.name,
            items: [{ name: item.name, qty, rate: item.cost_price || 0, amount: qty * (item.cost_price || 0) }],
            total: qty * (item.cost_price || 0), source: "ai_auto", autoScore: 75 + Math.random() * 25, status: "pending"
          });
          draftPOs.push(po);
        }
      }
      return res.json(draftPOs);
    }
    res.json(autoPOs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/procurement/dashboard
router.get("/dashboard", protect, async (req, res) => {
  try {
    const [totalRfqs, pendingResponses, aiPOs, avgScore] = await Promise.all([
      RFQ.count(), RFQ.count({ where: { status: "sent" } }),
      PurchaseOrder.count({ where: { source: "ai_auto", status: "pending" } }),
      SupplierPerformance.findOne({ attributes: [[require("sequelize").fn("AVG", require("sequelize").col("overallScore")), "avg"]] })
    ]);
    res.json({ totalRfqs, pendingResponses, aiPOs, avgSupplierScore: Math.round(avgScore?.dataValues?.avg || 0) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
