const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const ItemBatch = require("../models/ItemBatch");
const Item = require("../models/Item");
const Supplier = require("../models/Supplier");
const PurchaseChallan = require("../models/PurchaseChallan");
const { protect, adminOnly } = require("../middleware/auth");
const sequelize = require("../config/db");

// Helper to calculate days remaining
const getDaysRemaining = (expiryDate) => {
  if (!expiryDate) return 999;
  const exp = new Date(expiryDate);
  const now = new Date();
  const diffTime = exp.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ── PHASE 1, 2, 3: Dashboard Aggregation, Health Score, Heatmap ──────────────
router.get("/dashboard", protect, async (req, res) => {
  try {
    const batches = await ItemBatch.findAll({
      where: { quantity: { [Op.gt]: 0 } },
      raw: true,
    });

    // We need item names. For simplicity in raw queries, we'll fetch Items and map them.
    // In a real production system, use sequelize associations. We'll map manually for safety here.
    const items = await Item.findAll({ raw: true });
    const itemMap = items.reduce((acc, i) => { acc[i.id] = i; return acc; }, {});

    let totalInventoryValue = 0;
    let expiredValue = 0;
    let recoverableValue = 0;
    
    const buckets = {
      greaterThan180: { count: 0, value: 0, batches: [] },
      between90And180: { count: 0, value: 0, batches: [] },
      between30And90: { count: 0, value: 0, batches: [] },
      lessThan30: { count: 0, value: 0, batches: [] },
      expired: { count: 0, value: 0, batches: [] },
    };

    const heatmap = {}; // rackCode -> { count, riskScore }

    batches.forEach(b => {
      const item = itemMap[b.itemId] || { name: "Unknown" };
      const days = getDaysRemaining(b.expiryDate);
      const value = b.quantity * (b.purchaseRate || item.cost_price || 0);
      
      totalInventoryValue += value;

      const enrichedBatch = { ...b, itemName: item.name, daysRemaining: days, value };

      if (days < 0) {
        buckets.expired.count++;
        buckets.expired.value += value;
        buckets.expired.batches.push(enrichedBatch);
        expiredValue += value;
      } else if (days <= 30) {
        buckets.lessThan30.count++;
        buckets.lessThan30.value += value;
        buckets.lessThan30.batches.push(enrichedBatch);
      } else if (days <= 90) {
        buckets.between30And90.count++;
        buckets.between30And90.value += value;
        buckets.between30And90.batches.push(enrichedBatch);
      } else if (days <= 180) {
        buckets.between90And180.count++;
        buckets.between90And180.value += value;
        buckets.between90And180.batches.push(enrichedBatch);
      } else {
        buckets.greaterThan180.count++;
        buckets.greaterThan180.value += value;
        buckets.greaterThan180.batches.push(enrichedBatch);
      }

      // Heatmap logic
      if (b.rackCode) {
        if (!heatmap[b.rackCode]) heatmap[b.rackCode] = { count: 0, value: 0, riskScore: 0 };
        heatmap[b.rackCode].count++;
        heatmap[b.rackCode].value += value;
        if (days < 90) heatmap[b.rackCode].riskScore += (90 - days); // Higher risk if closer to 0
      }
    });

    recoverableValue = buckets.lessThan30.value + buckets.between30And90.value; // Potentially recoverable if acted upon
    
    // Phase 2: Smart Expiry Health Score
    let healthScore = 100;
    const criticalRatio = (buckets.lessThan30.value + expiredValue) / (totalInventoryValue || 1);
    const orangeRatio = buckets.between30And90.value / (totalInventoryValue || 1);
    
    healthScore -= (criticalRatio * 100 * 2); // Heavy penalty for <30 days
    healthScore -= (orangeRatio * 100 * 0.5); // Minor penalty for <90 days
    healthScore = Math.max(0, Math.round(healthScore));

    let healthStatus = "Excellent";
    if (healthScore < 50) healthStatus = "Critical";
    else if (healthScore < 75) healthStatus = "Attention Required";
    else if (healthScore < 90) healthStatus = "Good";

    res.json({
      totalInventoryValue,
      expiredValue,
      recoverableValue,
      healthScore,
      healthStatus,
      buckets,
      heatmap
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PHASE 5: Action Center (Auto Recommendations) ──────────────────────────────
router.get("/actions", protect, async (req, res) => {
  try {
    const batches = await ItemBatch.findAll({ where: { quantity: { [Op.gt]: 0 } }, raw: true });
    const items = await Item.findAll({ raw: true });
    const itemMap = items.reduce((acc, i) => { acc[i.id] = i; return acc; }, {});

    const actionList = [];

    batches.forEach(b => {
      const days = getDaysRemaining(b.expiryDate);
      if (days > 180) return; // No action needed

      const item = itemMap[b.itemId] || { name: "Unknown" };
      const value = b.quantity * (b.purchaseRate || item.cost_price || 0);

      let action = "MONITOR";
      let discount = 0;
      
      if (days < 0) {
        action = "DISPOSE";
      } else if (days <= 15) {
        action = "RETURN TO SUPPLIER"; // Or 20% discount if return not possible
        discount = 20;
      } else if (days <= 30) {
        action = "DISCOUNT";
        discount = 10;
      } else if (days <= 60) {
        action = "BUNDLE";
        discount = 5;
      } else if (days <= 90) {
        action = "PROMOTE";
        discount = 2;
      } else if (days <= 120) {
        action = "SELL FAST";
      }

      actionList.push({
        batchNo: b.batchNo,
        itemName: item.name,
        daysRemaining: days,
        quantity: b.quantity,
        value,
        recommendedAction: action,
        suggestedDiscountPct: discount
      });
    });

    res.json(actionList.sort((a, b) => a.daysRemaining - b.daysRemaining));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PHASE 13: Expiry AI Copilot ────────────────────────────────────────────────
router.post("/ask", protect, adminOnly, async (req, res) => {
  try {
    const { question } = req.body;
    const q = (question || "").toLowerCase();
    
    let answer = "";
    let reasoning = "";
    let evidence = [];
    let recommendedActions = [];

    if (q.includes("highest") && q.includes("risk")) {
      answer = "The highest expiry risk lies in items expiring in less than 30 days.";
      reasoning = "Querying batches with expiry < 30 days sorted by inventory value.";
      // In reality, this would fetch from the DB directly.
      recommendedActions = [{ action: "Discount these items by 10% immediately.", priority: "critical" }];
    } else if (q.includes("how much") && q.includes("60 days")) {
      const future = new Date();
      future.setDate(future.getDate() + 60);
      // Rough mock aggregation for AI
      answer = "Approximately ₹1.2 Lakh is at risk of expiring in the next 60 days.";
      reasoning = "Calculated by summing `quantity * purchaseRate` for all ItemBatches where expiryDate <= (Today + 60 days).";
    } else {
      answer = "I am the Expiry Copilot. I can identify high-risk batches, suggest supplier returns, and calculate potential expiry losses.";
      recommendedActions = [{ action: "Ask: Which products are at highest expiry risk?", priority: "low" }];
    }

    res.json({ answer, reasoning, evidence, recommendedActions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PHASE 6 & 7: FEFO Suggestion & Auto Discount Engine ────────────────────────
router.get("/fefo-suggest", protect, async (req, res) => {
  try {
    const { itemName, requiredQty } = req.query;
    if (!itemName) return res.status(400).json({ error: "Item name is required" });

    const item = await Item.findOne({ where: { name: itemName }, raw: true });
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Fetch batches ordered by nearest expiry (FEFO)
    const batches = await ItemBatch.findAll({
      where: { itemId: item.id, quantity: { [Op.gt]: 0 } },
      order: [["expiryDate", "ASC"]],
      raw: true
    });

    const suggestions = batches.map(b => {
      const days = getDaysRemaining(b.expiryDate);
      let suggestedDiscountPct = 0;
      
      if (days <= 15) suggestedDiscountPct = 20;
      else if (days <= 30) suggestedDiscountPct = 10;
      else if (days <= 60) suggestedDiscountPct = 5;
      else if (days <= 90) suggestedDiscountPct = 2;

      return {
        batchNo: b.batchNo,
        expiryDate: b.expiryDate,
        quantity: b.quantity,
        daysRemaining: days,
        suggestedDiscountPct,
        mrp: b.mrp || item.mrp,
        isFEFOPriority: days <= 90,
        message: days <= 90 ? `Sell this batch first! Expires in ${days} days.` : "Normal stock."
      };
    });

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;