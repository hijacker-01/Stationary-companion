const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Bin = require("../models/Bin");
const PickingTask = require("../models/PickingTask");
const Item = require("../models/Item");

// DEMO MODULE: the warehouse digital twin uses simulated bin telemetry
// (temperature, humidity, access counts) and sample live movements. It is not
// wired to real sensor/WMS data. Every response carries an X-Demo-Data header
// so the UI can show a "Demo data" badge.
router.use(protect);
router.use((req, res, next) => { res.set("X-Demo-Data", "true"); next(); });

router.get("/layout", protect, async (req, res) => {
  try {
    let bins = await Bin.findAll({ order: [["zone", "ASC"], ["rack", "ASC"], ["shelf", "ASC"]] });
    if (!bins.length) {
      const zones = ["A", "B", "C"]; const racks = ["1", "2", "3", "4"]; const shelves = ["T", "M", "B"];
      for (const z of zones) for (const r of racks) for (const s of shelves) {
        await Bin.create({
          warehouse_id: 1, zone: z, rack: r, shelf: s, bin_code: `${z}${r}-${s}`,
          capacityUsed: Math.round(Math.random() * 100),
          itemCount: Math.round(Math.random() * 20),
          accessCount: Math.round(Math.random() * 50),
          temperature: Math.round((20 + Math.random() * 8) * 10) / 10,
          humidity: Math.round((40 + Math.random() * 30) * 10) / 10
        });
      }
      bins = await Bin.findAll({ order: [["zone", "ASC"], ["rack", "ASC"], ["shelf", "ASC"]] });
    }
    res.json(bins);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/heatmap", protect, async (req, res) => {
  try {
    const bins = await Bin.findAll({ attributes: ["id", "bin_code", "accessCount", "capacityUsed", "zone"] });
    res.json(bins);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/picking", protect, async (req, res) => {
  try { res.json(await PickingTask.findAll({ order: [["createdAt", "DESC"]], limit: 20 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/picking/:billId", protect, async (req, res) => {
  try {
    const task = await PickingTask.findOne({ where: { billId: req.params.billId } });
    res.json(task || { message: "No picking task for this bill" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/optimize", protect, async (req, res) => {
  try {
    const bins = await Bin.findAll({ order: [["accessCount", "DESC"]], limit: 10 });
    const suggestions = bins.slice(0, 3).map((bin, i) => ({
      binCode: bin.bin_code, action: `Move high-access items from ${bin.bin_code} closer to dispatch zone`,
      currentAccess: bin.accessCount, estimatedSaving: `${10 + i * 5}% faster picking`,
      priority: i === 0 ? "high" : "medium"
    }));
    res.json({ demo: true, suggestions });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/live", protect, async (req, res) => {
  try {
    res.json({ demo: true, movements: [
      { time: new Date().toISOString(), bin: "A1-T", action: "PUT_AWAY", item: "Paracetamol 500mg", qty: 100 },
      { time: new Date(Date.now() - 300000).toISOString(), bin: "B2-M", action: "PICK", item: "Amoxicillin 250mg", qty: 50 },
    ]});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
