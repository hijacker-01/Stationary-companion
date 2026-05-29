const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AuditLog = sequelize.define("AuditLog", {
  userId: { type: DataTypes.INTEGER },
  action: { type: DataTypes.ENUM("create", "update", "delete"), allowNull: false },
  entityType: { type: DataTypes.STRING, allowNull: false },
  entityId: { type: DataTypes.INTEGER },
  oldValues: { type: DataTypes.JSON },
  newValues: { type: DataTypes.JSON },
  ipAddress: { type: DataTypes.STRING }
});

module.exports = AuditLog;
