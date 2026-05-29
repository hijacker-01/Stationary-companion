const express  = require("express");
const router   = express.Router();
const { Op }   = require("sequelize");
const Supplier      = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");
const Payment       = require("../models/Payment");
const { protect }   = require("../middleware/auth");

// ── GET /api/creditors ───────────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({
      where: { balance: { [Op.gt]: 0 }, status: "active" },
      order: [["balance", "DESC"]],
    });

    const now = new Date();
    const result = [];

    for (const sup of suppliers) {
      // Get purchase orders for aging (those with outstanding balance implied)
      const purchases = await PurchaseOrder.findAll({
        where: { supplierName: sup.name },
        order: [["createdAt", "ASC"]],
      });

      let aging = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
      // Simple aging based on purchase dates vs current balance
      let remaining = sup.balance;
      for (const po of purchases) {
        if (remaining <= 0) break;
        const days = Math.floor((now - new Date(po.createdAt)) / (1000 * 60 * 60 * 24));
        const amt = Math.min(po.total, remaining);
        if (days <= 30)      aging["0-30"]  += amt;
        else if (days <= 60) aging["31-60"] += amt;
        else if (days <= 90) aging["61-90"] += amt;
        else                 aging["90+"]   += amt;
        remaining -= amt;
      }

      // Get last payment date
      const lastPayment = await Payment.findOne({
        where: { partyName: sup.name, direction: "out" },
        order: [["createdAt", "DESC"]],
      });

      result.push({
        id: sup.id,
        name: sup.name,
        phone: sup.phone,
        totalOutstanding: sup.balance,
        creditLimit: sup.creditLimit,
        creditDays: sup.creditDays,
        aging,
        lastPaymentDate: lastPayment ? lastPayment.createdAt : null,
      });
    }

    const totalPayable = result.reduce((s, r) => s + r.totalOutstanding, 0);
    const totalOverdue = result.reduce((s, r) => s + r.aging["31-60"] + r.aging["61-90"] + r.aging["90+"], 0);

    res.json({ totalPayable, totalOverdue, creditors: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
