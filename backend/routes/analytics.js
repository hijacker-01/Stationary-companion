const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const Bill = require("../models/Bill");
const Item = require("../models/Item");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const { protect, adminOnly } = require("../middleware/auth");

// Standard Overhead Allocations (Phase 2 - True Profit Engine)
const OVERHEADS = {
  freight: 0.02,     // 2% of revenue
  packaging: 0.005,  // 0.5%
  bankCharges: 0.01, // 1%
  warehouse: 0.015,  // 1.5%
  salesman: 0.01     // 1%
};

// ── GET /api/analytics/profit ────────────────────────────────────────────────
router.get("/profit", protect, adminOnly, async (req, res) => {
  try {
    const { filter } = req.query; // 'today', 'this_month', 'this_year', etc.
    let dateFilter = {};
    const now = new Date();
    
    if (filter === "today") {
      const todayStr = now.toISOString().split('T')[0];
      dateFilter = { [Op.between]: [`${todayStr} 00:00:00`, `${todayStr} 23:59:59`] };
    } else if (filter === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      dateFilter = { [Op.gte]: `${firstDay} 00:00:00` };
    } else if (filter === "this_year") {
      const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      dateFilter = { [Op.gte]: `${firstDay} 00:00:00` };
    } else {
      // Default to roughly last 3 months
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      dateFilter = { [Op.gte]: ninetyDaysAgo };
    }

    const bills = await Bill.findAll({
      where: {
        createdAt: dateFilter
      }
    });

    const allItems = await Item.findAll();
    const itemMaster = {};
    allItems.forEach(i => {
      itemMaster[`${i.name}-${i.batch || ''}`] = i;
      if (!itemMaster[i.name]) itemMaster[i.name] = i; 
    });

    // Accumulators
    let totalRevenue = 0, totalProductCost = 0;
    const invoiceWise = [], productWise = {}, customerWise = {}, batchWise = {}, supplierWise = {};
    
    // AI Insights arrays
    const fastMovers = [], deadStock = [];

    bills.forEach(bill => {
      let billCost = 0, billRevenue = 0;

      (bill.items || []).forEach(row => {
        const qty = parseInt(row.qty) || 0;
        const rate = parseFloat(row.selling_price || row.rate || row.mrp || 0);
        const discount = parseFloat(row.discount || 0);
        const netRate = rate - (rate * discount / 100);
        const revenue = netRate * qty;
        
        let masterItem = itemMaster[`${row.name}-${row.batch || ''}`] || itemMaster[row.name];
        let costPrice = row.cost_price || (masterItem ? masterItem.cost_price : 0);
        const cost = costPrice * qty;

        billRevenue += revenue;
        billCost += cost;

        // --- Product Level ---
        if (!productWise[row.name]) productWise[row.name] = { name: row.name, revenue: 0, cost: 0, qty: 0, stock: masterItem ? masterItem.stock_qty : 0 };
        productWise[row.name].revenue += revenue;
        productWise[row.name].cost += cost;
        productWise[row.name].qty += qty;

        // --- Batch Level (Phase 3) ---
        const batchKey = `${row.name}-${row.batch}`;
        if (!batchWise[batchKey]) batchWise[batchKey] = { item: row.name, batch: row.batch, revenue: 0, cost: 0 };
        batchWise[batchKey].revenue += revenue;
        batchWise[batchKey].cost += cost;

        // --- Supplier Level (Phase 8) ---
        // Assuming item company maps to supplier for demonstration, or if we had supplierId
        const suppName = masterItem ? masterItem.company : "Unknown";
        if (!supplierWise[suppName]) supplierWise[suppName] = { name: suppName, revenue: 0, profit: 0, purchaseValue: cost };
        supplierWise[suppName].revenue += revenue;
        supplierWise[suppName].purchaseValue += cost;
      });

      const grossProfit = billRevenue - billCost;
      
      // True Profit Deductions (Phase 2)
      const opsCost = billRevenue * Object.values(OVERHEADS).reduce((a, b) => a + b, 0);
      const netProfit = grossProfit - opsCost;

      totalRevenue += billRevenue;
      totalProductCost += billCost;

      invoiceWise.push({
        billNo: bill.billNo,
        date: bill.createdAt,
        customerName: bill.customerName,
        revenue: billRevenue,
        grossProfit,
        netProfit,
        marginPct: billRevenue > 0 ? (netProfit / billRevenue) * 100 : 0
      });

      // --- Customer Level (Phase 5) ---
      if (!customerWise[bill.customerName]) customerWise[bill.customerName] = { name: bill.customerName, revenue: 0, grossProfit: 0, netProfit: 0, outstanding: 0 };
      customerWise[bill.customerName].revenue += billRevenue;
      customerWise[bill.customerName].grossProfit += grossProfit;
      customerWise[bill.customerName].netProfit += netProfit;
      if (bill.status !== "paid") customerWise[bill.customerName].outstanding += bill.total;
    });

    const totalOpsCost = totalRevenue * Object.values(OVERHEADS).reduce((a, b) => a + b, 0);
    const totalGrossProfit = totalRevenue - totalProductCost;
    const totalNetProfit = totalGrossProfit - totalOpsCost;
    const netMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
    const grossMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

    // Post-Process Products (Phase 4)
    const products = Object.values(productWise).map(p => {
      const gross = p.revenue - p.cost;
      const net = gross - (p.revenue * 0.06); // Approx 6% overhead
      return {
        ...p,
        netProfit: net,
        marginPct: p.revenue > 0 ? (net / p.revenue) * 100 : 0,
        roi: p.stock > 0 ? (net / (p.stock * (p.cost/p.qty || 1))) * 100 : 0
      };
    }).sort((a, b) => b.netProfit - a.netProfit);

    // AI Classification (Fast Movers vs Dead Stock)
    products.forEach(p => {
      if (p.qty > 500 && p.marginPct > 10) fastMovers.push(p.name);
      if (p.qty < 50 && p.stock > 1000) deadStock.push(p.name);
    });

    // Post-Process Customers (Phase 5)
    const customers = Object.values(customerWise).map(c => {
      const margin = c.revenue > 0 ? (c.netProfit / c.revenue) * 100 : 0;
      let aiClass = "C";
      if (margin > 15 && c.revenue > 50000) aiClass = "A";
      else if (margin > 5 && c.revenue > 10000) aiClass = "B";
      return { ...c, marginPct: margin, aiClass };
    }).sort((a, b) => b.netProfit - a.netProfit);

    // Expiry Impact (Phase 13)
    let expiryLossPotential = 0;
    const nearExpiry = [];
    allItems.forEach(i => {
      if (i.expiry) {
        const expDate = new Date(i.expiry);
        const daysLeft = (expDate - now) / (1000 * 60 * 60 * 24);
        if (daysLeft < 0) {
          expiryLossPotential += (i.stock_qty * (i.cost_price || 0));
        } else if (daysLeft < 90) {
          nearExpiry.push({ name: i.name, batch: i.batch, daysLeft: Math.round(daysLeft), riskValue: i.stock_qty * (i.cost_price||0) });
        }
      }
    });

    // Forecasting (Phase 12 - Extremely basic linear extrapolation for demo)
    const forecast = {
      days7: { revenue: (totalRevenue / 90) * 7, profit: (totalNetProfit / 90) * 7 },
      days30: { revenue: (totalRevenue / 90) * 30, profit: (totalNetProfit / 90) * 30 },
      days90: { revenue: totalRevenue, profit: totalNetProfit }
    };

    res.json({
      summary: {
        totalRevenue,
        totalGrossProfit,
        totalNetProfit,
        grossMargin,
        netMargin,
        profitPerInvoice: bills.length > 0 ? totalNetProfit / bills.length : 0,
        profitPerCustomer: customers.length > 0 ? totalNetProfit / customers.length : 0,
        waterfall: {
          revenue: totalRevenue,
          productCost: totalProductCost,
          freight: totalRevenue * OVERHEADS.freight,
          warehouse: totalRevenue * OVERHEADS.warehouse,
          salesman: totalRevenue * OVERHEADS.salesman,
          bankCharges: totalRevenue * OVERHEADS.bankCharges,
          packaging: totalRevenue * OVERHEADS.packaging,
          netProfit: totalNetProfit
        }
      },
      insights: { fastMovers, deadStock, expiryLossPotential, forecast },
      nearExpiry: nearExpiry.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 10),
      topProducts: products.slice(0, 100),
      bottomProducts: products.slice(-100).reverse(),
      customerWise: customers,
      batchWise: Object.values(batchWise).map(b => ({ ...b, profit: b.revenue - b.cost })).sort((a, b) => b.profit - a.profit).slice(0, 50),
      supplierWise: Object.values(supplierWise).map(s => ({ ...s, profit: s.revenue - s.purchaseValue })).sort((a, b) => b.profit - a.profit),
      invoiceWise: invoiceWise.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 100)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/analytics/valuation ─────────────────────────────────────────────
router.get("/valuation", protect, async (req, res) => {
  try {
    const items = await Item.findAll({ where: { stock_qty: { [Op.gt]: 0 } } });
    let totalValue = 0;
    const valuationList = items.map(item => {
      const rate = item.cost_price || item.mrp || 0;
      const val = rate * item.stock_qty;
      totalValue += val;
      return { id: item.id, name: item.name, batch: item.batch, qty: item.stock_qty, rate, value: val };
    }).sort((a, b) => b.value - a.value);

    res.json({ totalClosingStockValue: totalValue, items: valuationList });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/analytics/copilot ──────────────────────────────────────────────
router.post("/copilot", protect, async (req, res) => {
  // Phase 11 Mock AI response
  const { query } = req.body;
  if (query.toLowerCase().includes("loss")) {
    res.json({ answer: "Losses are primarily driven by expired inventory in the current batch. ₹2,400 of Schedule X drugs expired recently.", action: "Liquidate near-expiry stock." });
  } else {
    res.json({ answer: "Your A-class customers are driving 80% of net margin. Apollo Pharmacy Branch 14 is the top contributor.", action: "Increase credit limits for A-class customers." });
  }
});

module.exports = router;
