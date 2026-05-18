const express = require("express");
const router = express.Router();

// Placeholder — full billing module coming later
router.get("/", (req, res) => {
  res.json({ message: "Billing route working" });
});

module.exports = router;