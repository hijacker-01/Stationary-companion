const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill");
const Item = require("../models/Item");
const { Op } = require("sequelize");
const sequelize = require("../config/db");

// Paginated Invoices Report
router.get("/invoices", async (req, res) => {
  try {
    const { page = 1, limit = 100, from, to } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (from && to) {
      where.createdAt = {
        [Op.between]: [new Date(from), new Date(new Date(to).setHours(23, 59, 59))],
      };
    }

    const { count, rows } = await Bill.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]]
    });

    // Calculate server-side totals
    // Using raw SQL aggregation for performance over the whole filtered set
    const totalResult = await Bill.findOne({
      where,
      attributes: [
        [sequelize.fn("SUM", sequelize.col("total")), "totalRevenue"],
        [sequelize.fn("SUM", sequelize.col("amountDue")), "totalDue"],
      ],
      raw: true
    });

    const totalRevenue = parseFloat(totalResult.totalRevenue || 0);
    const totalDue = parseFloat(totalResult.totalDue || 0);
    const totalPaid = totalRevenue - totalDue;

    res.json({
      data: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      summary: {
        totalInvoices: count,
        totalRevenue,
        totalPaid,
        totalDue
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// Outstanding Aging Report (Customers and Suppliers)
router.get("/outstanding", async (req, res) => {
  try {
    const Customer = require("../models/Customer");
    const Supplier = require("../models/Supplier");
    
    const customers = await Customer.findAll({
      where: { balance: { [Op.gt]: 0 } }
    });
    const suppliers = await Supplier.findAll({
      where: { balance: { [Op.gt]: 0 } }
    });

    const today = new Date();

    const customerOutstanding = customers.map(c => {
      const ageDays = Math.ceil((today - new Date(c.updatedAt)) / 86400000);
      return {
        id: c.id,
        name: c.name,
        phone: c.phone || "",
        balance: c.balance,
        days: ageDays,
      };
    });

    const supplierOutstanding = suppliers.map(s => {
      const ageDays = Math.ceil((today - new Date(s.updatedAt)) / 86400000);
      return {
        id: s.id,
        name: s.name,
        phone: s.phone || "",
        outstanding: s.balance,
        days: ageDays,
      };
    });

    res.json({
      customers: customerOutstanding,
      suppliers: supplierOutstanding,
      totalCustomerOutstanding: customers.reduce((s, c) => s + c.balance, 0),
      totalSupplierOutstanding: suppliers.reduce((s, sup) => s + sup.balance, 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Salesman wise Sales Report
router.get("/salesman-sales", async (req, res) => {
  try {
    const bills = await Bill.findAll({
      where: { status: "paid" }
    });

    const repWise = {};
    bills.forEach(b => {
      const repName = b.salesmanName || "Self / Direct";
      if (!repWise[repName]) {
        repWise[repName] = { salesmanName: repName, sales: 0, bills: 0 };
      }
      repWise[repName].sales += b.total;
      repWise[repName].bills += 1;
    });

    res.json(Object.values(repWise));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Item wise Sales Report
router.get("/item-sales", async (req, res) => {
  try {
    const bills = await Bill.findAll({
      where: { status: "paid" }
    });

    const itemWise = {};
    bills.forEach(b => {
      (b.items || []).forEach(item => {
        const key = item.name;
        if (!itemWise[key]) {
          itemWise[key] = { name: item.name, qty: 0, schemeQty: 0, amount: 0 };
        }
        itemWise[key].qty += parseInt(item.qty || 0);
        itemWise[key].schemeQty += parseInt(item.schemeQty || 0);
        itemWise[key].amount += parseFloat(item.amount || 0);
      });
    });

    res.json(Object.values(itemWise));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Profit & Loss Report
router.get("/pnl", async (req, res) => {
  try {
    const Expense = require("../models/Expense");
    
    // 1. Total Sales and COGS
    // We will calculate COGS by mapping each sold item to its cost price.
    // In our simplified system, cost_price is saved on the bill items or we fetch from master.
    // To be perfectly accurate without historical cost tracking, we'll use the item's current cost_price,
    // or fallback to 80% of MRP if cost_price is missing.
    const Item = require("../models/Item");
    const allItems = await Item.findAll();
    const costMap = {};
    allItems.forEach(i => costMap[i.name] = i.cost_price || (i.mrp * 0.8) || 0);

    const bills = await Bill.findAll(); // Assuming all generated bills count towards revenue
    
    let totalSales = 0;
    let totalCOGS = 0;
    
    bills.forEach(b => {
      totalSales += (b.subtotal || 0);
      (b.items || []).forEach(item => {
        const qty = parseInt(item.qty || 0) + parseInt(item.schemeQty || 0); // COGS includes scheme qty given
        const cost = costMap[item.name] || 0;
        totalCOGS += (qty * cost);
      });
    });

    // 2. Expenses
    const expenses = await Expense.findAll();
    let totalExpenses = 0;
    expenses.forEach(e => totalExpenses += (e.amount || 0));

    // 3. Profit calculations
    const grossProfit = totalSales - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      sales: totalSales,
      cogs: totalCOGS,
      grossProfit: grossProfit,
      expenses: totalExpenses,
      netProfit: netProfit
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;