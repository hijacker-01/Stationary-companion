const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill");
const Item = require("../models/Item");
const { Op } = require("sequelize");

// Sales Summary
router.get("/sales", async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from && to) {
      where.createdAt = {
        [Op.between]: [new Date(from), new Date(new Date(to).setHours(23, 59, 59))],
      };
    }
    const bills = await Bill.findAll({ where, order: [["createdAt", "ASC"]] });

    // Group by date
    const byDate = {};
    bills.forEach(b => {
      const date = new Date(b.createdAt).toLocaleDateString("en-IN");
      if (!byDate[date]) byDate[date] = { date, sales: 0, bills: 0, gst: 0 };
      byDate[date].sales += b.total;
      byDate[date].bills += 1;
      byDate[date].gst += b.gstAmount;
    });

    res.json({
      bills,
      chart: Object.values(byDate),
      totalSales: bills.reduce((s, b) => s + b.total, 0),
      totalBills: bills.length,
      totalGst: bills.reduce((s, b) => s + b.gstAmount, 0),
      totalDiscount: bills.reduce((s, b) => s + b.discount, 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stock Summary
router.get("/stock", async (req, res) => {
  try {
    const items = await Item.findAll();
    const totalItems = items.length;
    const totalValue = items.reduce((s, i) => s + (i.selling_price * i.stock_qty), 0);
    const lowStock = items.filter(i => i.stock_qty <= 10);
    const outOfStock = items.filter(i => i.stock_qty === 0);

    // Group by category
    const byCategory = {};
    items.forEach(i => {
      const cat = i.category || "Uncategorized";
      if (!byCategory[cat]) byCategory[cat] = { name: cat, count: 0, value: 0 };
      byCategory[cat].count += 1;
      byCategory[cat].value += i.selling_price * i.stock_qty;
    });

    res.json({
      items,
      totalItems,
      totalValue,
      lowStock,
      outOfStock,
      byCategory: Object.values(byCategory),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Expiry Summary
router.get("/expiry-summary", async (req, res) => {
  try {
    const items = await Item.findAll();
    const today = new Date();

    const expired = items.filter(i => new Date(i.expiry) < today);
    const in7 = items.filter(i => {
      const d = Math.ceil((new Date(i.expiry) - today) / 86400000);
      return d >= 0 && d <= 7;
    });
    const in30 = items.filter(i => {
      const d = Math.ceil((new Date(i.expiry) - today) / 86400000);
      return d > 7 && d <= 30;
    });
    const in90 = items.filter(i => {
      const d = Math.ceil((new Date(i.expiry) - today) / 86400000);
      return d > 30 && d <= 90;
    });

    res.json({
      expired: expired.length,
      in7: in7.length,
      in30: in30.length,
      in90: in90.length,
      expiredItems: expired,
      criticalItems: in7,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;