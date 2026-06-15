const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { sendMessage, isConfigured } = require("../services/messaging");

// Report whether a real gateway is configured (so the UI can show a banner).
router.get("/status", protect, (req, res) => {
  res.json({ configured: isConfigured(), provider: "twilio" });
});

router.post("/send", protect, async (req, res) => {
  try {
    const { to, message, channel } = req.body;
    const result = await sendMessage({ to, message, channel });
    res.json(result);
  } catch (err) {
    console.error("[communication] send failed:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
