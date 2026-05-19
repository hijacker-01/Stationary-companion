const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const { protect } = require("../middleware/auth");
const { Op } = require("sequelize");

// Get all expenses
router.get("/", protect, async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      order: [["date", "DESC"], ["createdAt", "DESC"]]
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create expense
router.post("/", protect, async (req, res) => {
  try {
    const expense = await Expense.create(req.body);
    res.json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete expense
router.delete("/:id", protect, async (req, res) => {
  try {
    await Expense.destroy({ where: { id: req.params.id } });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
