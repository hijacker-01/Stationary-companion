const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Payment = require("../models/Payment");
const Bill = require("../models/Bill");
const { protect } = require("../middleware/auth");
const { Op } = require("sequelize");

// ── CUSTOMERS ──
router.get("/", protect, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', includeInactive = 'false' } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (includeInactive !== 'true') where.isActive = true;

    const customers = await Customer.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]]
    });
    
    res.json({
      data: customers.rows,
      total: customers.count,
      page: parseInt(page),
      totalPages: Math.ceil(customers.count / limit)
    });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post("/", protect, async (req, res) => {
  try {
    const c = await Customer.create(req.body);
    res.json(c);
  } catch(err) { res.status(400).json({ error: err.message }); }
});

router.put("/:id", protect, async (req, res) => {
  try {
    await Customer.update(req.body, { where: { id: req.params.id } });
    res.json({ message: "Customer updated" });
  } catch(err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    // Check if customer has any bills before allowing hard delete
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const billCount = await Bill.count({ where: { customerName: customer.name } });
    if (billCount > 0) {
      return res.status(400).json({
        error: "Cannot delete customer",
        message: `This customer has ${billCount} invoice(s) on record. Deleting them would corrupt your financial history.`,
        suggestion: "Deactivate the customer instead to hide them from dropdowns while preserving all records."
      });
    }

    await Customer.destroy({ where: { id: req.params.id } });
    res.json({ message: "Customer deleted" });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.patch("/:id/deactivate", protect, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    
    await customer.update({ isActive: false });
    res.json({ message: "Customer deactivated" });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.patch("/:id/activate", protect, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    
    await customer.update({ isActive: true });
    res.json({ message: "Customer reactivated" });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// ── LEDGER ──
router.get("/:id/ledger", protect, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const bills = await Bill.findAll({
      where: { customerName: customer.name },
      order: [["createdAt","ASC"]],
    });

    const payments = await Payment.findAll({
      where: { type: "customer", partyId: req.params.id },
      order: [["createdAt","ASC"]],
    });

    // Build ledger entries
    const entries = [];
    let runningBalance = customer.openingBalance || 0;

    if (customer.openingBalance) {
      entries.push({
        date: customer.createdAt,
        type: "Opening Balance",
        ref: "—",
        debit: customer.openingBalance,
        credit: 0,
        balance: runningBalance,
      });
    }

    // Merge bills and payments by date
    const allEvents = [
      ...bills.map(b => ({ date: b.createdAt, type: "bill", data: b })),
      ...payments.map(p => ({ date: p.createdAt, type: "payment", data: p })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    allEvents.forEach(ev => {
      if (ev.type === "bill") {
        runningBalance += ev.data.total;
        entries.push({
          date: ev.data.createdAt,
          type: "Invoice",
          ref: ev.data.billNo,
          debit: ev.data.total,
          credit: 0,
          balance: runningBalance,
        });
      } else {
        runningBalance -= ev.data.amount;
        entries.push({
          date: ev.data.createdAt,
          type: "Payment",
          ref: ev.data.reference || "—",
          debit: 0,
          credit: ev.data.amount,
          balance: runningBalance,
        });
      }
    });

    res.json({ customer, entries, finalBalance: runningBalance });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// ── PAYMENTS ──
router.post("/:id/payment", protect, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const sequelize = require("../config/db");
    const t = await sequelize.transaction();
    try {
      const payment = await Payment.create({
        type: "customer",
        partyId: req.params.id,
        partyName: customer.name,
        direction: "in",
        ...req.body,
      }, { transaction: t });

      // Update customer balance
      await customer.decrement("balance", { by: req.body.amount, transaction: t });
      await customer.increment("totalPaid", { by: req.body.amount, transaction: t });
      
      await t.commit();
      res.json(payment);
    } catch(err) {
      await t.rollback();
      throw err;
    }
  } catch(err) { res.status(400).json({ error: err.message }); }
});

// Supplier payments
router.post("/supplier/:id/payment", protect, async (req, res) => {
  try {
    const { Supplier } = require("../models/Supplier") || await import("../models/Supplier.js");
    const sequelize = require("../config/db");
    const t = await sequelize.transaction();
    try {
      const payment = await Payment.create({
        type: "supplier",
        partyId: req.params.id,
        direction: "out",
        ...req.body,
      }, { transaction: t });
      
      const supplier = await Supplier.findByPk(req.params.id, { transaction: t });
      if (supplier) {
        await supplier.decrement("balance", { by: req.body.amount, transaction: t });
        await supplier.increment("totalPaid", { by: req.body.amount, transaction: t });
      }

      await t.commit();
      res.json(payment);
    } catch(err) {
      await t.rollback();
      throw err;
    }
  } catch(err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;