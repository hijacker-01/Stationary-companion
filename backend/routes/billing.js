const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill");
const Item = require("../models/Item");
const Customer = require("../models/Customer");
const sequelize = require("../config/db");

// Generate bill number
const generateBillNo = () => {
  const now = new Date();
  return `INV-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// Get all bills
router.get("/", async (req, res) => {
  try {
    const bills = await Bill.findAll({ order: [["createdAt", "DESC"]] });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single bill
router.get("/:id", async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ error: "Bill not found" });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create bill — also deducts inventory quantities & auto-adds customer
router.post("/", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const billedItems = (req.body.items || []).filter(r => r.name);

    // Validate stock availability and deduct quantities
    for (const billedItem of billedItems) {
      const item = await Item.findOne({ where: { name: billedItem.name, batch: billedItem.batch || "" }, transaction: t });
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
    }

    const bill = await Bill.create({
      ...req.body,
      billNo: generateBillNo(),
    }, { transaction: t });

    // Auto-add or update customer
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
        // Update phone/address/DL/GST if provided and customer had blank values
        const updates = {};
        if (req.body.customerPhone && !customer.phone) updates.phone = req.body.customerPhone;
        if (req.body.customerAddress && !customer.address) updates.address = req.body.customerAddress;
        if (req.body.customerDl && !customer.dlNumber) updates.dlNumber = req.body.customerDl;
        if (req.body.customerGst && !customer.gstNumber) updates.gstNumber = req.body.customerGst;
        if (Object.keys(updates).length) await customer.update(updates, { transaction: t });
      }
      await customer.increment("totalPurchased", { by: bill.total, transaction: t });
      // For unpaid/partial bills, add to customer balance (credit)
      if (req.body.status === "unpaid") {
        await customer.increment("balance", { by: bill.total, transaction: t });
      } else if (req.body.status === "partial") {
        await customer.increment("balance", { by: bill.total / 2, transaction: t });
      }
    }

    await t.commit();
    res.json(bill);
  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
});

// Delete bill — restores inventory quantities
router.delete("/:id", async (req, res) => {
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
        await item.update({ 
          stock_qty: item.stock_qty + (parseInt(billedItem.qty) || 0) + (parseInt(billedItem.schemeQty) || 0)
        }, { transaction: t });
      }
    }

    await bill.destroy({ transaction: t });
    await t.commit();
    res.json({ message: "Bill deleted and stock restored" });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;