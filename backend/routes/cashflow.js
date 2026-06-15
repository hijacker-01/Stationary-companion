const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { branchWhere } = require("../middleware/branchScope");
const Customer = require("../models/Customer");
const PurchaseOrder = require("../models/PurchaseOrder");
const {
  computePaymentRisks,
  computeForecast,
  computePressure,
} = require("../services/cashflowAnalytics");

// Cash-flow forecast computed from real receivables (by due date) and payables.
router.get("/forecast", protect, async (req, res) => {
  try {
    const forecasts = await computeForecast(branchWhere(req));
    res.json(forecasts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Per-customer payment risk derived from actual outstanding balances and the
// age of their unpaid invoices.
router.get("/risks", protect, async (req, res) => {
  try {
    const risks = await computePaymentRisks(branchWhere(req));
    res.json(risks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Supplier payment pressure with real due dates from credit terms.
router.get("/pressure", protect, async (req, res) => {
  try {
    const pressure = await computePressure(branchWhere(req), PurchaseOrder);
    res.json(pressure);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// What-if: impact of a customer delaying payment, using their real balance.
router.post("/simulate", protect, async (req, res) => {
  try {
    const { customerId, delayDays } = req.body;
    const customer = customerId
      ? await Customer.findOne({ where: branchWhere(req, { id: customerId }) })
      : null;
    const amount = parseFloat(customer?.balance) || parseFloat(req.body.amount) || 50000;
    const days = parseInt(delayDays) || 30;
    // Interest loss approximated at 12% p.a. on the delayed amount.
    const interestLoss = Math.round((amount * days / 365) * 0.12);
    res.json({
      scenario: `If ${customer?.name || "selected customer"} delays by ${days} days`,
      delayedAmount: Math.round(amount),
      impactOnCash: -Math.round(amount),
      interestLoss,
      recommendation: amount > 100000
        ? "Consider offering an early-payment discount or escalating collections"
        : "Monitor closely",
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
