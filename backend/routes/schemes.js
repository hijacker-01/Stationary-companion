const express = require("express");
const router = express.Router();
const Scheme = require("../models/Scheme");
const Item = require("../models/Item");
const { Op } = require("sequelize");
const { protect } = require("../middleware/auth");
const { branchWhere } = require("../middleware/branchScope");

router.use(protect);

// Get all schemes
router.get("/", async (req, res) => {
  try {
    const schemes = await Scheme.findAll({ order: [["createdAt", "DESC"]] });
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check applicable schemes for an item + qty
router.get("/check", async (req, res) => {
  try {
    const { itemName, qty } = req.query;
    if (!itemName) return res.json([]);

    // Find the item to get its company
    const item = await Item.findOne({ where: branchWhere(req, { name: itemName }) });
    if (!item || !item.company) return res.json([]);

    const today = new Date().toISOString().split("T")[0];

    // Find active schemes for this company that are currently valid
    const schemes = await Scheme.findAll({
      where: {
        company: item.company,
        isActive: true,
        [Op.or]: [
          { startDate: null, endDate: null },
          {
            startDate: { [Op.lte]: today },
            endDate: { [Op.gte]: today },
          },
          {
            startDate: { [Op.lte]: today },
            endDate: null,
          },
          {
            startDate: null,
            endDate: { [Op.gte]: today },
          },
        ],
      },
    });

    // Filter schemes that apply to this item
    const applicable = schemes.filter(s => {
      const items = s.applicableItems || [];
      // Empty applicableItems means applies to all items from that company
      if (items.length === 0) return true;
      return items.includes(itemName);
    });

    // Calculate benefits based on qty
    const results = applicable.map(s => {
      const result = {
        id: s.id,
        name: s.name,
        company: s.company,
        type: s.type,
      };

      if (s.type === "buy_get_free") {
        const parsedQty = parseInt(qty) || 0;
        const setsQualified = Math.floor(parsedQty / s.buyQty);
        result.buyQty = s.buyQty;
        result.freeQty = s.freeQty;
        result.totalFreeItems = setsQualified * s.freeQty;
        result.qualified = setsQualified > 0;
        result.description = `Buy ${s.buyQty} Get ${s.freeQty} Free`;
      } else if (s.type === "flat_discount") {
        result.discountPercent = s.discountPercent;
        result.qualified = true;
        result.description = `${s.discountPercent}% Discount`;
      }

      return result;
    }).filter(r => r.qualified);

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create scheme
router.post("/", async (req, res) => {
  try {
    const scheme = await Scheme.create(req.body);
    res.json(scheme);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update scheme
router.put("/:id", async (req, res) => {
  try {
    await Scheme.update(req.body, { where: { id: req.params.id } });
    res.json({ message: "Scheme updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete scheme
router.delete("/:id", async (req, res) => {
  try {
    await Scheme.destroy({ where: { id: req.params.id } });
    res.json({ message: "Scheme deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
