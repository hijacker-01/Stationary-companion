const express = require("express");
const router = express.Router();
const StockAdjustment = require("../models/StockAdjustment");
const Item = require("../models/Item");
const sequelize = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const list = await StockAdjustment.findAll({ order: [["createdAt", "DESC"]] });
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { itemId, type, quantity, ...rest } = req.body;
    const item = await Item.findByPk(itemId, { transaction: t });
    if (!item) { await t.rollback(); return res.status(404).json({ error: "Item not found" }); }

    const qty = parseInt(quantity) || 0;
    let newQty;
    if (type === "increase") {
      newQty = item.stock_qty + qty;
    } else {
      newQty = Math.max(0, item.stock_qty - qty);
    }
    await item.update({ stock_qty: newQty }, { transaction: t });

    const adj = await StockAdjustment.create({
      itemId, itemName: item.name, batch: item.batch,
      type, quantity: qty, ...rest,
    }, { transaction: t });

    await t.commit();
    res.json(adj);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
