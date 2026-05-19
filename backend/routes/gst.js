const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill");
const Settings = require("../models/Settings");
const { Op } = require("sequelize");
const { protect } = require("../middleware/auth");

// GSTR-1 Summary
router.get("/gstr1", protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    const from = new Date(year, month - 1, 1);
    const to   = new Date(year, month, 0, 23, 59, 59);

    const bills = await Bill.findAll({
      where: { createdAt: { [Op.between]: [from, to] }, status: "paid" },
      order: [["createdAt", "ASC"]],
    });

    const settings = await Settings.findOne();

    // B2C Summary (bills without GST number = retail customers)
    const b2c = bills.map(b => ({
      billNo:       b.billNo,
      date:         new Date(b.createdAt).toLocaleDateString("en-IN"),
      customerName: b.customerName,
      phone:        b.customerPhone || "",
      taxableValue: b.subtotal,
      gstAmount:    b.gstAmount,
      total:        b.total,
      paymentMode:  b.paymentMode,
    }));

    // GST Rate wise breakup
    const rateWise = {};
    bills.forEach(bill => {
      (bill.items || []).forEach(item => {
        const rate = item.gst || 0;
        const base = parseFloat(item.mrp || 0) * parseInt(item.qty || 1);
        const gst  = (base * rate) / 100;
        if (!rateWise[rate]) rateWise[rate] = { rate, taxable: 0, gst: 0, total: 0 };
        rateWise[rate].taxable += base;
        rateWise[rate].gst     += gst;
        rateWise[rate].total   += base + gst;
      });
    });

    res.json({
      period: `${String(month).padStart(2, "0")}/${year}`,
      companyName: settings?.companyName || "",
      gstNumber:   settings?.gstNumber || "",
      totalBills:  bills.length,
      totalTaxable: bills.reduce((s, b) => s + b.subtotal, 0),
      totalGst:     bills.reduce((s, b) => s + b.gstAmount, 0),
      totalRevenue: bills.reduce((s, b) => s + b.total, 0),
      b2c,
      rateWise: Object.values(rateWise),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;