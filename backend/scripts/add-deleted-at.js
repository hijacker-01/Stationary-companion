require('dotenv').config({ path: __dirname + '/../.env' });
const sequelize = require('../config/db');
const { QueryTypes } = require('sequelize');

async function checkAndAddCol(table) {
  try {
    const cols = await sequelize.query(`SELECT column_name FROM information_schema.columns WHERE table_name='${table}'`, { type: QueryTypes.SELECT });
    const hasDeletedAt = cols.some(c => c.column_name === 'deletedAt');
    if (!hasDeletedAt) {
      await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN "deletedAt" TIMESTAMP WITH TIME ZONE`);
      console.log(`Added deletedAt to ${table}`);
    } else {
      console.log(`${table} already has deletedAt`);
    }
  } catch(e) {
    console.error(`Failed to alter ${table}:`, e.message);
  }
}

async function run() {
  await checkAndAddCol('Customers');
  await checkAndAddCol('Items');
  process.exit(0);
}
run();
