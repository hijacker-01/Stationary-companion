const express = require("express");
const router = express.Router();
const Supplier = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");
const Item = require("../models/Item");
const { protect } = require("../middleware/auth");
const multer = require("multer");
const { createWorker } = require("tesseract.js");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const upload = multer({ dest: path.join(__dirname, "../uploads/") });

const genPO = () => {
  const now = new Date();
  return `PO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// ── SUPPLIERS ──
router.get("/", protect, async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const s = await Supplier.create(req.body);
    res.json(s);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    await Supplier.update(req.body, { where: { id: req.params.id } });
    res.json({ message: "Supplier updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    await Supplier.destroy({ where: { id: req.params.id } });
    res.json({ message: "Supplier deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PURCHASE ORDERS ──
router.get("/orders", protect, async (req, res) => {
  try {
    const orders = await PurchaseOrder.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/orders/:id", protect, async (req, res) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id);
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
    const order = await PurchaseOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Add each item to inventory
    for (const item of order.items || []) {
      const existing = await Item.findOne({
        where: { name: item.name, batch: item.batch || null },
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
    await PurchaseOrder.update(req.body, { where: { id: req.params.id } });
    res.json({ message: "Order updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/orders/:id", protect, async (req, res) => {
  try {
    await PurchaseOrder.destroy({ where: { id: req.params.id } });
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
      // 1. PRE-PROCESS THE IMAGE WITH SHARP
      // This removes shadows and turns the image into pure black text on a white background
      await sharp(rawFilePath)
        // 1. Resize: Tesseract loves images that are roughly 1500-2000px wide.
        // It gives it the "300 DPI" feel it needs to read characters clearly.
        .resize({ width: 1800, withoutEnlargement: true })
        .grayscale()
        // 2. CLAHE: Flattens shadows and balances uneven lighting
        .clahe({ width: 200, height: 200, maxSlope: 3 })
        .normalize()
        // 3. Sharpen: Crisp up the edges of the letters
        .sharpen({ sigma: 1, m1: 2, m2: 2 })
        // 4. Threshold: Now binarize it.
        .threshold(140)
        .toFile(processedFilePath);

      // Initialize Tesseract worker
      // Initialize Tesseract worker
      worker = await createWorker("eng");

      // Add this configuration block
      await worker.setParameters({
        // PSM 6: Assume a single uniform block of text.
        // (Alternatively, try '4' for a single column of text of variable sizes)
        tessedit_pageseg_mode: "6",

        // Whitelist: Stop Tesseract from guessing weird symbols like ™, ©, or œ.
        // Only allow characters that actually appear on an invoice.
        tessedit_char_whitelist:
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/.-% ",
      });

      const {
        data: { text },
      } = await worker.recognize(processedFilePath);

      // Clean up files
      fs.unlinkSync(rawFilePath);
      fs.unlinkSync(processedFilePath);

      const lines = text
        .split("\n")
        .map((l) => l.replace(/\|/g, " ").replace(/\s+/g, " ").trim())
        .filter(Boolean);

      let supplierName = "SUBHASH MEDICOSE";
      let invoiceNo = "INV-" + Math.floor(1000 + Math.random() * 9000);
      let date = new Date().toISOString().split("T")[0];
      let items = [];

      // Header extraction (Your existing logic here is good)
      for (const line of lines) {
        if (line.match(/(?:SUBHASH MEDICOSE|SUBHASH MEDICAL STORE)/i)) {
          supplierName = "SUBHASH MEDICOSE";
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
          const name = match[3].trim();
          // Skip table headers
          if (name.match(/(?:Product|Description|Item|Name)/i)) continue;

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
router.post("/direct-purchase", protect, async (req, res) => {
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
    });

    // Update supplier balance if bought on credit
    if (paymentMode === "credit") {
      await Supplier.increment("balance", {
        by: total,
        where: { id: supplierId },
      });
    }

    // Add each item to inventory instantly
    for (const item of items || []) {
      const existing = await Item.findOne({
        where: { name: item.name, batch: item.batch || null },
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
        });
      }
    }

    res.json({
      message: "Purchase Bill saved and Inventory updated successfully!",
      order,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
