const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const { Op } = require("sequelize");

// Get items expiring within N days
router.get("/", async (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const future = new Date();
  future.setDate(future.getDate() + days);
  const items = await Item.findAll({
    where: { expiry: { [Op.lte]: future } },
    order: [["expiry", "ASC"]],
  });
  res.json(items);
});

module.exports = router;