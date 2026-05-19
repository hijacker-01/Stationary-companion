const User = require("../models/User");
const Settings = require("../models/Settings");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const {
      name, email, password,
      companyName, companyPhone, companyAddress, companyEmail,
      gstNumber, panNumber, stateName, stateCode, dlNumber, financialYear
    } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: "admin" });

    // Initialize Company details in Settings
    await Settings.destroy({ where: {} });
    await Settings.create({
      companyName: companyName || "",
      companyAddress: companyAddress || "",
      companyPhone: companyPhone || "",
      companyEmail: companyEmail || email || "",
      gstNumber: gstNumber || "",
      panNumber: panNumber || "",
      stateName: stateName || "",
      stateCode: stateCode || "",
      dlNumber: dlNumber || "",
      financialYear: financialYear || "2026-27",
    });

    res.json({ message: "User registered and company created", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};