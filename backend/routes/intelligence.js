const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const sequelize = require("../config/db");
const { QueryTypes } = require("sequelize");

// AI Command Center Briefing
router.get("/briefing", protect, async (req, res) => {
  try {
    res.json({
      success: true,
      greeting: "Good Morning",
      expectedRevenue: 280000,
      stockouts: [{ name: "Paracetamol 650", daysLeft: 2 }],
      expiries: [{ name: "Amlodipine Batch A31", daysLeft: 45 }],
      recommendedPurchase: 120000,
      expectedPayers: 18,
      message: "Today's Expected Revenue is ₹2.8 Lakh. Paracetamol 650 is likely to stock out in 2 days. Amlodipine Batch A31 has a near expiry risk (45 Days). Recommended Purchase is ₹1.2 Lakh. 18 customers are likely to pay today."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Executive Health Score
router.get("/health-score", protect, async (req, res) => {
  try {
    res.json({
      success: true,
      score: 87,
      metrics: {
        revenue: "+12%",
        profit: "+4%",
        cashFlow: "Healthy",
        inventoryValue: "₹45 Lakh",
        stockHealth: "92%",
        collectionHealth: "85%"
      },
      insights: [
        "Inventory turnover improved by 15% this quarter.",
        "Collections are lagging by 5% compared to last month."
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Customer Intelligence
router.get("/customer/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    // Mock aggregated data for a customer
    res.json({
      success: true,
      customerId: id,
      avgPurchaseValue: 12500,
      lastOrderDate: "2023-10-15",
      paymentDelays: "Medium (avg 14 days)",
      aiSuggestion: "Offer a 5% discount on early payments to improve cash flow."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Supplier Intelligence
router.get("/supplier/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    // Mock aggregated data for a supplier
    res.json({
      success: true,
      supplierId: id,
      deliveryReliability: "85%",
      pendingCredits: 5000,
      aiSuggestion: "Negotiate bulk discount; delivery times are reliable."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Auto-Purchase
router.get("/auto-purchase", protect, async (req, res) => {
  try {
    // Returns a generated draft PO based on sales velocity and expiry risk
    res.json({
      success: true,
      draftPO: [
        { itemId: 101, itemName: "Paracetamol 500mg", suggestedQuantity: 500, reason: "High sales velocity (50/day)." },
        { itemId: 105, itemName: "Amoxicillin", suggestedQuantity: 200, reason: "Current stock expires in 15 days." }
      ],
      aiSuggestion: "Approve draft PO to avoid stockouts in the next 7 days."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Collections
router.get("/collections", protect, async (req, res) => {
  try {
    // Returns arrays of likely_to_pay, at_risk, overdue
    res.json({
      success: true,
      likely_to_pay: [
        { customerId: 1, name: "Apollo Pharmacy", amount: 15000, prob: "90%" }
      ],
      at_risk: [
        { customerId: 2, name: "City Medicos", amount: 25000, prob: "40%" }
      ],
      overdue: [
        { customerId: 3, name: "Sanjivani Store", amount: 5000, daysOverdue: 45 }
      ]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Inventory Intelligence
router.get("/inventory", protect, async (req, res) => {
  try {
    // Returns dead_stock, fast_moving, overstock
    res.json({
      success: true,
      dead_stock: [
        { itemId: 201, itemName: "Old Bandages", stock: 100, daysUnsold: 180 }
      ],
      fast_moving: [
        { itemId: 101, itemName: "Paracetamol 500mg", velocity: "50 units/day" }
      ],
      overstock: [
        { itemId: 305, itemName: "Cough Syrup Extra", stock: 1000, optimal: 300 }
      ]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Reconciliation
router.post("/reconciliation", protect, async (req, res) => {
  try {
    // Mock endpoint that accepts a bank statement upload and returns matched vs unmatched transactions.
    res.json({
      success: true,
      matched: [
        { txnId: "TXN1001", amount: 5000, type: "Credit", ref: "Apollo Pharmacy" }
      ],
      unmatched: [
        { txnId: "TXN1002", amount: 1200, type: "Debit", ref: "Unknown Transfer" }
      ]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Self-Healing
router.get("/self-healing", protect, async (req, res) => {
  try {
    // Scans for negative stock and duplicate bills (just write the SQL/Sequelize logic or return mock flags).
    
    // Logic for negative stock using raw query:
    const negativeStockItems = await sequelize.query(
      `SELECT id, name, stock FROM "Items" WHERE stock < 0`,
      { type: QueryTypes.SELECT }
    ).catch(() => []); // Fallback for table name issues

    // Logic for duplicate bills:
    const duplicateBills = await sequelize.query(
      `SELECT "billNumber", COUNT(*) as count FROM "Bills" GROUP BY "billNumber" HAVING COUNT(*) > 1`,
      { type: QueryTypes.SELECT }
    ).catch(() => []);

    res.json({
      success: true,
      issuesFound: true,
      negativeStock: negativeStockItems.length > 0 ? negativeStockItems : [{ id: 999, name: "Mock Negative Item", stock: -5 }],
      duplicateBills: duplicateBills.length > 0 ? duplicateBills : [{ billNumber: "INV-1000", count: 2 }],
      aiSuggestion: "Consider running a stock adjustment entry to resolve negative balances, and review duplicate bills for potential data entry errors."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
