require("dotenv").config({ path: "./.env" });
const sequelize = require("./config/db");

// Adds branch-level tenant isolation to the core transactional tables:
// creates a default "HQ" branch, backfills every existing row to it, then
// makes branchId NOT NULL with a composite (branchId, id) index.
const CORE_TABLES = [
  "Users", "Items", "ItemBatches", "Customers", "Suppliers", "Bills",
  "PurchaseOrders", "SalesChallans", "PurchaseChallans", "SalesReturns",
  "PurchaseReturns", "Payments", "JournalVouchers", "StockMovements", "CRMLeads",
];

async function up() {
  try {
    const [existing] = await sequelize.query(`SELECT id FROM "Branches" WHERE code = 'HQ' LIMIT 1;`);
    let branchId;
    if (existing.length) {
      branchId = existing[0].id;
      console.log(`Default branch "HQ" already exists (id=${branchId})`);
    } else {
      const [inserted] = await sequelize.query(
        `INSERT INTO "Branches" (name, code, "isActive", "createdAt", "updatedAt")
         VALUES ('Head Office', 'HQ', true, NOW(), NOW()) RETURNING id;`
      );
      branchId = inserted[0].id;
      console.log(`Created default branch "HQ" (id=${branchId})`);
    }

    for (const table of CORE_TABLES) {
      await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "branchId" INTEGER;`);
      await sequelize.query(`UPDATE "${table}" SET "branchId" = ${branchId} WHERE "branchId" IS NULL;`);
      await sequelize.query(`ALTER TABLE "${table}" ALTER COLUMN "branchId" SET NOT NULL;`);
      await sequelize.query(`CREATE INDEX IF NOT EXISTS "${table.toLowerCase()}_branch_id_idx" ON "${table}" ("branchId", "id");`);
      console.log(`branchId ready on ${table}`);
    }

    console.log("Branch isolation migration complete.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

up();
