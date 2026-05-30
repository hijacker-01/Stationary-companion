const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ComplianceAlert = sequelize.define("ComplianceAlert", {
  complianceItemId: { type: DataTypes.INTEGER, allowNull: false },
  alertType:     { type: DataTypes.ENUM("expiry_warning", "violation", "audit_due", "renewal_pending", "missing_document"), allowNull: false },
  message:       { type: DataTypes.TEXT, allowNull: false },
  severity:      { type: DataTypes.ENUM("critical", "high", "medium", "low"), defaultValue: "medium" },
  isAcknowledged:{ type: DataTypes.BOOLEAN, defaultValue: false },
  acknowledgedBy:{ type: DataTypes.STRING },
  acknowledgedAt:{ type: DataTypes.DATE },
  dueDate:       { type: DataTypes.DATEONLY },
});

module.exports = ComplianceAlert;
