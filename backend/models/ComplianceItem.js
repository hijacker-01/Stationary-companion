const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ComplianceItem = sequelize.define("ComplianceItem", {
  type:        { type: DataTypes.ENUM("drug_license", "gst_cert", "fssai", "schedule_h_register", "cold_chain_cert", "fire_safety", "trade_license"), allowNull: false },
  documentNo:  { type: DataTypes.STRING },
  title:       { type: DataTypes.STRING, allowNull: false },
  issuedBy:    { type: DataTypes.STRING },
  validFrom:   { type: DataTypes.DATEONLY },
  validTo:     { type: DataTypes.DATEONLY },
  status:      { type: DataTypes.ENUM("valid", "expiring_soon", "expired", "pending_renewal"), defaultValue: "valid" },
  alertDays:   { type: DataTypes.INTEGER, defaultValue: 30 },
  filePath:    { type: DataTypes.STRING },
  branchId:    { type: DataTypes.INTEGER },
  notes:       { type: DataTypes.TEXT },
});

module.exports = ComplianceItem;
