const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { protect, adminOnly } = require("../middleware/auth");

// Get all users (admin only)
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single user
router.get("/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user (admin only)
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, phone, permissions, branchId } = req.body;
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ error: "Email already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, password: hashed, role,
      phone: phone || null,
      permissions: permissions || [],
      branchId: branchId || req.user.branchId,
    });
    const { password: _, ...safe } = user.toJSON();
    res.json(safe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update user
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, role, phone, permissions, password, branchId } = req.body;
    const update = { name, email, role, phone, permissions };
    if (branchId) update.branchId = branchId;
    if (password) update.password = await bcrypt.hash(password, 10);
    await User.update(update, { where: { id: req.params.id } });
    res.json({ message: "User updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete user
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    if (req.user.id === parseInt(req.params.id)) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;