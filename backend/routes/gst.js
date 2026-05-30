const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const EInvoiceService = require("../services/EInvoiceService");
const Bill = require("../models/Bill");
const EInvoiceLog = require("../models/EInvoiceLog");
const GSTReturn = require("../models/GSTReturn");

router.post("/einvoice/generate/:billId", protect, async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.billId);
    if (!bill) return res.status(404).json({ error: "Bill not found" });

    // Mock seller and buyer for API simulation
    const seller = { stateCode: "27", gstin: "27AAAAA0000A1Z5", legalName: "BPartner ERP", address: "Mumbai" };
    const buyer = { stateCode: "29", gstNumber: bill.customerGst || "29BBBBB0000B1Z5", name: bill.customerName, address: bill.customerAddress };

    const log = await EInvoiceService.generateIRN(bill, seller, buyer, "sandbox");
    
    // Update Bill
    await bill.update({ irn: log.irn });

    res.json({ message: "IRN Generated successfully in Sandbox", irn: log.irn, qrData: log.signedQrData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/einvoice/logs", protect, async (req, res) => {
  try {
    const logs = await EInvoiceLog.findAll({ order: [["createdAt", "DESC"]] });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/dashboard", protect, async (req, res) => {
  res.json({
    complianceScore: 92,
    pendingReturns: 2,
    itcMismatch: 45000,
    nonFilingSuppliers: 3,
    taxLiability: 1250000
  });
});

module.exports = router;