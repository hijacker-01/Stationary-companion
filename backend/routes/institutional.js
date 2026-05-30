const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Tender = require("../models/Tender");
const InstitutionalBill = require("../models/InstitutionalBill");

router.get("/tenders", protect, async (req, res) => {
  try { res.json(await Tender.findAll({ order: [["createdAt", "DESC"]] })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/tenders", protect, async (req, res) => {
  try {
    const tender = await Tender.create({ ...req.body, tenderNo: `TND-${Date.now()}` });
    res.json(tender);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put("/tenders/:id", protect, async (req, res) => {
  try {
    await Tender.update(req.body, { where: { id: req.params.id } });
    res.json({ message: "Tender updated" });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post("/tenders/:id/bid", protect, async (req, res) => {
  try {
    await Tender.update({ status: "bid_submitted", rateContract: req.body.rateContract }, { where: { id: req.params.id } });
    res.json({ message: "Bid submitted" });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get("/bills", protect, async (req, res) => {
  try { res.json(await InstitutionalBill.findAll({ order: [["createdAt", "DESC"]] })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/bill", protect, async (req, res) => {
  try {
    const bill = await InstitutionalBill.create({ ...req.body, billNo: `INST-${Date.now()}` });
    res.json(bill);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get("/compliance/:id", protect, async (req, res) => {
  try {
    const bill = await InstitutionalBill.findByPk(req.params.id);
    const compliance = bill?.compliance || {};
    res.json({ billId: req.params.id, required: ["Drug License", "GST Certificate", "Quality Certificate", "Tender Award Letter"], provided: Object.keys(compliance), missing: ["Drug License", "GST Certificate", "Quality Certificate", "Tender Award Letter"].filter(d => !compliance[d]) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
