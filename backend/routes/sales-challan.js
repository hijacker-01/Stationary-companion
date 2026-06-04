const express  = require("express");
const router   = express.Router();
const { Op }   = require("sequelize");
const sequelize = require("../config/db");
const SalesChallan = require("../models/SalesChallan");
const Bill         = require("../models/Bill");
const Item         = require("../models/Item");
const Customer     = require("../models/Customer");
const AuditLog     = require("../models/AuditLog");
const stockMovement = require("../services/stockMovement");
const accounting    = require("../services/accounting");
const { protect }   = require("../middleware/auth");

// ── Generate challan number ──────────────────────────────────────────────────
const generateDmNo = async (transaction) => {
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const prefix = `DM-${String(fyStart).slice(-2)}${String(fyStart + 1).slice(-2)}-`;
  const last = await SalesChallan.findOne({
    where: { challanNo: { [Op.like]: `${prefix}%` } },
    order: [["createdAt", "DESC"]], transaction,
  });
  let next = 1;
  if (last && last.challanNo) {
    const n = parseInt(last.challanNo.split("-").pop(), 10);
    if (!isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
};

// ── Generate bill number (same pattern as billing.js) ────────────────────────
const generateBillNo = async (transaction) => {
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const prefix = `INV-${String(fyStart).slice(-2)}${String(fyStart + 1).slice(-2)}-`;
  const last = await Bill.findOne({
    where: { billNo: { [Op.like]: `${prefix}%` } },
    order: [["createdAt", "DESC"]], transaction,
  });
  let next = 1;
  if (last && last.billNo) {
    const n = parseInt(last.billNo.split("-").pop(), 10);
    if (!isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
};

// ── GET all challans ─────────────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.customerId) where.customerId = req.query.customerId;
    if (req.query.from && req.query.to) {
      where.date = { [Op.between]: [req.query.from, req.query.to] };
    }
    const challans = await SalesChallan.findAll({ where, order: [["createdAt", "DESC"]] });
    res.json(challans);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET single challan ───────────────────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const c = await SalesChallan.findByPk(req.params.id);
    if (!c) return res.status(404).json({ error: "Challan not found" });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST create challan (draft) ──────────────────────────────────────────────
router.post("/", protect, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const challan = await SalesChallan.create({
      ...req.body,
      challanNo: await generateDmNo(t),
      status: "draft",
      userId: req.user ? req.user.id : null,
    }, { transaction: t });

    const items = req.body.items || [];
    for (const row of items) {
      if (!row.name) continue;
      const item = await Item.findOne({ where: { name: row.name, batch: row.batch || "" }, transaction: t });
      if (!item) { await t.rollback(); return res.status(400).json({ error: `Item "${row.name}" not found in inventory` }); }
      const qty = parseInt(row.qty) || 0;
      const schemeQty = parseInt(row.schemeQty) || 0;
      const totalRequested = qty + schemeQty;

      if (item.stock_qty < totalRequested) { await t.rollback(); return res.status(400).json({ error: `Insufficient stock for "${row.name}". Available: ${item.stock_qty}` }); }
      await item.update({ stock_qty: item.stock_qty - totalRequested }, { transaction: t });
      
      await stockMovement.recordOut(item, qty, "sale", null, req.user ? req.user.id : null, `DM ${challan.challanNo} created`, t);
      if (schemeQty > 0) {
        await stockMovement.recordOut(item, schemeQty, "sale", null, req.user ? req.user.id : null, `DM ${challan.challanNo} created (Free Scheme)`, t);
      }
    }

    await AuditLog.create({
      userId: req.user ? req.user.id : null, action: "create",
      entityType: "SalesChallan", entityId: challan.id,
      newValues: challan.toJSON(),
    }, { transaction: t });

    await t.commit();
    res.status(201).json(challan);
  } catch (err) { await t.rollback(); res.status(400).json({ error: err.message }); }
});

// ── PUT update challan ───────────────────────────────────────────────────────
router.put("/:id", protect, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const challan = await SalesChallan.findByPk(req.params.id, { transaction: t });
    if (!challan) { await t.rollback(); return res.status(404).json({ error: "Not found" }); }
    if (challan.status === "invoiced") { await t.rollback(); return res.status(400).json({ error: "Cannot edit an invoiced challan" }); }
    const old = challan.toJSON();
    await challan.update(req.body, { transaction: t });
    await AuditLog.create({
      userId: req.user ? req.user.id : null, action: "update",
      entityType: "SalesChallan", entityId: challan.id,
      oldValues: old, newValues: challan.toJSON(),
    }, { transaction: t });
    await t.commit();
    res.json(challan);
  } catch (err) { await t.rollback(); res.status(400).json({ error: err.message }); }
});

// ── POST convert challan → Invoice (Bill) ────────────────────────────────────
router.post("/:id/invoice", protect, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const challan = await SalesChallan.findByPk(req.params.id, { transaction: t });
    if (!challan) { await t.rollback(); return res.status(404).json({ error: "Not found" }); }
    if (challan.status === "invoiced") { await t.rollback(); return res.status(400).json({ error: "Already invoiced" }); }
    if (challan.status === "cancelled") { await t.rollback(); return res.status(400).json({ error: "Cancelled challan cannot be invoiced" }); }

    const items = challan.items || [];

    // Create Bill
    const bill = await Bill.create({
      billNo: await generateBillNo(t),
      customerName: challan.customerName,
      customerPhone: challan.customerPhone,
      customerGst: challan.customerGst,
      customerDl: challan.customerDl,
      items, subtotal: challan.subtotal, gstAmount: challan.gstAmount,
      discount: challan.discount, total: challan.total,
      paymentMode: req.body.paymentMode || "credit",
      status: req.body.status || "unpaid",
    }, { transaction: t });

    // Auto-add/update customer
    if (challan.customerName) {
      let customer = await Customer.findOne({ where: { name: challan.customerName }, transaction: t });
      if (!customer) {
        customer = await Customer.create({
          name: challan.customerName, phone: challan.customerPhone || "",
          gstNumber: challan.customerGst || "", dlNumber: challan.customerDl || "",
        }, { transaction: t });
      }
      await customer.increment("totalPurchased", { by: bill.total, transaction: t });
      if (bill.status === "unpaid") await customer.increment("balance", { by: bill.total, transaction: t });
    }

    // Post accounting journal
    await accounting.postSalesJournal(bill, t);

    // Mark challan as invoiced
    await challan.update({ status: "invoiced", invoicedAt: new Date(), billId: bill.id }, { transaction: t });

    await AuditLog.create({
      userId: req.user ? req.user.id : null, action: "convert",
      entityType: "SalesChallan", entityId: challan.id,
      newValues: { billId: bill.id },
    }, { transaction: t });

    await t.commit();
    res.json({ message: "DM converted to Invoice", challan, bill });
  } catch (err) { await t.rollback(); res.status(400).json({ error: err.message }); }
});

// ── DELETE challan ───────────────────────────────────────────────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    const c = await SalesChallan.findByPk(req.params.id);
    if (!c) return res.status(404).json({ error: "Not found" });
    if (c.status === "invoiced") return res.status(400).json({ error: "Cannot delete invoiced challan" });
    
    const t = await sequelize.transaction();
    try {
      const items = c.items || [];
      for (const row of items) {
        if (!row.name) continue;
        const item = await Item.findOne({ where: { name: row.name, batch: row.batch || "" }, transaction: t });
        if (item) {
          const qty = parseInt(row.qty) || 0;
          const schemeQty = parseInt(row.schemeQty) || 0;
          await item.update({ stock_qty: item.stock_qty + qty + schemeQty }, { transaction: t });
          await stockMovement.recordIn(item, qty + schemeQty, "sale", null, req.user ? req.user.id : null, `DM ${c.challanNo} deleted`, t);
        }
      }
      await c.destroy({ transaction: t });
      await t.commit();
      res.json({ message: "Sales challan deleted and stock restored" });
    } catch(err) {
      await t.rollback();
      throw err;
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
