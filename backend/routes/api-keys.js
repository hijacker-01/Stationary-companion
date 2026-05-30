const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const APIKey = require("../models/APIKey");

router.get("/", protect, async (req, res) => {
  try { res.json(await APIKey.findAll({ order: [["createdAt", "DESC"]] })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", protect, async (req, res) => {
  try {
    const apiKey = await APIKey.create({
      name: req.body.name, userId: req.user?.id, userName: req.user?.name,
      permissions: req.body.permissions || ["read"], rateLimit: req.body.rateLimit || 60
    });
    res.json(apiKey);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", protect, async (req, res) => {
  try { await APIKey.destroy({ where: { id: req.params.id } }); res.json({ message: "API key revoked" }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/:id/toggle", protect, async (req, res) => {
  try {
    const key = await APIKey.findByPk(req.params.id);
    await key.update({ isActive: !key.isActive });
    res.json({ message: `API Key ${key.isActive ? "activated" : "revoked"}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
