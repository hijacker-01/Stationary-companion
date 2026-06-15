const express  = require("express");
const router   = express.Router();
const { Op }   = require("sequelize");
const Payment  = require("../models/Payment");
const Bill     = require("../models/Bill");
const { protect } = require("../middleware/auth");
const { branchWhere } = require("../middleware/branchScope");

// ── GET /api/cashbook?startDate=&endDate= ────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date().toISOString().slice(0, 10);
    const from  = startDate || today;
    const to    = endDate   || today;

    // Fetch all cash/bank transactions in range
    const payments = await Payment.findAll({
      where: branchWhere(req, { createdAt: { [Op.between]: [`${from} 00:00:00`, `${to} 23:59:59`] } }),
      order: [["createdAt", "ASC"]],
    });

    // Fetch cash sales in range
    const cashSales = await Bill.findAll({
      where: branchWhere(req, {
        paymentMode: "cash",
        createdAt: { [Op.between]: [`${from} 00:00:00`, `${to} 23:59:59`] },
      }),
      order: [["createdAt", "ASC"]],
    });

    // Calculate opening balance (sum of all cash in - cash out BEFORE startDate)
    const priorPayments = await Payment.findAll({
      where: branchWhere(req, { createdAt: { [Op.lt]: `${from} 00:00:00` } }),
    });
    const priorCashSales = await Bill.findAll({
      where: branchWhere(req, { paymentMode: "cash", createdAt: { [Op.lt]: `${from} 00:00:00` } }),
    });

    let openingBalance = 0;
    priorPayments.forEach(p => {
      if (p.direction === "in")  openingBalance += p.amount;
      if (p.direction === "out") openingBalance -= p.amount;
    });
    priorCashSales.forEach(b => { openingBalance += b.total; });

    // Build ledger entries
    const entries = [];
    let runningBalance = openingBalance;

    // Merge payments and cash sales, sorted by date
    const allEntries = [];

    payments.forEach(p => {
      allEntries.push({
        date: p.createdAt,
        particulars: `${p.direction === "in" ? "Receipt" : "Payment"} - ${p.partyName || "Unknown"}`,
        voucherNo: p.voucherNo || `PAY-${p.id}`,
        mode: p.mode,
        receipt: p.direction === "in" ? p.amount : 0,
        payment: p.direction === "out" ? p.amount : 0,
        reference: p.reference || "",
      });
    });

    cashSales.forEach(b => {
      allEntries.push({
        date: b.createdAt,
        particulars: `Cash Sale - ${b.customerName}`,
        voucherNo: b.billNo,
        mode: "cash",
        receipt: b.total,
        payment: 0,
        reference: "",
      });
    });

    // Sort by date
    allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    allEntries.forEach(e => {
      runningBalance += e.receipt - e.payment;
      entries.push({ ...e, balance: runningBalance });
    });

    const totalReceipts = entries.reduce((s, e) => s + e.receipt, 0);
    const totalPayments = entries.reduce((s, e) => s + e.payment, 0);
    const closingBalance = openingBalance + totalReceipts - totalPayments;

    res.json({
      startDate: from, endDate: to,
      openingBalance, closingBalance,
      totalReceipts, totalPayments,
      entries,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
