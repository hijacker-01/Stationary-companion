const express = require("express");
const router = express.Router();
const SalesReturn = require("../models/SalesReturn");
const Item = require("../models/Item");
const Customer = require("../models/Customer");
const sequelize = require("../config/db");
const { Op } = require("sequelize");
const { protect } = require("../middleware/auth");
const { branchWhere } = require("../middleware/branchScope");

router.use(protect);

const generateReturnNo = async (req, t) => {
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyEnd = fyStart + 1;
  const prefix = `CR-${String(fyStart).slice(-2)}${String(fyEnd).slice(-2)}-`;
  const last = await SalesReturn.findOne({
    where: branchWhere(req, { returnNo: { [Op.like]: `${prefix}%` } }),
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

// GET all returns
router.get("/", async (req, res) => {
  try {
    const returns = await SalesReturn.findAll({ where: branchWhere(req), order: [["createdAt", "DESC"]] });
    res.json(returns);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single return
router.get("/:id", async (req, res) => {
  try {
    const ret = await SalesReturn.findOne({ where: branchWhere(req, { id: req.params.id }) });
    if (!ret) return res.status(404).json({ error: "Not found" });
    res.json(ret);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create return — restores stock
router.post("/", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items = [], customerName, restockItems = true, ...rest } = req.body;

    // Restock inventory for each returned item
    if (restockItems) {
      for (const ri of items.filter(i => i.name)) {
        const item = await Item.findOne({
          where: branchWhere(req, { name: ri.name, batch: ri.batch || "" }), transaction: t,
        });
        if (item) {
          await item.increment("stock_qty", { by: parseInt(ri.qty) || 0, transaction: t });
        }
      }
    }

    // Update customer balance (credit)
    if (customerName) {
      const customer = await Customer.findOne({ where: branchWhere(req, { name: customerName }), transaction: t });
      if (customer) {
        await customer.decrement("balance", { by: rest.totalAmount || 0, transaction: t });
      }
    }

    const salesReturn = await SalesReturn.create({
      ...rest,
      customerName,
      items,
      restockItems,
      returnNo: await generateReturnNo(req, t),
      branchId: req.user.branchId,
    }, { transaction: t });

    await t.commit();
    res.json(salesReturn);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// DELETE return — reverse the restock
router.delete("/:id", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const ret = await SalesReturn.findOne({ where: branchWhere(req, { id: req.params.id }), transaction: t });
    if (!ret) return res.status(404).json({ error: "Not found" });

    if (ret.restockItems) {
      for (const ri of (ret.items || []).filter(i => i.name)) {
        const item = await Item.findOne({
          where: branchWhere(req, { name: ri.name, batch: ri.batch || "" }), transaction: t,
        });
        if (item) {
          await item.decrement("stock_qty", { by: parseInt(ri.qty) || 0, transaction: t });
        }
      }
    }

    await ret.destroy({ transaction: t });
    await t.commit();
    res.json({ message: "Sales return deleted and stock reversed" });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
