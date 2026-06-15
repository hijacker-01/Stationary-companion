const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const sequelize = require("../config/db");
const { Op } = require("sequelize");
const validatePositiveValues = require("../middleware/validatePositiveValues");
const { protect } = require("../middleware/auth");
const { branchWhere } = require("../middleware/branchScope");

// Apply to all voucher routes
router.use(protect);
router.use(validatePositiveValues);

// Helper to generate voucher numbers
const generateVoucherNo = async (req, type, direction, t) => {
  const prefix = direction === "in" ? "RV-" : "PV-";
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyEnd = fyStart + 1;
  const yearPart = `${String(fyStart).slice(-2)}${String(fyEnd).slice(-2)}-`;
  const fullPrefix = `${prefix}${yearPart}`;

  const last = await Payment.findOne({
    where: branchWhere(req, { voucherNo: { [Op.like]: `${fullPrefix}%` } }),
    order: [["createdAt", "DESC"]],
    transaction: t,
  });

  let next = 1;
  if (last?.voucherNo) {
    const parts = last.voucherNo.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) next = lastNum + 1;
  }
  return `${fullPrefix}${String(next).padStart(4, "0")}`;
};

// GET all vouchers
router.get("/", async (req, res) => {
  try {
    const vouchers = await Payment.findAll({ where: branchWhere(req), order: [["createdAt", "DESC"]] });
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single voucher
router.get("/:id", async (req, res) => {
  try {
    const voucher = await Payment.findOne({ where: branchWhere(req, { id: req.params.id }) });
    if (!voucher) return res.status(404).json({ error: "Voucher not found" });
    res.json(voucher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create voucher (Receipt / Payment)
router.post("/", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { type, partyId, partyName, amount, mode, reference, note, direction } = req.body;
    
    if (!type || !partyId || !amount || !direction) {
      await t.rollback();
      return res.status(400).json({ error: "Missing required fields" });
    }

    const amt = parseFloat(amount);

    // Update Customer / Supplier outstanding balance
    if (type === "customer") {
      const cust = await Customer.findOne({ where: branchWhere(req, { id: partyId }), transaction: t });
      if (!cust) {
        await t.rollback();
        return res.status(404).json({ error: "Customer not found" });
      }
      if (direction === "in") {
        // Collect payment from customer: reduces customer's debit balance
        await cust.decrement("balance", { by: amt, transaction: t });
      } else {
        // Refund/payment to customer: increases customer's debit balance
        await cust.increment("balance", { by: amt, transaction: t });
      }
    } else if (type === "supplier") {
      const sup = await Supplier.findOne({ where: branchWhere(req, { id: partyId }), transaction: t });
      if (!sup) {
        await t.rollback();
        return res.status(404).json({ error: "Supplier not found" });
      }
      if (direction === "out") {
        // Pay to supplier: reduces outstanding credit balance
        await sup.decrement("balance", { by: amt, transaction: t });
      } else {
        // Receipt from supplier: increases outstanding credit balance
        await sup.increment("balance", { by: amt, transaction: t });
      }
    }

    const voucherNo = await generateVoucherNo(req, type, direction, t);

    const voucher = await Payment.create({
      type,
      voucherNo,
      partyId,
      partyName,
      amount: amt,
      mode,
      reference,
      note,
      direction,
      branchId: req.user.branchId,
    }, { transaction: t });

    await t.commit();
    res.json(voucher);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// DELETE voucher (cancels/reverses the transaction)
router.delete("/:id", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const voucher = await Payment.findOne({ where: branchWhere(req, { id: req.params.id }), transaction: t });
    if (!voucher) {
      await t.rollback();
      return res.status(404).json({ error: "Voucher not found" });
    }

    const amt = parseFloat(voucher.amount);

    // Reverse balance changes
    if (voucher.type === "customer") {
      const cust = await Customer.findOne({ where: branchWhere(req, { id: voucher.partyId }), transaction: t });
      if (cust) {
        if (voucher.direction === "in") {
          await cust.increment("balance", { by: amt, transaction: t });
        } else {
          await cust.decrement("balance", { by: amt, transaction: t });
        }
      }
    } else if (voucher.type === "supplier") {
      const sup = await Supplier.findOne({ where: branchWhere(req, { id: voucher.partyId }), transaction: t });
      if (sup) {
        if (voucher.direction === "out") {
          await sup.increment("balance", { by: amt, transaction: t });
        } else {
          await sup.decrement("balance", { by: amt, transaction: t });
        }
      }
    }

    await voucher.destroy({ transaction: t });
    await t.commit();
    res.json({ message: "Voucher deleted and account balances reversed successfully" });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
