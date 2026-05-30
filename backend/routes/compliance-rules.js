const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const ComplianceRule = require("../models/ComplianceRule");

router.get("/", protect, async (req, res) => {
  try {
    const rules = await ComplianceRule.findAll();
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const rule = await ComplianceRule.create(req.body);
    res.status(201).json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const rule = await ComplianceRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: "Rule not found" });
    await rule.update(req.body);
    res.json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/seed", protect, adminOnly, async (req, res) => {
  try {
    const defaultRules = [
      { ruleName: "Expired Drug Sale", ruleType: "expired_drug", severity: "CRITICAL", actionToTake: "BLOCK" },
      { ruleName: "Schedule X without Rx", ruleType: "schedule_x_prescription", severity: "CRITICAL", actionToTake: "BLOCK" },
      { ruleName: "Credit Limit Exceeded", ruleType: "credit_limit", severity: "HIGH", actionToTake: "APPROVAL_REQUIRED", approvalLevel: "manager" },
      { ruleName: "High Value Sale", ruleType: "high_value_sale", severity: "HIGH", actionToTake: "APPROVAL_REQUIRED", config: { highValueThreshold: 500000 } },
      { ruleName: "Negative Margin", ruleType: "negative_margin", severity: "HIGH", actionToTake: "APPROVAL_REQUIRED" },
      { ruleName: "Near Expiry Alert", ruleType: "near_expiry", severity: "MEDIUM", actionToTake: "WARNING" }
    ];
    for (const r of defaultRules) {
      await ComplianceRule.findOrCreate({ where: { ruleName: r.ruleName }, defaults: r });
    }
    res.json({ message: "Default compliance rules seeded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
