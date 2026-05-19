const express = require("express");
const router = express.Router();
const JournalVoucher = require("../models/JournalVoucher");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const sequelize = require("../config/db");
const { protect } = require("../middleware/auth");
const { Op } = require("sequelize");

// Helper to update party balance
const updateBalance = async (partyType, partyId, amount, isDebit, t) => {
  // In accounting:
  // Customers (Assets): Debit increases balance, Credit decreases balance.
  // Suppliers (Liabilities): Credit increases balance, Debit decreases balance.
  
  // Wait, in our simple system:
  // Customer.balance = what they owe us.
  // Supplier.balance = what we owe them.
  
  if (partyType === "customer") {
    const cust = await Customer.findByPk(partyId, { transaction: t });
    if (!cust) throw new Error("Customer not found");
    if (isDebit) {
      await cust.increment("balance", { by: amount, transaction: t });
    } else {
      await cust.decrement("balance", { by: amount, transaction: t });
    }
  } else if (partyType === "supplier") {
    const supp = await Supplier.findByPk(partyId, { transaction: t });
    if (!supp) throw new Error("Supplier not found");
    if (isDebit) {
      await supp.decrement("balance", { by: amount, transaction: t });
    } else {
      await supp.increment("balance", { by: amount, transaction: t });
    }
  }
};

// Get all JVs
router.get("/", protect, async (req, res) => {
  try {
    const jvs = await JournalVoucher.findAll({ order: [["date", "DESC"], ["createdAt", "DESC"]] });
    res.json(jvs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create JV
router.post("/", protect, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { date, debitPartyType, debitPartyId, debitPartyName, creditPartyType, creditPartyId, creditPartyName, amount, narration } = req.body;
    
    if (amount <= 0) throw new Error("Amount must be greater than zero");

    // Generate JV No
    const now = new Date();
    const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const prefix = `JV-${String(fyStart).slice(-2)}${String(fyStart + 1).slice(-2)}-`;
    
    const last = await JournalVoucher.findOne({
      where: { jvNo: { [Op.like]: `${prefix}%` } },
      order: [["createdAt", "DESC"]],
      transaction: t,
    });

    let next = 1;
    if (last?.jvNo) {
      const parts = last.jvNo.split("-");
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) next = lastNum + 1;
    }
    const jvNo = `${prefix}${String(next).padStart(4, "0")}`;

    const jv = await JournalVoucher.create({
      jvNo, date, debitPartyType, debitPartyId, debitPartyName, creditPartyType, creditPartyId, creditPartyName, amount, narration
    }, { transaction: t });

    // Update balances
    await updateBalance(debitPartyType, debitPartyId, amount, true, t);
    await updateBalance(creditPartyType, creditPartyId, amount, false, t);

    await t.commit();
    res.json(jv);
  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
});

// Delete JV (Reversal)
router.delete("/:id", protect, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const jv = await JournalVoucher.findByPk(req.params.id, { transaction: t });
    if (!jv) throw new Error("JV not found");

    // Reverse the balances
    await updateBalance(jv.debitPartyType, jv.debitPartyId, jv.amount, false, t);
    await updateBalance(jv.creditPartyType, jv.creditPartyId, jv.amount, true, t);

    await jv.destroy({ transaction: t });
    await t.commit();
    res.json({ message: "Journal Voucher deleted and reversed" });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
