const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ComplianceRule = sequelize.define("ComplianceRule", {
  ruleName: { type: DataTypes.STRING, allowNull: false, unique: true },
  ruleType: { type: DataTypes.STRING }, // e.g., expiry_check, schedule_x_prescription, credit_limit
  severity: { 
    type: DataTypes.ENUM("CRITICAL", "HIGH", "MEDIUM", "LOW"), 
    allowNull: false 
  },
  actionToTake: { 
    type: DataTypes.ENUM("BLOCK", "APPROVAL_REQUIRED", "WARNING", "ALERT"), 
    allowNull: false 
  },
  approvalLevel: { type: DataTypes.STRING }, // e.g., 'manager', 'admin'
  requiresAudit: { type: DataTypes.BOOLEAN, defaultValue: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  config: { type: DataTypes.JSON } // Any thresholds or specific conditions
});

module.exports = ComplianceRule;
