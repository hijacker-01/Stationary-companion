const sequelize = require('./config/db');

async function fixSupplier() {
  try {
    await sequelize.query(`ALTER TABLE "Suppliers" ADD COLUMN IF NOT EXISTS "rating" INTEGER DEFAULT 5;`);
    console.log("Added rating to Suppliers");
  } catch (err) {
    console.error("Error:", err.message);
  }
}

fixSupplier().then(() => process.exit(0));
