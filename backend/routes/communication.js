const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

router.post("/send", protect, async (req, res) => {
  try {
    const { to, message, channel } = req.body;
    
    // In production, this would call Twilio API:
    // client.messages.create({ body: message, from: 'whatsapp:+14155238886', to: `whatsapp:${to}` })
    
    console.log(`[Twilio Mock] Sent ${channel} to ${to}: ${message}`);
    
    res.json({
      success: true,
      message: `${channel} sent successfully to ${to}`,
      sid: `SM${Math.random().toString(36).substring(7)}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

module.exports = router;
