const express = require("express");
const router = express.Router();
const LedgerAccount = require("../models/LedgerAccount");
const JournalLine = require("../models/JournalLine");
const { protect, requirePermission } = require("../middleware/auth");

router.post("/seed", protect, requirePermission("ledger.write"), async (req, res) => {
  try {
    const defaults = [
      { code: "INVENTORY", name: "Inventory Account", group: "Asset" },
      { code: "SALES", name: "Sales Account", group: "Revenue" },
      { code: "GST_IN", name: "Input GST Account", group: "Asset" },
      { code: "GST_OUT", name: "Output GST Account", group: "Liability" },
      { code: "SUPPLIER_CTRL", name: "Supplier Control Account", group: "Liability" },
      { code: "CUSTOMER_CTRL", name: "Customer Control Account", group: "Asset" },
    ];

    for (const acc of defaults) {
      await LedgerAccount.findOrCreate({
        where: { code: acc.code },
        defaults: acc
      });
    }
    res.json({ message: "Default ledgers seeded successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/accounts", protect, requirePermission("ledger.read"), async (req, res) => {
  try {
    const accounts = await LedgerAccount.findAll();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/trial-balance", protect, requirePermission("ledger.read"), async (req, res) => {
  try {
    const accounts = await LedgerAccount.findAll({ include: [{ model: JournalLine }] });
    // Assuming you would do aggregation here, but keeping it simple for the skeleton
    // In reality, this needs a raw query for sum(debit), sum(credit) grouped by accountId
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
