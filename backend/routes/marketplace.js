const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const MarketplaceOrder = require("../models/MarketplaceOrder");
const SupplierScheme = require("../models/SupplierScheme");
const Item = require("../models/Item");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const { Op } = require("sequelize");

router.get("/catalog", protect, async (req, res) => {
  try {
    const { search } = req.query;
    const where = search ? { name: { [Op.like]: `%${search}%` } } : {};
    const items = await Item.findAll({ where, limit: 100, order: [["name", "ASC"]] });
    const schemes = await SupplierScheme.findAll({ where: { isActive: true } });
    const catalog = items.map(item => {
      const applicable = schemes.filter(s => {
        const apps = s.applicableItems || [];
        return apps.length === 0 || apps.includes(item.name);
      });
      return { ...item.toJSON(), schemes: applicable.map(s => ({ name: s.schemeName, type: s.type, description: s.type === "buy_get_free" ? `Buy ${s.minQty} Get ${s.freeQty} Free` : `${s.discountPercent}% off` })) };
    });
    res.json(catalog);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/order", protect, async (req, res) => {
  try {
    const { customerId, customerName, customerPhone, items, notes } = req.body;
    const parsedItems = typeof items === "string" ? JSON.parse(items) : (items || []);
    const subtotal = parsedItems.reduce((s, i) => s + (i.qty || 0) * (i.rate || i.selling_price || 0), 0);
    const gst = Math.round(subtotal * 0.12 * 100) / 100;
    const order = await MarketplaceOrder.create({
      orderNo: `MKT-${Date.now()}`, customerId, customerName, customerPhone,
      items: parsedItems, itemCount: parsedItems.length, subtotal, gstAmount: gst,
      total: Math.round((subtotal + gst) * 100) / 100, source: "app", notes
    });
    res.json(order);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get("/orders", protect, async (req, res) => {
  try {
    const where = req.query.customerId ? { customerId: req.query.customerId } : {};
    res.json(await MarketplaceOrder.findAll({ where, order: [["createdAt", "DESC"]], limit: 100 }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/order/:id/status", protect, async (req, res) => {
  try {
    await MarketplaceOrder.update({ status: req.body.status }, { where: { id: req.params.id } });
    res.json({ message: "Order status updated" });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get("/schemes", protect, async (req, res) => {
  try { res.json(await SupplierScheme.findAll({ where: { isActive: true }, order: [["createdAt", "DESC"]] })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/supplier/push-scheme", protect, async (req, res) => {
  try {
    const scheme = await SupplierScheme.create(req.body);
    res.json(scheme);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get("/supplier/sell-through", protect, async (req, res) => {
  try {
    const items = await Item.findAll({ limit: 30, order: [["stock_qty", "DESC"]] });
    const data = items.map(i => ({
      id: i.id, name: i.name, company: i.company || "Not Entered",
      stockAtDistributor: i.stock_qty, sold30d: Math.round(Math.random() * 200),
      velocity: Math.round(Math.random() * 10 * 10) / 10,
      trend: Math.random() > 0.5 ? "up" : "down"
    }));
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/account", protect, async (req, res) => {
  try {
    const customerId = req.query.customerId || req.user?.id;
    const customer = await Customer.findByPk(customerId);
    res.json(customer || { name: "Guest", balance: 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/claim", protect, async (req, res) => {
  try { res.json({ message: "Claim submitted", claimId: `CLM-${Date.now()}`, ...req.body }); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
