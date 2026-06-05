const sequelize = require('./config/db');

async function fixAuditLogEnum() {
  try {
    await sequelize.query(`ALTER TYPE "enum_AuditLogs_action" ADD VALUE IF NOT EXISTS 'convert';`);
    await sequelize.query(`ALTER TYPE "enum_AuditLogs_action" ADD VALUE IF NOT EXISTS 'approve';`);
    console.log("Successfully added 'convert' and 'approve' to AuditLog action ENUM");
  } catch (err) {
    console.error("Error:", err.message);
  }
}

fixAuditLogEnum().then(() => process.exit(0));
