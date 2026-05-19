const express = require("express");
const router = express.Router();
const Salesman = require("../models/Salesman");

router.get("/", async (req, res) => {
  try {
    const list = await Salesman.findAll({ order: [["name", "ASC"]] });
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const s = await Salesman.create(req.body);
    res.json(s);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    await Salesman.update(req.body, { where: { id: req.params.id } });
    res.json({ message: "Updated" });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await Salesman.destroy({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
