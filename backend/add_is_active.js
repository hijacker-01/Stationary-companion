require("dotenv").config({ path: "./.env" });
const sequelize = require('./config/db');

async function up() {
  try {
    await sequelize.query(`
      ALTER TABLE "Customers" 
      ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
    `);
    console.log("Added isActive to Customers");
    
    await sequelize.query(`
      ALTER TABLE "Suppliers" 
      ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
    `);
    console.log("Added isActive to Suppliers");
    
    // Update existing records
    await sequelize.query(`UPDATE "Customers" SET "isActive" = true WHERE "isActive" IS NULL;`);
    await sequelize.query(`UPDATE "Suppliers" SET "isActive" = true WHERE "isActive" IS NULL;`);
    
    console.log("Columns added and initialized successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

up();
