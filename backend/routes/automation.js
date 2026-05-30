const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const AutomationRule = require("../models/AutomationRule");
const AutomationLog = require("../models/AutomationLog");
const eventBus = require("../services/EventBus");

router.get("/rules", protect, async (req, res) => {
  try {
    let rules = await AutomationRule.findAll({ order: [["createdAt", "DESC"]] });
    if (!rules.length) {
      const seeds = [
        { name: "High Value Invoice Alert", trigger: "high_value_invoice", triggerConfig: { minAmount: 500000 }, action: "notify_manager", actionConfig: { message: "Invoice exceeds ₹5 Lakh" }, isActive: true, createdBy: "System" },
        { name: "Auto Reorder on Low Stock", trigger: "stock_below_reorder", triggerConfig: {}, action: "create_po", actionConfig: { supplier: "auto" }, isActive: true, createdBy: "System" },
        { name: "Payment Overdue WhatsApp", trigger: "payment_overdue", triggerConfig: { minAmount: 10000 }, action: "send_whatsapp", actionConfig: { messageTemplate: "Hello {name}, your payment of ₹{total} is overdue. Please clear at earliest." }, isActive: true, createdBy: "System" },
        { name: "Expiry Discount Campaign", trigger: "expiry_approaching", triggerConfig: { daysBeforeExpiry: 60 }, action: "apply_discount", actionConfig: { discountPercent: 15 }, isActive: false, createdBy: "System" }
      ];
      for (const s of seeds) await AutomationRule.create(s);
      rules = await AutomationRule.findAll({ order: [["createdAt", "DESC"]] });
    }
    res.json(rules);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/rules", protect, async (req, res) => {
  try { res.json(await AutomationRule.create({ ...req.body, createdBy: req.user?.name || "User" })); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

router.put("/rules/:id", protect, async (req, res) => {
  try {
    await AutomationRule.update(req.body, { where: { id: req.params.id } });
    res.json({ message: "Rule updated" });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/rules/:id", protect, async (req, res) => {
  try { await AutomationRule.destroy({ where: { id: req.params.id } }); res.json({ message: "Rule deleted" }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/test/:id", protect, async (req, res) => {
  try {
    const rule = await AutomationRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: "Rule not found" });
    const testPayload = { billNo: "TEST-001", customerName: "Test Customer", customerPhone: "9999999999", total: 100000, ...req.body.payload };
    eventBus.emit(rule.trigger, testPayload);
    res.json({ message: `Test fired for rule '${rule.name}'`, trigger: rule.trigger, payload: testPayload });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/logs", protect, async (req, res) => {
  try { res.json(await AutomationLog.findAll({ order: [["executedAt", "DESC"]], limit: 100 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
