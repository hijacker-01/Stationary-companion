const express = require("express");
const router = express.Router();
const Supplier = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");
const Item = require("../models/Item");
const { protect } = require("../middleware/auth");

const genPO = () => {
  const now = new Date();
  return `PO-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${Math.floor(1000+Math.random()*9000)}`;
};

// ── SUPPLIERS ──
router.get("/", protect, async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({ order: [["createdAt","DESC"]] });
    res.json(suppliers);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post("/", protect, async (req, res) => {
  try {
    const s = await Supplier.create(req.body);
    res.json(s);
  } catch(err) { res.status(400).json({ error: err.message }); }
});

router.put("/:id", protect, async (req, res) => {
  try {
    await Supplier.update(req.body, { where: { id: req.params.id } });
    res.json({ message: "Supplier updated" });
  } catch(err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    await Supplier.destroy({ where: { id: req.params.id } });
    res.json({ message: "Supplier deleted" });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// ── PURCHASE ORDERS ──
router.get("/orders", protect, async (req, res) => {
  try {
    const orders = await PurchaseOrder.findAll({ order: [["createdAt","DESC"]] });
    res.json(orders);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.get("/orders/:id", protect, async (req, res) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post("/orders", protect, async (req, res) => {
  try {
    const order = await PurchaseOrder.create({ ...req.body, poNumber: genPO() });
    // Update supplier balance
    if (order.paymentMode === "credit") {
      await Supplier.increment("balance", { by: order.total, where: { id: order.supplierId } });
    }
    res.json(order);
  } catch(err) { res.status(400).json({ error: err.message }); }
});

// Mark as received — add items to inventory
router.put("/orders/:id/receive", protect, async (req, res) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Add each item to inventory
    for (const item of order.items || []) {
      const existing = await Item.findOne({ where: { name: item.name, batch: item.batch || null } });
      if (existing) {
        await existing.increment("stock_qty", { by: parseInt(item.qty || 1) });
        if (item.schemeQty) {
          await existing.increment("scheme_qty", { by: parseInt(item.schemeQty || 0) });
        }
      } else {
        await Item.create({
          name:      item.name,
          batch:     item.batch || "",
          category:  item.category || "",
          hsn:       item.hsn || "",
          pack:      item.pack || "",
          stock_qty:       parseInt(item.qty || 1),
          scheme_qty: parseInt(item.schemeQty || 0),
          unit:      item.unit || "units",
          expiry:    item.expiry || null,
          mrp:       item.mrp || 0,
          selling_price: item.selling_price || item.mrp || 0,
          cost_price: item.costPrice || 0,
        });
      }
    }

    await order.update({
      status: "received",
      receivedDate: new Date(),
      amountPaid: req.body.amountPaid || 0,
      balanceDue: order.total - (req.body.amountPaid || 0),
    });

    res.json({ message: "Order received and inventory updated" });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.put("/orders/:id", protect, async (req, res) => {
  try {
    await PurchaseOrder.update(req.body, { where: { id: req.params.id } });
    res.json({ message: "Order updated" });
  } catch(err) { res.status(400).json({ error: err.message }); }
});

router.delete("/orders/:id", protect, async (req, res) => {
  try {
    await PurchaseOrder.destroy({ where: { id: req.params.id } });
    res.json({ message: "Order deleted" });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;