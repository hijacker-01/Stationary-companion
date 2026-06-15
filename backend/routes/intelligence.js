const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { branchWhere } = require("../middleware/branchScope");
const sequelize = require("../config/db");
const { Op } = require("sequelize");
const Bill = require("../models/Bill");
const Item = require("../models/Item");
const ItemBatch = require("../models/ItemBatch");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");
const StockMovement = require("../models/StockMovement");
const { computePaymentRisks } = require("../services/cashflowAnalytics");

const DAY_MS = 1000 * 60 * 60 * 24;

// Average units sold per day for an item over the last `days` days.
async function salesVelocity(where, itemId, days = 30) {
  const since = new Date(Date.now() - days * DAY_MS);
  const sold = await StockMovement.sum("quantity", {
    where: { ...where, itemId, type: "out", createdAt: { [Op.gte]: since } },
  });
  return (sold || 0) / days;
}

// AI Command Center Briefing — computed from real sales, stock and expiry data.
router.get("/briefing", protect, async (req, res) => {
  try {
    const where = branchWhere(req);
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

    // Expected revenue today = average daily sales over the last 30 days.
    const since30 = new Date(now - 30 * DAY_MS);
    const sales30 = await Bill.sum("total", { where: { ...where, createdAt: { [Op.gte]: since30 } } }) || 0;
    const expectedRevenue = Math.round(sales30 / 30);

    // Stockouts: items at/below reorder point with positive sales velocity.
    const lowItems = await Item.findAll({
      where: { ...where, stock_qty: { [Op.lte]: sequelize.col("reorderPoint") } },
      limit: 20,
    });
    const stockouts = [];
    for (const it of lowItems) {
      const v = await salesVelocity(where, it.id);
      const daysLeft = v > 0 ? Math.round(it.stock_qty / v) : null;
      if (daysLeft !== null && daysLeft <= 7) stockouts.push({ name: it.name, daysLeft });
    }
    stockouts.sort((a, b) => a.daysLeft - b.daysLeft);

    // Near expiry within 60 days.
    const in60 = new Date(now.getTime() + 60 * DAY_MS);
    const expiringItems = await Item.findAll({
      where: { ...where, expiry: { [Op.between]: [now, in60] }, stock_qty: { [Op.gt]: 0 } },
      order: [["expiry", "ASC"]], limit: 5,
    });
    const expiries = expiringItems.map((i) => ({
      name: `${i.name}${i.batch ? " Batch " + i.batch : ""}`,
      daysLeft: Math.round((new Date(i.expiry) - now) / DAY_MS),
    }));

    // Recommended purchase = cost to restock low items to 2x reorder point.
    let recommendedPurchase = 0;
    lowItems.forEach((it) => {
      const target = Math.max((it.reorderPoint || 0) * 2, 50);
      const need = Math.max(0, target - it.stock_qty);
      recommendedPurchase += need * (parseFloat(it.cost_price) || 0);
    });
    recommendedPurchase = Math.round(recommendedPurchase);

    // Customers likely to pay = those with outstanding within their credit window.
    const expectedPayers = await Customer.count({ where: { ...where, balance: { [Op.gt]: 0 } } });

    res.json({
      success: true,
      greeting,
      expectedRevenue,
      stockouts: stockouts.slice(0, 5),
      expiries,
      recommendedPurchase,
      expectedPayers,
      message: `${greeting}. Expected revenue today is approximately Rs.${expectedRevenue.toLocaleString("en-IN")}. ${stockouts.length} item(s) at stockout risk, ${expiries.length} batch(es) nearing expiry. Recommended purchase Rs.${recommendedPurchase.toLocaleString("en-IN")}. ${expectedPayers} customers have outstanding balances.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Executive Health Score — real KPIs blended into a 0-100 score.
router.get("/health-score", protect, async (req, res) => {
  try {
    const where = branchWhere(req);
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [salesThis, salesLast] = await Promise.all([
      Bill.sum("total", { where: { ...where, createdAt: { [Op.gte]: thisMonth } } }) || 0,
      Bill.sum("total", { where: { ...where, createdAt: { [Op.between]: [lastMonth, thisMonth] } } }) || 0,
    ]);
    const revenueGrowth = salesLast > 0 ? ((salesThis - salesLast) / salesLast) * 100 : 0;

    const items = await Item.findAll({ where });
    const inventoryValue = items.reduce((s, i) => s + (parseFloat(i.selling_price) || 0) * i.stock_qty, 0);
    const inStock = items.filter((i) => i.stock_qty > 0).length;
    const stockHealth = items.length > 0 ? Math.round((inStock / items.length) * 100) : 100;

    const customers = await Customer.findAll({ where });
    let billed = 0, paid = 0;
    customers.forEach((c) => { billed += parseFloat(c.totalPurchased) || 0; paid += parseFloat(c.totalPaid) || 0; });
    const collectionHealth = billed > 0 ? Math.round((paid / billed) * 100) : 100;

    // Composite score: growth, stock availability, collections.
    const growthScore = Math.max(0, Math.min(100, 50 + revenueGrowth)); // 0% growth -> 50
    const score = Math.round(growthScore * 0.4 + stockHealth * 0.3 + collectionHealth * 0.3);

    const insights = [];
    if (revenueGrowth >= 0) insights.push(`Revenue is up ${revenueGrowth.toFixed(1)}% vs last month.`);
    else insights.push(`Revenue is down ${Math.abs(revenueGrowth).toFixed(1)}% vs last month.`);
    if (collectionHealth < 80) insights.push(`Collections at ${collectionHealth}% — receivables need attention.`);
    if (stockHealth < 90) insights.push(`${items.length - inStock} item(s) out of stock.`);

    res.json({
      success: true,
      score,
      metrics: {
        revenue: `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}%`,
        inventoryValue: `Rs.${Math.round(inventoryValue).toLocaleString("en-IN")}`,
        stockHealth: `${stockHealth}%`,
        collectionHealth: `${collectionHealth}%`,
      },
      insights,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Customer Intelligence — from this customer's real invoice history.
router.get("/customer/:id", protect, async (req, res) => {
  try {
    const where = branchWhere(req);
    const customer = await Customer.findOne({ where: branchWhere(req, { id: req.params.id }) });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    const bills = await Bill.findAll({
      where: { ...where, customerName: customer.name },
      order: [["createdAt", "DESC"]],
    });
    const totalValue = bills.reduce((s, b) => s + (parseFloat(b.total) || 0), 0);
    const avgPurchaseValue = bills.length ? Math.round(totalValue / bills.length) : 0;
    const lastOrderDate = bills[0]?.createdAt || null;

    // Delay estimate: how far overdue the open bills are on average.
    const openBills = bills.filter((b) => b.status !== "paid");
    let weighted = 0, amt = 0;
    openBills.forEach((b) => {
      const due = b.dueDate ? new Date(b.dueDate) : new Date(new Date(b.createdAt).getTime() + (customer.creditDays || 30) * DAY_MS);
      const late = Math.max(0, Math.floor((Date.now() - due) / DAY_MS));
      const t = parseFloat(b.total) || 0;
      weighted += late * t; amt += t;
    });
    const avgDelay = amt > 0 ? Math.round(weighted / amt) : 0;

    res.json({
      success: true,
      customerId: customer.id,
      name: customer.name,
      totalOrders: bills.length,
      avgPurchaseValue,
      lastOrderDate,
      outstanding: Math.round(parseFloat(customer.balance) || 0),
      paymentDelays: avgDelay > 30 ? `High (avg ${avgDelay} days)` : avgDelay > 7 ? `Medium (avg ${avgDelay} days)` : "Low / on-time",
      aiSuggestion: avgDelay > 14
        ? "Offer a small early-payment discount to improve collection time."
        : "Reliable payer — consider extending credit for larger orders.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Supplier Intelligence — from this supplier's real purchase orders.
router.get("/supplier/:id", protect, async (req, res) => {
  try {
    const where = branchWhere(req);
    const supplier = await Supplier.findOne({ where: branchWhere(req, { id: req.params.id }) });
    if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });

    const total = await PurchaseOrder.count({ where: { ...where, supplierName: supplier.name } });
    const received = await PurchaseOrder.count({ where: { ...where, supplierName: supplier.name, status: "received" } });
    const reliability = total > 0 ? Math.round((received / total) * 100) : null;

    res.json({
      success: true,
      supplierId: supplier.id,
      name: supplier.name,
      totalOrders: total,
      deliveryReliability: reliability !== null ? `${reliability}%` : "No data yet",
      pendingCredits: Math.round(parseFloat(supplier.balance) || 0),
      rating: supplier.rating,
      aiSuggestion: reliability !== null && reliability < 70
        ? "Delivery fulfilment is low — consider a backup supplier for critical items."
        : "Reliable supplier — negotiate bulk discounts for better margins.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Auto-Purchase draft — real low-stock items needing replenishment.
router.get("/auto-purchase", protect, async (req, res) => {
  try {
    const where = branchWhere(req);
    const lowItems = await Item.findAll({
      where: { ...where, stock_qty: { [Op.lte]: sequelize.col("reorderPoint") } },
      limit: 25,
    });
    const draftPO = [];
    for (const it of lowItems) {
      const v = await salesVelocity(where, it.id);
      const target = Math.max((it.reorderPoint || 0) * 2, 50);
      const suggestedQuantity = Math.max(0, target - it.stock_qty);
      if (suggestedQuantity <= 0) continue;
      const daysLeft = v > 0 ? Math.round(it.stock_qty / v) : null;
      draftPO.push({
        itemId: it.id,
        itemName: it.name,
        currentStock: it.stock_qty,
        suggestedQuantity,
        reason: daysLeft !== null
          ? `Stock covers ~${daysLeft} day(s) at current sales velocity.`
          : `Below reorder point (${it.reorderPoint}).`,
      });
    }
    res.json({
      success: true,
      draftPO,
      aiSuggestion: draftPO.length
        ? "Review and approve to avoid stockouts on fast-moving items."
        : "Stock levels are healthy — no replenishment needed right now.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Collections — likely-to-pay / at-risk / overdue from real balances and aging.
router.get("/collections", protect, async (req, res) => {
  try {
    const risks = await computePaymentRisks(branchWhere(req));
    const likely_to_pay = risks.filter((r) => r.riskLevel === "low" || r.riskLevel === "medium")
      .slice(0, 20)
      .map((r) => ({ customerId: r.customerId, name: r.customerName, amount: r.totalOutstanding, prob: `${100 - r.riskScore}%` }));
    const at_risk = risks.filter((r) => r.riskLevel === "high")
      .map((r) => ({ customerId: r.customerId, name: r.customerName, amount: r.totalOutstanding, prob: `${100 - r.riskScore}%` }));
    const overdue = risks.filter((r) => r.overdueAmount > 0)
      .map((r) => ({ customerId: r.customerId, name: r.customerName, amount: r.overdueAmount, daysOverdue: r.avgDelayDays }));
    res.json({ success: true, likely_to_pay, at_risk, overdue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Inventory Intelligence — dead stock, fast movers, overstock from real data.
router.get("/inventory", protect, async (req, res) => {
  try {
    const where = branchWhere(req);
    const items = await Item.findAll({ where });
    const dead_stock = [], fast_moving = [], overstock = [];

    for (const it of items) {
      const v = await salesVelocity(where, it.id, 60);
      if (v === 0 && it.stock_qty > 0) {
        dead_stock.push({ itemId: it.id, itemName: it.name, stock: it.stock_qty, daysUnsold: ">60" });
      } else if (v >= 5) {
        fast_moving.push({ itemId: it.id, itemName: it.name, velocity: `${v.toFixed(1)} units/day` });
      }
      // Overstock: more than 90 days of cover at current velocity.
      if (v > 0 && it.stock_qty / v > 90) {
        const optimal = Math.round(v * 30);
        overstock.push({ itemId: it.id, itemName: it.name, stock: it.stock_qty, optimal });
      }
    }

    res.json({
      success: true,
      dead_stock: dead_stock.slice(0, 50),
      fast_moving: fast_moving.sort((a, b) => parseFloat(b.velocity) - parseFloat(a.velocity)).slice(0, 50),
      overstock: overstock.slice(0, 50),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Advanced Expiry Intelligence — real expiring batches with actions.
router.get("/expiry-risk", protect, async (req, res) => {
  try {
    const where = branchWhere(req);
    const now = new Date();
    const in90 = new Date(now.getTime() + 90 * DAY_MS);
    const batches = await ItemBatch.findAll({
      where: { ...where, quantity: { [Op.gt]: 0 }, expiryDate: { [Op.lte]: in90 } },
      order: [["expiryDate", "ASC"]], limit: 50,
    });
    const items = await Item.findAll({ where, raw: true });
    const itemMap = items.reduce((acc, i) => { acc[i.id] = i; return acc; }, {});

    let totalRiskValue = 0;
    const expiringBatches = batches.map((b) => {
      const item = itemMap[b.itemId] || {};
      const daysLeft = Math.round((new Date(b.expiryDate) - now) / DAY_MS);
      const value = b.quantity * (parseFloat(b.purchaseRate) || parseFloat(item.cost_price) || 0);
      totalRiskValue += value;
      const suggestions = [];
      if (daysLeft <= 30) suggestions.push({ type: "return", action: "Return to supplier if within return window" });
      if (daysLeft <= 60) suggestions.push({ type: "discount", action: "Offer a discount to clear stock before expiry" });
      suggestions.push({ type: "bundle", action: "Bundle with fast-moving items" });
      return {
        id: b.id, name: item.name || "Unknown", batch: b.batchNo,
        expiryDate: b.expiryDate, daysLeft, qty: b.quantity, value: Math.round(value), suggestions,
      };
    });

    const totalStockValue = items.reduce((s, i) => s + (parseFloat(i.cost_price) || 0) * i.stock_qty, 0);
    const expiryRiskScore = totalStockValue > 0 ? Math.round(Math.min(100, (totalRiskValue / totalStockValue) * 100)) : 0;

    res.json({
      success: true,
      expiryRiskScore,
      heatmap: expiryRiskScore > 50 ? "critical" : expiryRiskScore > 20 ? "warning" : "safe",
      totalRiskValue: Math.round(totalRiskValue),
      expiringBatches,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bank reconciliation requires a parsed bank statement upload, which is not yet
// wired to a statement source. Flagged as demo so it isn't mistaken for real.
router.post("/reconciliation", protect, async (req, res) => {
  res.json({
    success: true,
    demo: true,
    note: "Bank reconciliation needs a bank-statement feed/upload to be wired up. This is sample output.",
    matched: [],
    unmatched: [],
  });
});

// Self-Healing — scans for real negative stock and duplicate bill numbers.
router.get("/self-healing", protect, async (req, res) => {
  try {
    const where = branchWhere(req);
    const negativeStock = await Item.findAll({
      where: { ...where, stock_qty: { [Op.lt]: 0 } },
      attributes: ["id", "name", "batch", "stock_qty"],
    });

    // Duplicate bill numbers within scope.
    const bills = await Bill.findAll({ where, attributes: ["billNo"] });
    const counts = {};
    bills.forEach((b) => { counts[b.billNo] = (counts[b.billNo] || 0) + 1; });
    const duplicateBills = Object.entries(counts)
      .filter(([, c]) => c > 1)
      .map(([billNo, count]) => ({ billNo, count }));

    const issuesFound = negativeStock.length > 0 || duplicateBills.length > 0;
    res.json({
      success: true,
      issuesFound,
      negativeStock,
      duplicateBills,
      aiSuggestion: issuesFound
        ? "Run a stock adjustment to correct negative balances and review duplicate bill numbers for data-entry errors."
        : "No data-integrity issues detected.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
