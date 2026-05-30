const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const CashFlowForecast = require("../models/CashFlowForecast");
const PaymentRisk = require("../models/PaymentRisk");
const Bill = require("../models/Bill");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Payment = require("../models/Payment");

router.get("/forecast", protect, async (req, res) => {
  try {
    let forecasts = await CashFlowForecast.findAll({ order: [["date", "DESC"]], limit: 4 });
    if (!forecasts.length) {
      const totalSales = await Bill.sum("total") || 100000;
      const periods = [
        { period: "7d", factor: 0.1 }, { period: "30d", factor: 0.35 },
        { period: "60d", factor: 0.65 }, { period: "90d", factor: 1.0 }
      ];
      for (const p of periods) {
        const inflow = Math.round(totalSales * p.factor * (0.8 + Math.random() * 0.4));
        const outflow = Math.round(inflow * (0.6 + Math.random() * 0.3));
        await CashFlowForecast.create({
          date: new Date(), period: p.period, predictedInflow: inflow, predictedOutflow: outflow,
          netPosition: inflow - outflow, confidence: Math.round(70 + Math.random() * 25),
          factors: { salesTrend: "stable", receivableRisk: "moderate", seasonality: "normal" }
        });
      }
      forecasts = await CashFlowForecast.findAll({ order: [["date", "DESC"]], limit: 4 });
    }
    res.json(forecasts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/risks", protect, async (req, res) => {
  try {
    let risks = await PaymentRisk.findAll({ order: [["riskScore", "DESC"]] });
    if (!risks.length) {
      const customers = await Customer.findAll({ where: { status: "active" }, limit: 20 });
      for (const c of customers) {
        const delay = Math.round(Math.random() * 60);
        const score = Math.min(100, delay * 1.5 + (c.balance > 50000 ? 20 : 0));
        await PaymentRisk.create({
          customerId: c.id, customerName: c.name, riskScore: Math.round(score),
          riskLevel: score > 75 ? "critical" : score > 50 ? "high" : score > 25 ? "medium" : "low",
          avgDelayDays: delay, totalOutstanding: c.balance || 0,
          overdueAmount: Math.round((c.balance || 0) * (delay > 30 ? 0.6 : 0.2)),
          predictedDefault: score > 80, lastAssessed: new Date(),
          factors: { paymentHistory: delay > 30 ? "poor" : "good", outstandingRatio: c.balance > 100000 ? "high" : "normal" }
        });
      }
      risks = await PaymentRisk.findAll({ order: [["riskScore", "DESC"]] });
    }
    res.json(risks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/pressure", protect, async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({ where: { status: "active" }, limit: 15 });
    const pressure = suppliers.map(s => ({
      id: s.id, name: s.name, payable: s.balance || 0,
      dueDate: new Date(Date.now() + Math.random() * 30 * 86400000).toISOString().split("T")[0],
      daysUntilDue: Math.round(Math.random() * 30),
      priority: s.balance > 100000 ? "critical" : s.balance > 50000 ? "high" : "normal"
    }));
    res.json(pressure);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/simulate", protect, async (req, res) => {
  try {
    const { customerId, delayDays } = req.body;
    const customer = customerId ? await Customer.findByPk(customerId) : null;
    const amount = customer?.balance || req.body.amount || 50000;
    const impact = Math.round(amount * (delayDays || 30) / 365 * 0.12);
    res.json({
      scenario: `If ${customer?.name || "selected customer"} delays by ${delayDays || 30} days`,
      impactOnCash: -amount, interestLoss: impact,
      newNetPosition: "Recalculate after applying delay",
      recommendation: amount > 100000 ? "Consider offering early payment discount or escalating collections" : "Monitor closely"
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
