const express  = require("express");
const router   = express.Router();
const { Op }   = require("sequelize");
const Customer = require("../models/Customer");
const Bill     = require("../models/Bill");
const Payment  = require("../models/Payment");
const { protect } = require("../middleware/auth");
const { branchWhere } = require("../middleware/branchScope");

// ── GET /api/debtors ─────────────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const customers = await Customer.findAll({
      where: branchWhere(req, { balance: { [Op.gt]: 0 } }),
      order: [["balance", "DESC"]],
    });

    const now = new Date();
    const result = [];

    for (const cust of customers) {
      // Get unpaid/partial bills for aging
      const unpaidBills = await Bill.findAll({
        where: branchWhere(req, {
          customerName: cust.name,
          status: { [Op.in]: ["unpaid", "partial"] },
        }),
        order: [["createdAt", "ASC"]],
      });

      let aging = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
      unpaidBills.forEach(bill => {
        const days = Math.floor((now - new Date(bill.createdAt)) / (1000 * 60 * 60 * 24));
        const amt = bill.total;
        if (days <= 30)      aging["0-30"]  += amt;
        else if (days <= 60) aging["31-60"] += amt;
        else if (days <= 90) aging["61-90"] += amt;
        else                 aging["90+"]   += amt;
      });

      // Get last payment date
      const lastPayment = await Payment.findOne({
        where: branchWhere(req, { partyName: cust.name, direction: "in" }),
        order: [["createdAt", "DESC"]],
      });

      result.push({
        id: cust.id,
        name: cust.name,
        phone: cust.phone,
        totalOutstanding: cust.balance,
        totalPurchased: cust.totalPurchased,
        creditLimit: cust.creditLimit,
        creditDays: cust.creditDays,
        aging,
        lastPaymentDate: lastPayment ? lastPayment.createdAt : null,
        unpaidBillsCount: unpaidBills.length,
      });
    }

    const totalReceivable = result.reduce((s, r) => s + r.totalOutstanding, 0);
    const totalOverdue = result.reduce((s, r) => s + r.aging["31-60"] + r.aging["61-90"] + r.aging["90+"], 0);

    res.json({ totalReceivable, totalOverdue, debtors: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
