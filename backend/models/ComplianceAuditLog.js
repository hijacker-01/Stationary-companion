const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ComplianceAuditLog = sequelize.define("ComplianceAuditLog", {
  userId: { type: DataTypes.INTEGER },
  moduleName: { type: DataTypes.STRING }, // e.g., Sales, Inventory
  ruleTriggered: { type: DataTypes.STRING }, // e.g., Expired Drug, Credit Limit Exceeded
  severity: { type: DataTypes.STRING },
  actionTaken: { type: DataTypes.STRING }, // BLOCK, WARNING, OVERRIDDEN
  previousState: { type: DataTypes.JSON },
  newState: { type: DataTypes.JSON },
  transactionRef: { type: DataTypes.STRING }, // e.g., Bill No or Item ID
}, {
  updatedAt: false // Audit logs are immutable
});

module.exports = ComplianceAuditLog;
