const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill");
const Item = require("../models/Item");
const Customer = require("../models/Customer");
const AuditLog = require("../models/AuditLog");
const sequelize = require("../config/db");
const { Op } = require("sequelize");
const accounting = require("../services/accounting");
const stockMovement = require("../services/stockMovement");
const idempotency = require("../middleware/idempotency");
const { protect, requirePermission } = require("../middleware/auth");
const ComplianceEngine = require("../services/ComplianceEngine");

// Generate sequential bill number per financial year (e.g. INV-2526-0001)
const generateBillNo = async (transaction) => {
  const now = new Date();
  // Indian financial year: Apr-Mar
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyEnd   = fyStart + 1;
  const fyCode  = `${String(fyStart).slice(-2)}${String(fyEnd).slice(-2)}`; // e.g. "2526"
  const prefix  = `INV-${fyCode}-`;

  // Find the last bill in this financial year
  const last = await Bill.findOne({
    where: { billNo: { [require('sequelize').Op.like]: `${prefix}%` } },
    order: [["createdAt", "DESC"]],
    transaction,
  });

  let nextNum = 1;
  if (last && last.billNo) {
    const parts = last.billNo.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, "0")}`;
};

// Get all bills
router.get("/", protect, async (req, res) => {
  try {
    const bills = await Bill.findAll({ order: [["createdAt", "DESC"]] });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single bill
router.get("/:id", protect, async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ error: "Bill not found" });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create bill — also deducts inventory quantities & auto-adds customer
router.post("/", protect, requirePermission("billing.create"), idempotency, async (req, res) => {
  const billedItems = (req.body.items || []).filter(r => r.name);
  
  // Enterprise Compliance Engine Evaluation
  try {
    const complianceResult = await ComplianceEngine.evaluateTransaction({
      module: "Sales",
      user: req.user ? req.user.id : null,
      items: billedItems,
      total: req.body.total,
      customer: { name: req.body.customerName },
      hasPrescription: !!req.body.prescriptionRef
    });

    if (!complianceResult.allowed) {
      return res.status(403).json({ 
        error: "Transaction BLOCKED by Compliance Engine", 
        alerts: complianceResult.alerts 
      });
    }
  } catch (err) {
    console.error("Compliance evaluation error:", err);
  }

  const t = await sequelize.transaction();
  try {
    const itemKeys = billedItems.map(item => ({ name: item.name, batch: item.batch || "" }));
    
    // Fetch all items in a single query with locking
    const items = await Item.findAll({ 
      where: {
        [Op.or]: itemKeys
      }, 
      transaction: t, 
      lock: t.LOCK.UPDATE 
    });

    const itemsMap = new Map();
    items.forEach(item => itemsMap.set(`${item.name}|${item.batch}`, item));

    // Validate stock availability and compute new quantities
    for (const billedItem of billedItems) {
      const item = itemsMap.get(`${billedItem.name}|${billedItem.batch || ""}`);
      if (!item) {
        await t.rollback();
        return res.status(400).json({ error: `Item "${billedItem.name}" not found in inventory` });
      }
      const billedQty = parseInt(billedItem.qty) || 0;
      const billedSchemeQty = parseInt(billedItem.schemeQty) || 0;
      const totalToDeduct = billedQty + billedSchemeQty;
      
      const totalAvailable = item.stock_qty + item.scheme_qty;
      
      if (totalAvailable < totalToDeduct) {
        await t.rollback();
        return res.status(400).json({
          error: `Insufficient total stock for "${billedItem.name}". Available: ${totalAvailable}, Requested: ${totalToDeduct}`
        });
      }
      
      let remainingToDeduct = totalToDeduct;
      let newQty = item.stock_qty;
      let newSchemeQty = item.scheme_qty;
      
      // Consume normal stock first
      if (newQty >= remainingToDeduct) {
        newQty -= remainingToDeduct;
        remainingToDeduct = 0;
      } else {
        remainingToDeduct -= newQty;
        newQty = 0;
        // Consume remainder from scheme stock
        newSchemeQty -= remainingToDeduct;
      }
      
      await item.update({ 
        stock_qty: newQty,
        scheme_qty: newSchemeQty
      }, { transaction: t });

      // Record stock movement (Audit trail)
      await stockMovement.recordOut(item, totalToDeduct, "sale", null, req.user ? req.user.id : null, `Bill creation`, t);
    }

    // Auto-add or update customer first so we have the ID
    let customerId = null;
    if (req.body.customerName) {
      let customer = await Customer.findOne({
        where: { name: req.body.customerName },
        transaction: t,
      });
      if (!customer) {
        customer = await Customer.create({
          name: req.body.customerName,
          phone: req.body.customerPhone || "",
          address: req.body.customerAddress || "",
          dlNumber: req.body.customerDl || "",
          gstNumber: req.body.customerGst || "",
        }, { transaction: t });
      } else {
        const updates = {};
        if (req.body.customerPhone && !customer.phone) updates.phone = req.body.customerPhone;
        if (req.body.customerAddress && !customer.address) updates.address = req.body.customerAddress;
        if (req.body.customerDl && !customer.dlNumber) updates.dlNumber = req.body.customerDl;
        if (req.body.customerGst && !customer.gstNumber) updates.gstNumber = req.body.customerGst;
        if (Object.keys(updates).length) await customer.update(updates, { transaction: t });
      }
      
      customerId = customer.id;
      
      await customer.increment("totalPurchased", { by: req.body.total, transaction: t });
      if (req.body.status === "unpaid") {
        await customer.increment("balance", { by: req.body.total, transaction: t });
      } else if (req.body.status === "partial") {
        await customer.increment("balance", { by: req.body.total / 2, transaction: t });
      }
    }

    const bill = await Bill.create({
      ...req.body,
      customerId,
      billNo: await generateBillNo(t),
    }, { transaction: t });

    // Auto-create double-entry journal for sales
    await accounting.postSalesJournal(bill, t);

    // Update stock movement reference IDs
    await sequelize.models.StockMovement.update(
      { referenceId: bill.id },
      { where: { referenceType: "sale", referenceId: null }, transaction: t }
    );

    // Audit log
    await AuditLog.create({
      userId: req.user ? req.user.id : null,
      action: "create",
      entityType: "Bill",
      entityId: bill.id,
      newValues: bill.toJSON()
    }, { transaction: t });

    await t.commit();
    res.json(bill);
  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
});

// Delete bill — restores inventory quantities
router.delete("/:id", protect, requirePermission("billing.create"), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const bill = await Bill.findByPk(req.params.id, { transaction: t });
    if (!bill) {
      await t.rollback();
      return res.status(404).json({ error: "Bill not found" });
    }

    // Restore stock for each item in the deleted bill
    const billedItems = (bill.items || []).filter(r => r.name);
    for (const billedItem of billedItems) {
      const item = await Item.findOne({ where: { name: billedItem.name, batch: billedItem.batch || "" }, transaction: t });
      if (item) {
        const qtyToRestore = (parseInt(billedItem.qty) || 0) + (parseInt(billedItem.schemeQty) || 0);
        await item.update({ 
          stock_qty: item.stock_qty + qtyToRestore
        }, { transaction: t });
        
        await stockMovement.recordIn(item, qtyToRestore, "sale", bill.id, req.user ? req.user.id : null, "Bill deletion restore", t);
      }
    }

    await bill.destroy({ transaction: t });
    
    // Audit log
    await AuditLog.create({
      userId: req.user ? req.user.id : null,
      action: "delete",
      entityType: "Bill",
      entityId: bill.id,
      oldValues: bill.toJSON()
    }, { transaction: t });
    await t.commit();
    res.json({ message: "Bill deleted and stock restored" });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;