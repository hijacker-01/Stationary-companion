const express = require("express");
const router = express.Router();
const PurchaseReturn = require("../models/PurchaseReturn");
const Item = require("../models/Item");
const sequelize = require("../config/db");
const { Op } = require("sequelize");

const generateReturnNo = async (t) => {
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyEnd = fyStart + 1;
  const prefix = `DN-${String(fyStart).slice(-2)}${String(fyEnd).slice(-2)}-`;
  const last = await PurchaseReturn.findOne({
    where: { returnNo: { [Op.like]: `${prefix}%` } },
    order: [["createdAt", "DESC"]], transaction: t,
  });
  let next = 1;
  if (last?.returnNo) {
    const parts = last.returnNo.split("-");
    const n = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
};

router.get("/", async (req, res) => {
  try {
    const returns = await PurchaseReturn.findAll({ order: [["createdAt", "DESC"]] });
    res.json(returns);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const ret = await PurchaseReturn.findByPk(req.params.id);
    if (!ret) return res.status(404).json({ error: "Not found" });
    res.json(ret);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items = [], ...rest } = req.body;

    // Deduct returned items from inventory
    for (const ri of items.filter(i => i.name)) {
      const item = await Item.findOne({
        where: { name: ri.name, batch: ri.batch || "" }, transaction: t,
      });
      if (item) {
        const newQty = Math.max(0, item.stock_qty - (parseInt(ri.qty) || 0));
        await item.update({ stock_qty: newQty }, { transaction: t });
      }
    }

    const pr = await PurchaseReturn.create({
      ...rest, items,
      returnNo: await generateReturnNo(t),
    }, { transaction: t });

    await t.commit();
    res.json(pr);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const ret = await PurchaseReturn.findByPk(req.params.id, { transaction: t });
    if (!ret) return res.status(404).json({ error: "Not found" });
    // Restore stock
    for (const ri of (ret.items || []).filter(i => i.name)) {
      const item = await Item.findOne({
        where: { name: ri.name, batch: ri.batch || "" }, transaction: t,
      });
      if (item) {
        await item.increment("stock_qty", { by: parseInt(ri.qty) || 0, transaction: t });
      }
    }
    await ret.destroy({ transaction: t });
    await t.commit();
    res.json({ message: "Purchase return deleted" });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
