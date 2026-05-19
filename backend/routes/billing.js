const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill");

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

// Create bill
router.post("/", async (req, res) => {
  try {
    const bill = await Bill.create({
      ...req.body,
      billNo: generateBillNo(),
    });
    res.json(bill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete bill
router.delete("/:id", async (req, res) => {
  try {
    await Bill.destroy({ where: { id: req.params.id } });
    res.json({ message: "Bill deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;