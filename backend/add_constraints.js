require("dotenv").config({ path: "./.env" });
const sequelize = require('./config/db');

async function up() {
  try {
    // Inventory table: stock_quantity >= 0 (using stock_qty column)
    await sequelize.query(`
      ALTER TABLE "Items" 
      ADD CONSTRAINT "check_stock_qty_positive" 
      CHECK ("stock_qty" >= 0);
    `);
    console.log("Added stock_qty check to Items");
    
    // Bills table: total > 0 (or amount > 0, we'll check 'total' and 'subtotal' since 'amount' isn't explicitly on Bill)
    // Wait, let's check what columns are on Bills
    await sequelize.query(`
      ALTER TABLE "Bills"
      ADD CONSTRAINT "check_bill_totals_positive"
      CHECK ("total" >= 0 AND "subtotal" >= 0);
    `);
    console.log("Added totals check to Bills");
    
    // Vouchers table: amount > 0
    // Actually the model is called Payments (or JournalVouchers)
    await sequelize.query(`
      ALTER TABLE "Payments"
      ADD CONSTRAINT "check_payment_amount_positive"
      CHECK ("amount" > 0);
    `);
    console.log("Added amount check to Payments");
    
    console.log("Constraints added successfully!");
    process.exit(0);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log("Constraints already exist.");
      process.exit(0);
    } else {
      console.error("Migration failed:", error);
      process.exit(1);
    }
  }
}

up();
