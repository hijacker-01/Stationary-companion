const express  = require("express");
const router   = express.Router();
const { Op }   = require("sequelize");
const Bill     = require("../models/Bill");
const Item     = require("../models/Item");
const { protect } = require("../middleware/auth");

// ── GET /api/analytics/profit ────────────────────────────────────────────────
router.get("/profit", protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const from = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const to = endDate || new Date().toISOString().split('T')[0];

    const bills = await Bill.findAll({
      where: {
        createdAt: { [Op.between]: [`${from} 00:00:00`, `${to} 23:59:59`] },
        status: { [Op.ne]: "cancelled" } // assuming we don't count cancelled
      }
    });

    // We'll need item cost prices if not present in the bill
    const allItems = await Item.findAll();
    const itemCostMap = {};
    allItems.forEach(i => {
      itemCostMap[`${i.name}-${i.batch || ''}`] = i.cost_price || 0;
      if (!itemCostMap[i.name]) itemCostMap[i.name] = i.cost_price || 0; // fallback
    });

    let totalRevenue = 0;
    let totalCost = 0;
    const invoiceWise = [];
    const productWise = {};
    const customerWise = {};

    bills.forEach(bill => {
      let billCost = 0;
      let billRevenue = 0;

      (bill.items || []).forEach(row => {
        const qty = parseInt(row.qty) || 0;
        const rate = parseFloat(row.selling_price || row.rate || row.mrp || 0);
        const discount = parseFloat(row.discount || 0);
        const netRate = rate - (rate * discount / 100);
        const revenue = netRate * qty;
        
        let costPrice = row.cost_price;
        if (costPrice === undefined) {
          costPrice = itemCostMap[`${row.name}-${row.batch || ''}`] || itemCostMap[row.name] || 0;
        }
        const cost = costPrice * qty;

        billRevenue += revenue;
        billCost += cost;

        // Aggregate Product
        if (!productWise[row.name]) productWise[row.name] = { revenue: 0, cost: 0, qty: 0 };
        productWise[row.name].revenue += revenue;
        productWise[row.name].cost += cost;
        productWise[row.name].qty += qty;
      });

      const billProfit = billRevenue - billCost;
      totalRevenue += billRevenue;
      totalCost += billCost;

      invoiceWise.push({
        billNo: bill.billNo,
        date: bill.createdAt,
        customerName: bill.customerName,
        revenue: billRevenue,
        cost: billCost,
        profit: billProfit,
        marginPct: billRevenue > 0 ? (billProfit / billRevenue) * 100 : 0
      });

      // Aggregate Customer
      if (!customerWise[bill.customerName]) customerWise[bill.customerName] = { revenue: 0, cost: 0, profit: 0 };
      customerWise[bill.customerName].revenue += billRevenue;
      customerWise[bill.customerName].cost += billCost;
      customerWise[bill.customerName].profit += billProfit;
    });

    const totalProfit = totalRevenue - totalCost;
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Convert objects to arrays and sort by profit DESC
    const products = Object.keys(productWise).map(name => ({
      name,
      qty: productWise[name].qty,
      revenue: productWise[name].revenue,
      cost: productWise[name].cost,
      profit: productWise[name].revenue - productWise[name].cost,
      marginPct: productWise[name].revenue > 0 ? ((productWise[name].revenue - productWise[name].cost) / productWise[name].revenue) * 100 : 0
    })).sort((a, b) => b.profit - a.profit);

    const customers = Object.keys(customerWise).map(name => ({
      name,
      revenue: customerWise[name].revenue,
      cost: customerWise[name].cost,
      profit: customerWise[name].profit,
      marginPct: customerWise[name].revenue > 0 ? (customerWise[name].profit / customerWise[name].revenue) * 100 : 0
    })).sort((a, b) => b.profit - a.profit);

    res.json({
      summary: { totalRevenue, totalCost, totalProfit, overallMargin },
      invoiceWise,
      productWise: products,
      customerWise: customers
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/analytics/valuation ─────────────────────────────────────────────
router.get("/valuation", protect, async (req, res) => {
  try {
    const items = await Item.findAll({
      where: { stock_qty: { [Op.gt]: 0 } }
    });

    let totalValue = 0;
    const valuationList = items.map(item => {
      const rate = item.cost_price || item.mrp || 0;
      const val = rate * item.stock_qty;
      totalValue += val;
      return {
        id: item.id,
        name: item.name,
        batch: item.batch,
        category: item.category,
        qty: item.stock_qty,
        rate: rate,
        value: val
      };
    });

    valuationList.sort((a, b) => b.value - a.value);

    res.json({
      totalClosingStockValue: totalValue,
      items: valuationList
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
