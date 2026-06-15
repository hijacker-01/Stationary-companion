const express = require("express");
const router = express.Router();
const Supplier = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");
const Item = require("../models/Item");
const { protect, requirePermission } = require("../middleware/auth");
const { branchWhere } = require("../middleware/branchScope");
const AuditLog = require("../models/AuditLog");
const sequelize = require("../config/db");
const accounting = require("../services/accounting");
const stockMovement = require("../services/stockMovement");
const idempotency = require("../middleware/idempotency");
const multer = require("multer");
const { createWorker } = require("tesseract.js");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const upload = multer({ 
  dest: path.join(__dirname, "../uploads/"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, and PDF are allowed."), false);
    }
  }
});

const genPO = () => {
  const now = new Date();
  return `PO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// ── SUPPLIERS ──
router.get("/", protect, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', includeInactive = 'false' } = req.query;
    const offset = (page - 1) * limit;
    
    const where = branchWhere(req);
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (includeInactive !== 'true') where.isActive = true;

    const suppliers = await Supplier.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]]
    });
    
    res.json({
      data: suppliers.rows,
      total: suppliers.count,
      page: parseInt(page),
      totalPages: Math.ceil(suppliers.count / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const s = await Supplier.create({ ...req.body, branchId: req.user.branchId });
    res.json(s);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    await Supplier.update(req.body, { where: branchWhere(req, { id: req.params.id }) });
    res.json({ message: "Supplier updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ where: branchWhere(req, { id: req.params.id }) });
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    // Assuming we check PurchaseChallan or PurchaseOrder count
    const PurchaseChallan = require("../models/PurchaseChallan");
    const challanCount = await PurchaseChallan.count({ where: { supplierId: req.params.id } });

    if (challanCount > 0) {
      return res.status(400).json({
        error: "Cannot delete supplier",
        message: `This supplier has ${challanCount} purchase invoice(s) on record. Deleting them would corrupt your financial history.`,
        suggestion: "Deactivate the supplier instead to hide them from dropdowns while preserving all records."
      });
    }

    await Supplier.destroy({ where: branchWhere(req, { id: req.params.id }) });
    res.json({ message: "Supplier deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/deactivate", protect, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ where: branchWhere(req, { id: req.params.id }) });
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    await supplier.update({ isActive: false });
    res.json({ message: "Supplier deactivated" });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.patch("/:id/activate", protect, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ where: branchWhere(req, { id: req.params.id }) });
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    await supplier.update({ isActive: true });
    res.json({ message: "Supplier reactivated" });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// ── PURCHASE ORDERS ──
router.get("/orders", protect, async (req, res) => {
  try {
    const orders = await PurchaseOrder.findAll({
      where: branchWhere(req),
      order: [["createdAt", "DESC"]],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/orders/:id", protect, async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({ where: branchWhere(req, { id: req.params.id }) });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/orders", protect, async (req, res) => {
  try {
    const order = await PurchaseOrder.create({
      ...req.body,
      poNumber: genPO(),
      branchId: req.user.branchId,
    });
    // Update supplier balance
    if (order.paymentMode === "credit") {
      await Supplier.increment("balance", {
        by: order.total,
        where: { id: order.supplierId },
      });
    }
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark as received — add items to inventory
router.put("/orders/:id/receive", protect, async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({ where: branchWhere(req, { id: req.params.id }) });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Add each item to inventory
    for (const item of order.items || []) {
      const existing = await Item.findOne({
        where: branchWhere(req, { name: item.name, batch: item.batch || null }),
      });
      if (existing) {
        await existing.increment("stock_qty", { by: parseInt(item.qty || 1) });
        if (item.schemeQty) {
          await existing.increment("scheme_qty", {
            by: parseInt(item.schemeQty || 0),
          });
        }
      } else {
        await Item.create({
          name: item.name,
          batch: item.batch || "",
          category: item.category || "",
          hsn: item.hsn || "",
          pack: item.pack || "",
          stock_qty: parseInt(item.qty || 1),
          scheme_qty: parseInt(item.schemeQty || 0),
          unit: item.unit || "units",
          expiry: item.expiry || null,
          mrp: item.mrp || 0,
          selling_price: item.selling_price || item.mrp || 0,
          cost_price: item.costPrice || 0,
          branchId: req.user.branchId,
        });
      }
    }

    await order.update({
      status: "received",
      receivedDate: new Date(),
      amountPaid: req.body.amountPaid || 0,
      balanceDue: order.total - (req.body.amountPaid || 0),
    });

    res.json({ message: "Order received and inventory updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/orders/:id", protect, async (req, res) => {
  try {
    await PurchaseOrder.update(req.body, { where: branchWhere(req, { id: req.params.id }) });
    res.json({ message: "Order updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/orders/:id", protect, async (req, res) => {
  try {
    await PurchaseOrder.destroy({ where: branchWhere(req, { id: req.params.id }) });
    res.json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SMART PURCHASE BILL ENTRY ──
const stringSimilarity = require("string-similarity");

router.post(
  "/extract-invoice",
  protect,
  upload.single("invoice"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const rawFilePath = req.file.path;
    const processedFilePath = `${rawFilePath}-processed.png`;
    let worker = null;

    try {
      const { Worker } = require("worker_threads");
      
      const text = await new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, "../services/ocrWorker.js"), {
          workerData: { rawFilePath, processedFilePath }
        });
        
        worker.on("message", (msg) => {
          if (msg.success) resolve(msg.text);
          else reject(new Error(msg.error));
        });
        
        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
      });

      const lines = text
        .split("\n")
        .map((l) => l.replace(/\|/g, " ").replace(/\s+/g, " ").trim())
        .filter(Boolean);

      let supplierName = "";
      let invoiceNo = "";
      let date = new Date().toISOString().split("T")[0];
      let items = [];

      // Header extraction: take the first non-empty line as the supplier name
      // unless a clearer match is found below. The user can correct it in the UI.
      for (const line of lines) {
        if (!supplierName && line.length > 3 && !/invoice|bill|date|gst/i.test(line)) {
          supplierName = line;
        }
        const invMatch = line.match(
          /(?:Invoice No|Inv No|Bill No)\s*[:.-]?\s*([A-Za-z0-9-]+)/i,
        );
        if (invMatch && invMatch[1]) invoiceNo = invMatch[1];

        const dateMatch = line.match(
          /(?:Date)\s*[:.-]?\s*(\d{2}[-/.]\d{2}[-/.]\d{2,4})/i,
        );
        if (dateMatch && dateMatch[1]) {
          const parts = dateMatch[1].split(/[-/.]/);
          if (parts.length === 3) {
            const d = parts[0];
            const m = parts[1];
            const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            date = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          }
        }
      }

      // 👉 ADD THIS: Fetch all your existing inventory items from the DB
      const allDatabaseItems = await Item.findAll({ attributes: ["name"] });
      const allItemNames = allDatabaseItems.map((item) => item.name);

      // 2. FORGIVING TABLE EXTRACTION
      // We relax the regex. Instead of strict \d+ (digits), we use \S+ (non-whitespace)
      // because OCR might read an '8' as a 'B'. Your frontend allows the user to fix these minor typos.
      const forgivingRegex =
        /^\s*(\S+)\s+(\S+)\s+(.+?)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*$/i;

      for (const line of lines) {
        const match = line.match(forgivingRegex);

        if (match) {
          let name = match[3].trim();
          // Skip table headers
          if (name.match(/(?:Product|Description|Item|Name)/i)) continue;

          // 👇 --- STEP 4 GOES EXACTLY HERE --- 👇
          if (allItemNames.length > 0) {
            const bestItemMatch = stringSimilarity.findBestMatch(
              name,
              allItemNames,
            );

            // If the OCR matches an item in your DB by at least 50%...
            if (bestItemMatch.bestMatch.rating > 0.5) {
              // Autocorrect the raw OCR text to your clean Database Name!
              name = bestItemMatch.bestMatch.target;
            }
          }
          // 👆 -------------------------------- 👆

          // Clean up common OCR number misreads (e.g., O -> 0, , -> .)
          const cleanNum = (str) =>
            parseFloat(
              str
                .replace(/O/g, "0")
                .replace(/,/g, ".")
                .replace(/[^\d.]/g, ""),
            ) || 0;

          const qty = parseInt(cleanNum(match[5]), 10);
          const schemeQty = parseInt(cleanNum(match[6]), 10);
          const mrp = cleanNum(match[9]);
          const rate = cleanNum(match[10]);
          const sgst = cleanNum(match[13]);
          const cgst = cleanNum(match[14]);

          const taxPercent = Math.round(sgst + cgst);

          // Date extraction
          let expiryRaw = match[8];
          let expiry = new Date(
            new Date().setFullYear(new Date().getFullYear() + 2),
          )
            .toISOString()
            .split("T")[0]; // Default

          if (expiryRaw.includes("/")) {
            const expParts = expiryRaw.split("/");
            if (expParts.length === 2) {
              const m = expParts[0].replace(/[^\d]/g, "");
              const y = expParts[1].replace(/[^\d]/g, "");
              if (m && y) {
                const fullYear = y.length === 2 ? `20${y}` : y;
                expiry = `${fullYear}-${m.padStart(2, "0")}-01`;
              }
            }
          }

          // Only push if it looks like a valid item row (e.g., has a valid rate and qty)
          if (rate > 0 && name.length > 3) {
            items.push({
              name,
              batch: match[7],
              category: "Medicines",
              hsn: match[2],
              pack: match[4],
              qty: qty > 0 ? qty : 1, // Fallback to 1 if OCR fails
              schemeQty,
              unit: "Units",
              expiry,
              mrp,
              selling_price: mrp,
              costPrice: rate,
              taxPercent,
            });
          }
        }
      }

      // 3. Fuzzy Matching against Database Suppliers (Your existing logic)
      const suppliers = await Supplier.findAll({ attributes: ["id", "name"] });
      let matchedSupplierId = "";

      if (suppliers.length > 0) {
        const supplierNames = suppliers.map((s) => s.name);
        const bestMatch = stringSimilarity.findBestMatch(
          supplierName,
          supplierNames,
        );

        if (bestMatch.bestMatch.rating > 0.4) {
          const target = suppliers.find(
            (s) => s.name === bestMatch.bestMatch.target,
          );
          if (target) {
            matchedSupplierId = target.id;
            supplierName = target.name;
          }
        }
      }

      if (items.length === 0) {
        // Send back the raw text so you can debug what Tesseract actually saw!
        return res.status(400).json({
          error:
            "Failed to extract line items. OCR Output for debugging:\n" +
            text.substring(0, 500),
        });
      }

      const subtotal = items.reduce(
        (acc, curr) => acc + curr.qty * curr.costPrice,
        0,
      );
      const gstAmount = items.reduce(
        (acc, curr) =>
          acc + curr.qty * curr.costPrice * (curr.taxPercent / 100),
        0,
      );

      res.json({
        supplierId: matchedSupplierId,
        supplierName,
        invoiceNo,
        date,
        paymentMode: "credit",
        items,
        subtotal,
        gstAmount,
        discount: 0,
        total: subtotal + gstAmount,
      });
    } catch (err) {
      if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
      if (fs.existsSync(processedFilePath)) fs.unlinkSync(processedFilePath);
      res.status(500).json({ error: "Failed to extract text: " + err.message });
    } finally {
      if (worker) await worker.terminate();
    }
  },
);

// Direct Purchase Bill Entry
// This saves the bill and instantly updates inventory and supplier ledger.
router.post("/direct-purchase", protect, requirePermission("inventory.write"), idempotency, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      supplierId,
      supplierName,
      items,
      subtotal,
      gstAmount,
      discount,
      total,
      paymentMode,
      invoiceNo,
      date,
    } = req.body;

    // Create the Purchase Order but mark it immediately as "received"
    const order = await PurchaseOrder.create({
      poNumber: invoiceNo || genPO(),
      supplierId,
      supplierName,
      items,
      subtotal,
      gstAmount,
      discount,
      total,
      paymentMode,
      status: "received",
      receivedDate: date || new Date(),
      branchId: req.user.branchId,
    }, { transaction: t });

    // Update supplier balance if bought on credit
    if (paymentMode === "credit") {
      await Supplier.increment("balance", {
        by: total,
        where: { id: supplierId },
        transaction: t
      });
    }

    // Add each item to inventory instantly
    for (const item of items || []) {
      const existing = await Item.findOne({
        where: branchWhere(req, { name: item.name, batch: item.batch || null }),
      });
      if (existing) {
        await existing.update({
          stock_qty: existing.stock_qty + parseInt(item.qty || 1),
          scheme_qty: existing.scheme_qty + parseInt(item.schemeQty || 0)
        }, { transaction: t });
        
        await stockMovement.recordIn(existing, parseInt(item.qty || 1) + parseInt(item.schemeQty || 0), "purchase", order.id, req.user ? req.user.id : null, "Direct purchase", t);
      } else {
        const newItem = await Item.create({
          name: item.name,
          batch: item.batch || "",
          category: item.category || "",
          hsn: item.hsn || "",
          pack: item.pack || "",
          stock_qty: parseInt(item.qty || 1),
          scheme_qty: parseInt(item.schemeQty || 0),
          unit: item.unit || "units",
          expiry: item.expiry || null,
          mrp: item.mrp || 0,
          selling_price: item.selling_price || item.mrp || 0,
          cost_price: item.costPrice || 0,
          branchId: req.user.branchId,
        }, { transaction: t });
        
        await stockMovement.recordIn(newItem, parseInt(item.qty || 1) + parseInt(item.schemeQty || 0), "purchase", order.id, req.user ? req.user.id : null, "Direct purchase (New item)", t);
      }
    }

    // Auto-create double-entry journal for purchase
    await accounting.postPurchaseJournal(order, t);

    // Audit log
    await AuditLog.create({
      userId: req.user ? req.user.id : null,
      action: "create",
      entityType: "PurchaseOrder",
      entityId: order.id,
      newValues: order.toJSON()
    }, { transaction: t });

    await t.commit();

    res.json({
      message: "Purchase Bill saved and Inventory updated successfully!",
      order,
    });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
