const express = require("express");
const router = express.Router();
const AuditLog = require("../models/AuditLog");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      order: [["createdAt", "DESC"]],
      limit: 100
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
