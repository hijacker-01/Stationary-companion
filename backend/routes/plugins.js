const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Plugin = require("../models/Plugin");

// ============ PLUGINS ============
router.get("/", protect, async (req, res) => {
  try {
    let plugins = await Plugin.findAll({ order: [["installedAt", "DESC"]] });
    if (!plugins.length) {
      const seeds = [
        { name: "WhatsApp Business", version: "2.1.0", author: "BPartner", description: "Send automated WhatsApp messages for invoices, reminders, and order confirmations", hooks: ["invoice_created", "payment_overdue"], isActive: true },
        { name: "Razorpay Payments", version: "1.0.0", author: "BPartner", description: "Accept online payments via UPI, cards, and net banking", hooks: ["order_placed"], isActive: false },
        { name: "Shiprocket Logistics", version: "1.2.0", author: "Community", description: "Automated shipping label generation and tracking integration", hooks: ["invoice_created"], isActive: false },
        { name: "Tally Sync", version: "3.0.0", author: "BPartner", description: "Two-way sync of vouchers and ledger entries with Tally Prime", hooks: ["journal_posted"], isActive: false }
      ];
      for (const s of seeds) await Plugin.create(s);
      plugins = await Plugin.findAll({ order: [["installedAt", "DESC"]] });
    }
    res.json(plugins);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/install", protect, async (req, res) => {
  try { res.json(await Plugin.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

router.post("/:id/toggle", protect, async (req, res) => {
  try {
    const plugin = await Plugin.findByPk(req.params.id);
    if (!plugin) return res.status(404).json({ error: "Plugin not found" });
    await plugin.update({ isActive: !plugin.isActive });
    res.json({ message: `Plugin ${plugin.isActive ? "activated" : "deactivated"}`, isActive: plugin.isActive });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id/config", protect, async (req, res) => {
  try { const p = await Plugin.findByPk(req.params.id); res.json(p?.config || {}); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:id/config", protect, async (req, res) => {
  try {
    await Plugin.update({ config: req.body }, { where: { id: req.params.id } });
    res.json({ message: "Config updated" });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", protect, async (req, res) => {
  try { await Plugin.destroy({ where: { id: req.params.id } }); res.json({ message: "Plugin uninstalled" }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
