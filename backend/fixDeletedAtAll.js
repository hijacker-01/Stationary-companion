const sequelize = require('./config/db');

async function addDeletedAtToAllTables() {
  const tables = ['Bills', 'Customers', 'Items', 'PurchaseOrders', 'Salesmans', 'Suppliers', 'Users', 'SalesChallans', 'PurchaseChallans'];
  for (const table of tables) {
    try {
      await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN "deletedAt" TIMESTAMP WITH TIME ZONE;`);
      console.log(`Added deletedAt to ${table}`);
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log(`deletedAt already exists on ${table}`);
      } else if (err.message.includes('does not exist')) {
        console.log(`Table ${table} does not exist`);
      } else {
        console.error(`Error on ${table}:`, err.message);
      }
    }
  }
}

addDeletedAtToAllTables().then(() => process.exit(0));
