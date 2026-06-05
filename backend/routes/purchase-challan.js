const express  = require("express");
const router   = express.Router();
const { Op }   = require("sequelize");
const sequelize = require("../config/db");
const PurchaseChallan = require("../models/PurchaseChallan");
const PurchaseOrder   = require("../models/PurchaseOrder");
const Item            = require("../models/Item");
const AuditLog        = require("../models/AuditLog");
const stockMovement   = require("../services/stockMovement");
const accounting      = require("../services/accounting");
const { protect }     = require("../middleware/auth");

// ── Generate challan number ──────────────────────────────────────────────────
const generateChallanNo = async (transaction) => {
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyEnd = fyStart + 1;
  const prefix = `PCH-${String(fyStart).slice(-2)}${String(fyEnd).slice(-2)}-`;
  const last = await PurchaseChallan.findOne({
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

// ── GET all challans ─────────────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.supplierId) where.supplierId = req.query.supplierId;
    if (req.query.from && req.query.to) {
      where.date = { [Op.between]: [req.query.from, req.query.to] };
    }
    const challans = await PurchaseChallan.findAll({ where, order: [["createdAt", "DESC"]] });
    res.json(challans);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET single challan ───────────────────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const c = await PurchaseChallan.findByPk(req.params.id);
    if (!c) return res.status(404).json({ error: "Challan not found" });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST create challan (draft) ──────────────────────────────────────────────
router.post("/", protect, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const challan = await PurchaseChallan.create({
      ...req.body,
      challanNo: await generateChallanNo(t),
      status: "draft",
      userId: req.user ? req.user.id : null,
    }, { transaction: t, lock: t.LOCK.UPDATE });

    const items = req.body.items || [];
    for (const row of items) {
      if (!row.name) continue;
      let item = await Item.findOne({ where: { name: row.name, batch: row.batch || "" }, transaction: t, lock: t.LOCK.UPDATE });
      if (item) {
        await item.update({ stock_qty: item.stock_qty + (parseInt(row.qty) || 0) }, { transaction: t, lock: t.LOCK.UPDATE });
      } else {
        item = await Item.create({
          name: row.name, batch: row.batch || "", expiry: row.expiry || null,
          mrp: row.mrp || 0, cost_price: row.rate || 0, selling_price: row.mrp || 0,
          stock_qty: parseInt(row.qty) || 0, category: "General", unit: "PCS",
        }, { transaction: t, lock: t.LOCK.UPDATE });
      }
      await stockMovement.recordIn(item, parseInt(row.qty) || 0, "purchase", null, req.user ? req.user.id : null, `Challan ${challan.challanNo} created`, t);
    }

    await AuditLog.create({
      userId: req.user ? req.user.id : null, action: "create",
      entityType: "PurchaseChallan", entityId: challan.id,
      newValues: challan.toJSON(),
    }, { transaction: t, lock: t.LOCK.UPDATE });

    await t.commit();
    res.status(201).json(challan);
  } catch (err) { await t.rollback(); res.status(400).json({ error: err.message }); }
});

// ── PUT update challan ───────────────────────────────────────────────────────
router.put("/:id", protect, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const challan = await PurchaseChallan.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!challan) { await t.rollback(); return res.status(404).json({ error: "Not found" }); }
    if (challan.status === "converted") { await t.rollback(); return res.status(400).json({ error: "Cannot edit a converted challan" }); }
    const old = challan.toJSON();
    await challan.update(req.body, { transaction: t, lock: t.LOCK.UPDATE });
    await AuditLog.create({
      userId: req.user ? req.user.id : null, action: "update",
      entityType: "PurchaseChallan", entityId: challan.id,
      oldValues: old, newValues: challan.toJSON(),
    }, { transaction: t, lock: t.LOCK.UPDATE });
    await t.commit();
    res.json(challan);
  } catch (err) { await t.rollback(); res.status(400).json({ error: err.message }); }
});

// ── POST approve challan ─────────────────────────────────────────────────────
router.post("/:id/approve", protect, async (req, res) => {
  try {
    const challan = await PurchaseChallan.findByPk(req.params.id);
    if (!challan) return res.status(404).json({ error: "Not found" });
    if (challan.status !== "draft" && challan.status !== "pending") {
      return res.status(400).json({ error: "Only draft/pending challans can be approved" });
    }
    await challan.update({ status: "approved" });
    res.json(challan);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── POST convert challan → Purchase Bill ─────────────────────────────────────
router.post("/:id/convert", protect, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const challan = await PurchaseChallan.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!challan) { await t.rollback(); return res.status(404).json({ error: "Not found" }); }
    if (challan.status !== "approved") { await t.rollback(); return res.status(400).json({ error: "Only approved challans can be converted" }); }

    const invoiceNo = req.body.invoiceNo || challan.challanNo;
    const items = challan.items || [];

    // Auto-add/update supplier
    let supplierId = challan.supplierId;
    if (challan.supplierName) {
      const Supplier = require('../models/Supplier');
      let supplier = await Supplier.findOne({ where: { name: challan.supplierName }, transaction: t, lock: t.LOCK.UPDATE });
      if (!supplier) {
        supplier = await Supplier.create({
          name: challan.supplierName, phone: challan.supplierPhone || "",
          gstNumber: challan.supplierGst || "", dlNumber: challan.supplierDl || "",
        }, { transaction: t, lock: t.LOCK.UPDATE });
      }
      supplierId = supplier.id;
    }

    // Create PurchaseOrder (bill)
    const po = await PurchaseOrder.create({
      poNumber: invoiceNo || `PO-CONV-${Date.now()}`,
      supplierName: challan.supplierName,
      supplierId: supplierId || 1, // Fallback if still null
      items,
      subtotal: challan.subtotal,
      gstAmount: challan.gstAmount,
      total: challan.total,
      status: "received",
      notes: challan.notes,
    }, { transaction: t, lock: t.LOCK.UPDATE });

    // Post accounting journal
    await accounting.postPurchaseJournal(po, t);

    // Mark challan as converted
    await challan.update({
      status: "converted", convertedAt: new Date(),
      purchaseOrderId: po.id, invoiceNo,
    }, { transaction: t, lock: t.LOCK.UPDATE });

    await AuditLog.create({
      userId: req.user ? req.user.id : null, action: "convert",
      entityType: "PurchaseChallan", entityId: challan.id,
      newValues: { purchaseOrderId: po.id, invoiceNo },
    }, { transaction: t, lock: t.LOCK.UPDATE });

    await t.commit();
    res.json({ message: "Challan converted to Purchase Bill", challan, purchaseOrder: po });
  } catch (err) { await t.rollback(); res.status(400).json({ error: err.message }); }
});

// ── DELETE challan ───────────────────────────────────────────────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    const challan = await PurchaseChallan.findByPk(req.params.id);
    if (!challan) return res.status(404).json({ error: "Not found" });
    if (challan.status === "converted") return res.status(400).json({ error: "Cannot delete converted challan" });
    
    const t = await sequelize.transaction();
    try {
      const items = challan.items || [];
      for (const row of items) {
        if (!row.name) continue;
        const item = await Item.findOne({ where: { name: row.name, batch: row.batch || "" }, transaction: t, lock: t.LOCK.UPDATE });
        if (item) {
          const qty = parseInt(row.qty) || 0;
          if (item.stock_qty >= qty) {
            await item.update({ stock_qty: item.stock_qty - qty }, { transaction: t, lock: t.LOCK.UPDATE });
            await stockMovement.recordOut(item, qty, "purchase", null, req.user ? req.user.id : null, `Challan ${challan.challanNo} deleted`, t);
          }
        }
      }
      await challan.destroy({ transaction: t, lock: t.LOCK.UPDATE });
      await t.commit();
      res.json({ message: "Challan deleted and stock restored" });
    } catch(err) {
      await t.rollback();
      throw err;
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
