const express = require("express");
const router = express.Router();
const Item = require("../models/Item");

// Get all items
router.get("/", async (req, res) => {
  try {
    const items = await Item.findAll();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new item
router.post("/", async (req, res) => {
  try {
    const item = await Item.create(req.body);
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update item
router.put("/:id", async (req, res) => {
  try {
    await Item.update(req.body, { where: { id: req.params.id } });
    res.json({ message: "Item updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete item
router.delete("/:id", async (req, res) => {
  try {
    await Item.destroy({ where: { id: req.params.id } });
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
