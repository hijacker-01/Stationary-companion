const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const { protect } = require("../middleware/auth");
const { branchWhere } = require("../middleware/branchScope");

router.use(protect);

const pick = (obj, keys) => Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]]));
const ALLOWED = ["name","batch","hsn","pack","category","company","stock_qty","scheme_qty","unit","expiry","location","mrp","selling_price","cost_price","purchaseScheme","schedule","reorderPoint"];

// The (branchId, name, batch) unique index also covers soft-deleted rows, so a
// plain create() of a previously-deleted item collides. Look across deleted
// rows: if a soft-deleted match exists, restore it and overwrite with the new
// values instead of failing. Returns [item, created].
async function upsertItem(req, data, { updateActive }) {
  const where = branchWhere(req, { name: data.name, batch: data.batch || null });
  const existing = await Item.findOne({ where, paranoid: false });
  if (existing) {
    if (!existing.deletedAt && !updateActive) {
      // Active duplicate: let the unique constraint surface as before.
      return [await Item.create({ ...data, branchId: req.user.branchId }), true];
    }
    if (existing.deletedAt) await existing.restore();
    await existing.update({ ...data, branchId: req.user.branchId });
    return [existing, false];
  }
  return [await Item.create({ ...data, branchId: req.user.branchId }), true];
}

// Get items (with pagination & search)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    const where = branchWhere(req);
    if (search) {
      const { Op } = require("sequelize");
      where.name = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Item.findAndCountAll({ where, limit: parseInt(limit), offset: parseInt(offset), order: [['name', 'ASC']] });
    
    res.json({
      data: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new item
router.post("/", async (req, res) => {
  try {
    // updateActive:false — re-adding a soft-deleted item restores it, but an
    // active duplicate still trips the unique constraint and returns 400.
    const [item] = await upsertItem(req, pick(req.body, ALLOWED), { updateActive: false });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Bulk import items (from CSV upload on frontend)
const NUMERIC_FIELDS = ["stock_qty", "scheme_qty", "mrp", "selling_price", "cost_price", "reorderPoint"];
const VALID_SCHEDULES = ["None", "H", "H1", "X"];

router.post("/bulk-import", async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    const results = { created: 0, updated: 0, errors: [] };

    for (let i = 0; i < items.length; i++) {
      const raw = items[i] || {};
      try {
        const data = pick(raw, ALLOWED);

        // Drop empty values so model defaults apply
        Object.keys(data).forEach((k) => {
          if (data[k] === "" || data[k] === null || data[k] === undefined) delete data[k];
        });

        if (!data.name || !String(data.name).trim()) {
          results.errors.push({ row: i + 2, error: "Missing item name" });
          continue;
        }

        NUMERIC_FIELDS.forEach((f) => {
          if (data[f] !== undefined) {
            const n = Number(data[f]);
            if (Number.isNaN(n)) {
              throw new Error(`Invalid number for "${f}": ${data[f]}`);
            }
            data[f] = n;
          }
        });

        if (data.schedule && !VALID_SCHEDULES.includes(data.schedule)) {
          throw new Error(`Invalid schedule "${data.schedule}" (must be one of ${VALID_SCHEDULES.join(", ")})`);
        }

        // updateActive:true — bulk import treats an existing (active or
        // soft-deleted) name+batch as an update/restore, not an error.
        const [, created] = await upsertItem(req, data, { updateActive: true });
        if (created) results.created++;
        else results.updated++;
      } catch (err) {
        results.errors.push({ row: i + 2, error: err.message });
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update item
router.put("/:id", async (req, res) => {
  try {
    const [count] = await Item.update(pick(req.body, ALLOWED), { where: branchWhere(req, { id: req.params.id }) });
    if (count === 0) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete item
router.delete("/:id", async (req, res) => {
  try {
    const count = await Item.destroy({ where: branchWhere(req, { id: req.params.id }) });
    if (count === 0) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
