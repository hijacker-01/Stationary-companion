const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");
const { protect } = require("../middleware/auth");

// Get settings (create default if not exists)
router.get("/", protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.put("/", protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    await settings.update(req.body);
    res.json(settings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Trigger Database Backup
router.post("/backup", protect, async (req, res) => {
  try {
    const performBackup = require("../scripts/backup");
    const filepath = await performBackup();
    res.json({ message: "Backup successful", filepath });
  } catch (err) {
    res.status(500).json({ error: "Backup failed: " + err.message });
  }
});

module.exports = router;