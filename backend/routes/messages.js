const express = require("express");
const router = express.Router();
const DirectMessage = require("../models/DirectMessage");
const User = require("../models/User");
const { Op } = require("sequelize");
const { protect } = require("../middleware/auth");

router.use(protect);

// Get chat history with a specific user
router.get("/history/:userId/:otherId", async (req, res) => {
  try {
    const { userId, otherId } = req.params;
    // Prevent reading another user's inbox (IDOR guard)
    if (String(req.user.id) !== String(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const messages = await DirectMessage.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId }
        ]
      },
      order: [["createdAt", "ASC"]],
    });
    
    // Mark as read if receiver is requesting
    await DirectMessage.update(
      { isRead: true },
      { where: { senderId: otherId, receiverId: userId, isRead: false } }
    );
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post("/send", async (req, res) => {
  try {
    // Force the sender to be the authenticated user, ignoring any client-supplied senderId
    const msg = await DirectMessage.create({ ...req.body, senderId: req.user.id });
    res.json(msg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get unread counts per user
router.get("/unread/:userId", async (req, res) => {
  try {
    if (String(req.user.id) !== String(req.params.userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const counts = await DirectMessage.count({
      where: { receiverId: req.params.userId, isRead: false },
      group: ['senderId']
    });
    // Format to a more usable object mapping senderId -> count
    const result = {};
    counts.forEach(c => {
      result[c.senderId] = parseInt(c.count);
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
