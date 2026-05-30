const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ComplianceItem = require("../models/ComplianceItem");
const ComplianceAlert = require("../models/ComplianceAlert");
const Bill = require("../models/Bill");
const { Op } = require("sequelize");

router.get("/dashboard", protect, async (req, res) => {
  try {
    let items = await ComplianceItem.findAll({ order: [["validTo", "ASC"]] });
    if (!items.length) {
      const seeds = [
        { type: "drug_license", title: "Wholesale Drug License", documentNo: "DL/2023/1234", issuedBy: "State Drug Authority", validFrom: "2023-01-01", validTo: "2026-12-31", status: "valid", alertDays: 90 },
        { type: "gst_cert", title: "GST Registration Certificate", documentNo: "23AAPCB1234C1Z5", issuedBy: "CBIC", validFrom: "2020-01-01", validTo: "2099-12-31", status: "valid", alertDays: 365 },
        { type: "fssai", title: "FSSAI License", documentNo: "FSSAI/2024/5678", issuedBy: "FSSAI", validFrom: "2024-01-01", validTo: "2026-06-30", status: "expiring_soon", alertDays: 60 },
        { type: "cold_chain_cert", title: "Cold Chain Compliance", documentNo: "CC/2025/001", issuedBy: "WHO-GMP Auditor", validFrom: "2025-01-01", validTo: "2025-12-31", status: "valid", alertDays: 30 },
        { type: "fire_safety", title: "Fire Safety Certificate", documentNo: "FS/2024/789", issuedBy: "Municipal Corp", validFrom: "2024-06-01", validTo: "2025-06-01", status: "expired", alertDays: 30 },
      ];
      for (const s of seeds) await ComplianceItem.create(s);
      items = await ComplianceItem.findAll({ order: [["validTo", "ASC"]] });
    }
    // Auto-generate alerts for expiring items
    for (const item of items) {
      if (item.validTo) {
        const daysLeft = Math.round((new Date(item.validTo) - new Date()) / 86400000);
        if (daysLeft <= 0 && item.status !== "expired") await item.update({ status: "expired" });
        else if (daysLeft <= item.alertDays && item.status === "valid") await item.update({ status: "expiring_soon" });
      }
    }
    res.json(await ComplianceItem.findAll({ order: [["validTo", "ASC"]] }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/items", protect, async (req, res) => {
  try { res.json(await ComplianceItem.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/items/:id", protect, async (req, res) => {
  try { await ComplianceItem.destroy({ where: { id: req.params.id } }); res.json({ message: "Deleted" }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/alerts", protect, async (req, res) => {
  try {
    const items = await ComplianceItem.findAll({ where: { status: { [Op.in]: ["expiring_soon", "expired"] } } });
    const alerts = [];
    for (const item of items) {
      const daysLeft = item.validTo ? Math.round((new Date(item.validTo) - new Date()) / 86400000) : 0;
      const existing = await ComplianceAlert.findOne({ where: { complianceItemId: item.id, isAcknowledged: false } });
      if (!existing) {
        const alert = await ComplianceAlert.create({
          complianceItemId: item.id,
          alertType: daysLeft <= 0 ? "violation" : "expiry_warning",
          message: daysLeft <= 0 ? `${item.title} has EXPIRED! Immediate renewal required.` : `${item.title} expires in ${daysLeft} days. Plan renewal now.`,
          severity: daysLeft <= 0 ? "critical" : daysLeft <= 15 ? "high" : "medium",
          dueDate: item.validTo
        });
        alerts.push(alert);
      }
    }
    const allAlerts = await ComplianceAlert.findAll({ where: { isAcknowledged: false }, order: [["severity", "ASC"]] });
    res.json(allAlerts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/alerts/:id/acknowledge", protect, async (req, res) => {
  try {
    await ComplianceAlert.update({ isAcknowledged: true, acknowledgedBy: req.user?.name, acknowledgedAt: new Date() }, { where: { id: req.params.id } });
    res.json({ message: "Alert acknowledged" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/schedule-h", protect, async (req, res) => {
  try {
    const bills = await Bill.findAll({ order: [["createdAt", "DESC"]], limit: 200 });
    const register = [];
    for (const bill of bills) {
      const items = typeof bill.items === "string" ? JSON.parse(bill.items) : (bill.items || []);
      for (const item of items) {
        if (item.schedule && item.schedule !== "None") {
          register.push({ date: bill.createdAt, billNo: bill.billNo, customer: bill.customerName, drugName: item.name, schedule: item.schedule, qty: item.qty, prescriptionRef: item.prescriptionRef || "Not Entered" });
        }
      }
    }
    res.json(register);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/gst-health", protect, async (req, res) => {
  try {
    res.json({ filingReadiness: 85, inputCreditMatch: 92, outputTaxMatch: 96, issues: [
      { type: "Missing HSN", count: 12, severity: "medium" },
      { type: "Zero-rated without exemption", count: 3, severity: "high" }
    ]});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
