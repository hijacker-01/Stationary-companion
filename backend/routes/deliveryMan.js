const express = require("express");
const router = express.Router();
const DeliveryMan = require("../models/DeliveryMan");
const Bill = require("../models/Bill");
const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const sequelize = require("../config/db");
const { Op } = require("sequelize");
const { protect } = require("../middleware/auth");
const { branchWhere } = require("../middleware/branchScope");

router.use(protect);

// Get all delivery men
router.get("/", async (req, res) => {
  try {
    const dms = await DeliveryMan.findAll({ order: [["name", "ASC"]] });
    res.json(dms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create delivery man
router.post("/", async (req, res) => {
  try {
    const dm = await DeliveryMan.create(req.body);
    res.json(dm);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update delivery man
router.put("/:id", async (req, res) => {
  try {
    await DeliveryMan.update(req.body, { where: { id: req.params.id } });
    res.json({ message: "Delivery Man updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete delivery man
router.delete("/:id", async (req, res) => {
  try {
    await DeliveryMan.destroy({ where: { id: req.params.id } });
    res.json({ message: "Delivery Man deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pending bills (not dispatched yet)
router.get("/bills/pending", async (req, res) => {
  try {
    const bills = await Bill.findAll({
      where: branchWhere(req, { deliveryStatus: "pending", status: { [Op.ne]: "paid" } }),
      order: [["createdAt", "DESC"]]
    });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign bills to DM
router.post("/assign", async (req, res) => {
  const { dmId, billIds } = req.body;
  const t = await sequelize.transaction();
  try {
    const dm = await DeliveryMan.findByPk(dmId, { transaction: t });
    if (!dm) throw new Error("Delivery Man not found");

    await Bill.update(
      { deliveryManId: dm.id, deliveryManName: dm.name, deliveryStatus: "dispatched" },
      { where: branchWhere(req, { id: { [Op.in]: billIds } }), transaction: t }
    );
    await t.commit();
    res.json({ message: "Bills assigned for dispatch" });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
});

// Helper for Voucher Generation
const generateVoucherNo = async (req, type, direction, t) => {
  const prefix = direction === "in" ? "RV-" : "PV-";
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyEnd = fyStart + 1;
  const yearPart = `${String(fyStart).slice(-2)}${String(fyEnd).slice(-2)}-`;
  const fullPrefix = `${prefix}${yearPart}`;

  const last = await Payment.findOne({
    where: branchWhere(req, { voucherNo: { [Op.like]: `${fullPrefix}%` } }),
    order: [["createdAt", "DESC"]],
    transaction: t,
  });

  let next = 1;
  if (last?.voucherNo) {
    const parts = last.voucherNo.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) next = lastNum + 1;
  }
  return `${fullPrefix}${String(next).padStart(4, "0")}`;
};

// DM Clearance (Settle bills after DM returns)
router.post("/clearance", async (req, res) => {
  const { dmId, settlements } = req.body; // settlements = [{ billId, status: "delivered"/"returned", collectedAmount, mode }]
  const t = await sequelize.transaction();
  try {
    const dm = await DeliveryMan.findByPk(dmId, { transaction: t });
    if (!dm) throw new Error("Delivery Man not found");

    let totalCollected = 0;

    for (const s of settlements) {
      const bill = await Bill.findOne({ where: branchWhere(req, { id: s.billId }), transaction: t });
      if (!bill) continue;

      if (s.status === "delivered") {
        bill.deliveryStatus = "delivered";
        const collected = parseFloat(s.collectedAmount || 0);
        
        if (collected > 0) {
          totalCollected += collected;
          // Create receipt voucher for the payment collected
          const cust = await Customer.findOne({ where: branchWhere(req, { name: bill.customerName }), transaction: t });
          if (cust) {
            await cust.decrement("balance", { by: collected, transaction: t });
            const voucherNo = await generateVoucherNo(req, "customer", "in", t);
            await Payment.create({
              type: "customer",
              voucherNo,
              partyId: cust.id,
              partyName: cust.name,
              amount: collected,
              mode: s.mode || "cash",
              reference: `Bill ${bill.billNo} - DM ${dm.name}`,
              note: "Payment collected via Delivery Dispatch",
              direction: "in",
              branchId: req.user.branchId,
            }, { transaction: t });
          }
          
          // Update bill status if fully paid
          if (collected >= bill.total) {
             bill.status = "paid";
          } else {
             bill.status = "partial";
          }
        }
      } else if (s.status === "returned") {
        bill.deliveryStatus = "returned";
        // To handle full sales return logic, this could optionally create a SalesReturn entry.
        // For now, we'll mark delivery status as returned.
      }
      
      await bill.save({ transaction: t });
    }

    await t.commit();
    res.json({ message: "Dispatch clearance completed", totalCollected });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
