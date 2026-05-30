const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per `window` (here, per 15 minutes)
  message: { error: "Too many login attempts from this IP, please try again after 15 minutes" },
});

router.post("/register", register);
router.post("/login", loginLimiter, login);

module.exports = router;