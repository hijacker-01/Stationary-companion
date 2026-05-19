const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const Bill = require("../models/Bill");
const Item = require("../models/Item");
const Customer = require("../models/Customer");
const PurchaseOrder = require("../models/PurchaseOrder");

router.get("/", async (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd   = new Date(today.setHours(23, 59, 59, 999));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Today's sales
    const todayBills = await Bill.findAll({
      where: { createdAt: { [Op.between]: [todayStart, todayEnd] } }
    });
    const todaySales   = todayBills.reduce((s, b) => s + (b.total || 0), 0);
    const todayBillCount = todayBills.length;
    const todayCash    = todayBills.filter(b => b.paymentMode === "cash").reduce((s, b) => s + b.total, 0);
    const todayCredit  = todayBills.filter(b => b.paymentMode === "credit").reduce((s, b) => s + b.total, 0);

    // Monthly sales (last 12 months)
    const allBills = await Bill.findAll({ order: [["createdAt", "ASC"]] });
    const monthlyMap = {};
    allBills.forEach(b => {
      const key = new Date(b.createdAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      monthlyMap[key] = (monthlyMap[key] || 0) + (b.total || 0);
    });
    const monthlySales = Object.entries(monthlyMap).slice(-12).map(([month, total]) => ({ month, total: parseFloat(total.toFixed(2)) }));

    // Outstanding customers
    const outstanding = await Customer.findAll({
      where: { balance: { [Op.gt]: 0 } },
      order: [["balance", "DESC"]],
      limit: 10,
      attributes: ["id", "name", "phone", "balance"],
    });

    // Low stock items (below 10 or reorderPoint)
    const lowStock = await Item.findAll({
      where: { stock_qty: { [Op.lte]: 10 } },
      order: [["stock_qty", "ASC"]],
      limit: 10,
    });

    // Near expiry (next 60 days)
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
    const nearExpiry = await Item.findAll({
      where: {
        expiry: { [Op.between]: [new Date(), sixtyDaysFromNow] },
        stock_qty: { [Op.gt]: 0 },
      },
      order: [["expiry", "ASC"]],
      limit: 10,
    });

    // Top selling items (from bill items JSON)
    const itemSalesMap = {};
    allBills.forEach(b => {
      (b.items || []).forEach(item => {
        if (!item.name) return;
        itemSalesMap[item.name] = (itemSalesMap[item.name] || 0) + (parseFloat(item.amount) || 0);
      });
    });
    const topItems = Object.entries(itemSalesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, sales]) => ({ name, sales: parseFloat(sales.toFixed(2)) }));

    // Pending (unpaid) bills
    const unpaidBills = await Bill.findAll({ where: { status: "unpaid" } });
    const totalOutstanding = unpaidBills.reduce((s, b) => s + b.total, 0);

    // Total revenue (all time)
    const totalRevenue = allBills.reduce((s, b) => s + (b.total || 0), 0);

    res.json({
      todaySales: parseFloat(todaySales.toFixed(2)),
      todayBillCount,
      todayCash: parseFloat(todayCash.toFixed(2)),
      todayCredit: parseFloat(todayCredit.toFixed(2)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
      unpaidBillCount: unpaidBills.length,
      lowStockCount: lowStock.length,
      nearExpiryCount: nearExpiry.length,
      monthlySales,
      topItems,
      outstanding,
      lowStock,
      nearExpiry,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
