// Migration: make document-number / identity uniqueness branch-scoped.
//
// Phase 1 made document-number sequences per-branch (so each branch/GSTIN gets
// its own INV-/PCH-/JV- numbering), but the underlying columns still had a
// GLOBAL unique constraint — so the moment a second branch issued the same
// number it would collide. Likewise Items were globally unique on (name,batch),
// which wrongly stopped two branches from stocking the same product.
//
// This script, for each affected table:
//   1. Drops EVERY single-/old-column unique constraint on the target column(s)
//      — there are hundreds of duplicates from repeated sequelize.sync({alter}).
//   2. Creates ONE composite unique index that includes branchId.
//
// Idempotent: safe to re-run. Follows the existing add_constraints.js pattern.

require("dotenv").config();
const sequelize = require("./config/db");
const { QueryTypes } = require("sequelize");

// table -> { oldCols: columns of the global unique to remove, newCols: composite to create }
const TARGETS = [
  { table: "Bills",            oldCols: ["billNo"],        newCols: ["branchId", "billNo"] },
  { table: "SalesChallans",    oldCols: ["challanNo"],     newCols: ["branchId", "challanNo"] },
  { table: "PurchaseChallans", oldCols: ["challanNo"],     newCols: ["branchId", "challanNo"] },
  { table: "Payments",         oldCols: ["voucherNo"],     newCols: ["branchId", "voucherNo"] },
  { table: "JournalVouchers",  oldCols: ["jvNo"],          newCols: ["branchId", "jvNo"] },
  { table: "SalesReturns",     oldCols: ["returnNo"],      newCols: ["branchId", "returnNo"] },
  { table: "PurchaseReturns",  oldCols: ["returnNo"],      newCols: ["branchId", "returnNo"] },
  { table: "PurchaseOrders",   oldCols: ["poNumber"],      newCols: ["branchId", "poNumber"] },
  { table: "Items",            oldCols: ["name", "batch"], newCols: ["branchId", "name", "batch"] },
];

const sortedEq = (a, b) => a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");

async function colsOfConstraint(table, conkey) {
  const rows = await sequelize.query(
    `SELECT att.attname FROM unnest(:conkey::int[]) WITH ORDINALITY AS k(attnum, ord)
     JOIN pg_class rel ON rel.relname = :table
     JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = k.attnum
     ORDER BY k.ord`,
    { replacements: { conkey: `{${conkey.join(",")}}`, table }, type: QueryTypes.SELECT }
  );
  return rows.map((r) => r.attname);
}

async function run() {
  await sequelize.authenticate();
  console.log("Connected. Rebuilding branch-scoped uniqueness…\n");

  for (const { table, oldCols, newCols } of TARGETS) {
    // 1. Drop all unique CONSTRAINTS whose column set matches oldCols.
    const constraints = await sequelize.query(
      `SELECT con.conname, con.conkey
       FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid
       WHERE con.contype = 'u' AND rel.relname = :table`,
      { replacements: { table }, type: QueryTypes.SELECT }
    );
    let droppedC = 0;
    for (const c of constraints) {
      const conkey = Array.isArray(c.conkey) ? c.conkey : String(c.conkey).replace(/[{}]/g, "").split(",").map(Number);
      const cols = await colsOfConstraint(table, conkey);
      if (sortedEq(cols, oldCols)) {
        await sequelize.query(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${c.conname}"`);
        droppedC++;
      }
    }

    // 2. Drop any remaining unique INDEXES (not backed by a constraint) on oldCols.
    const indexes = await sequelize.query(
      `SELECT i.relname AS indexname, array_agg(a.attname ORDER BY k.ord) AS cols
       FROM pg_index ix
       JOIN pg_class i ON i.oid = ix.indexrelid
       JOIN pg_class t ON t.oid = ix.indrelid
       JOIN unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord) ON true
       JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
       WHERE t.relname = :table AND ix.indisunique AND NOT ix.indisprimary
       GROUP BY i.relname`,
      { replacements: { table }, type: QueryTypes.SELECT }
    );
    let droppedI = 0;
    for (const idx of indexes) {
      // pg may return array_agg as a JS array or as a "{a,b}" literal string.
      const cols = Array.isArray(idx.cols) ? idx.cols : String(idx.cols).replace(/[{}]/g, "").split(",").filter(Boolean);
      if (sortedEq(cols, oldCols)) {
        await sequelize.query(`DROP INDEX IF EXISTS "${idx.indexname}" CASCADE`);
        droppedI++;
      }
    }

    // 3. Create the composite unique index (if it doesn't already exist).
    const idxName = `${table}_branch_${newCols.filter((c) => c !== "branchId").join("_")}_uniq`;
    const colList = newCols.map((c) => `"${c}"`).join(", ");
    await sequelize.query(`CREATE UNIQUE INDEX IF NOT EXISTS "${idxName}" ON "${table}" (${colList})`);

    console.log(`✓ ${table}: dropped ${droppedC} constraint(s) + ${droppedI} index(es) on (${oldCols.join(",")}); composite unique (${newCols.join(",")}) ensured`);
  }

  console.log("\nDone.");
  await sequelize.close();
}

run().catch(async (e) => {
  console.error("Migration failed:", e.message);
  try { await sequelize.close(); } catch {}
  process.exit(1);
});
