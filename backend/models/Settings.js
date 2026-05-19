const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Settings = sequelize.define("Settings", {
  companyName:    { type: DataTypes.STRING, defaultValue: "" },
  companyAddress: { type: DataTypes.STRING, defaultValue: "" },
  companyPhone:   { type: DataTypes.STRING, defaultValue: "" },
  companyEmail:   { type: DataTypes.STRING, defaultValue: "" },
  gstNumber:      { type: DataTypes.STRING, defaultValue: "" },
  panNumber:      { type: DataTypes.STRING, defaultValue: "" },
  stateName:      { type: DataTypes.STRING, defaultValue: "" },
  stateCode:      { type: DataTypes.STRING, defaultValue: "" },
  currency:       { type: DataTypes.STRING, defaultValue: "INR" },
  invoicePrefix:  { type: DataTypes.STRING, defaultValue: "INV" },
  financialYear:  { type: DataTypes.STRING, defaultValue: "2024-25" },
  lowStockAlert:  { type: DataTypes.INTEGER, defaultValue: 10 },
  expiryAlertDays:{ type: DataTypes.INTEGER, defaultValue: 30 },
  printFooter:    { type: DataTypes.STRING, defaultValue: "Thank you for your business!" },
});

module.exports = Settings;