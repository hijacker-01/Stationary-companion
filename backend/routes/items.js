const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const { protect } = require("../middleware/auth");

router.use(protect);

const pick = (obj, keys) => Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]]));
const ALLOWED = ["name","batch","hsn","pack","category","company","stock_qty","scheme_qty","unit","expiry","location","mrp","selling_price","cost_price","purchaseScheme","schedule","reorderPoint"];

// Get items (with pagination & search)
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;
    
    const where = {};
    if (search) {
      const { Op } = require("sequelize");
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Item.findAndCountAll({ where, limit, offset, order: [['name', 'ASC']] });
    res.json({ total: count, items: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new item
router.post("/", async (req, res) => {
  try {
    const item = await Item.create(pick(req.body, ALLOWED));
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update item
router.put("/:id", async (req, res) => {
  try {
    const [count] = await Item.update(pick(req.body, ALLOWED), { where: { id: req.params.id } });
    if (count === 0) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete item
router.delete("/:id", async (req, res) => {
  try {
    const count = await Item.destroy({ where: { id: req.params.id } });
    if (count === 0) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
