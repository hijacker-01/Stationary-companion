const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const SellThrough = require("../models/SellThrough");
const SupplierScheme = require("../models/SupplierScheme");

router.use(protect);

router.get("/supplier/sell-through", async (req, res) => {
  try {
    let data = await SellThrough.findAll();
    
    // Seed initial data if empty so UI looks good but driven by DB
    if (data.length === 0) {
      await SellThrough.bulkCreate([
        { supplierId: 1, name: "Dolo 650", stockAtDistributor: 200, sold30d: 150, velocity: 5.0, trend: "up" },
        { supplierId: 1, name: "Azithromycin 500", stockAtDistributor: 50, sold30d: 200, velocity: 8.5, trend: "up" },
        { supplierId: 1, name: "Cough Syrup 100ml", stockAtDistributor: 500, sold30d: 20, velocity: 1.2, trend: "down" }
      ]);
      data = await SellThrough.findAll();
    }
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/schemes", async (req, res) => {
  try {
    const schemes = await SupplierScheme.findAll({ where: { isActive: true } });
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/supplier/push-scheme", async (req, res) => {
  try {
    const scheme = await SupplierScheme.create({
      ...req.body,
      supplierId: req.user ? req.user.id : 1, // Fallback if no user
    });
    res.status(201).json(scheme);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
