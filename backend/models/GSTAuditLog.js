const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const GSTAuditLog = sequelize.define("GSTAuditLog", {
  userId: { type: DataTypes.INTEGER },
  entityType: { type: DataTypes.STRING }, // Customer, Supplier, Item, GSTCategory
  entityId: { type: DataTypes.STRING },
  fieldChanged: { type: DataTypes.STRING }, // e.g., gstin, hsnCode, gstRate
  oldValue: { type: DataTypes.STRING },
  newValue: { type: DataTypes.STRING },
}, {
  updatedAt: false
});

module.exports = GSTAuditLog;
