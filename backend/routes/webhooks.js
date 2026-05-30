const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Webhook = require("../models/Webhook");
const crypto = require("crypto");

router.get("/", protect, async (req, res) => {
  try { res.json(await Webhook.findAll({ order: [["createdAt", "DESC"]] })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", protect, async (req, res) => {
  try {
    const webhook = await Webhook.create({
      ...req.body, secret: req.body.secret || crypto.randomBytes(16).toString("hex"),
      createdBy: req.user?.name || "User"
    });
    res.json(webhook);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", protect, async (req, res) => {
  try { await Webhook.destroy({ where: { id: req.params.id } }); res.json({ message: "Webhook deleted" }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/:id/toggle", protect, async (req, res) => {
  try {
    const wh = await Webhook.findByPk(req.params.id);
    await wh.update({ isActive: !wh.isActive });
    res.json({ message: `Webhook ${wh.isActive ? "activated" : "deactivated"}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
