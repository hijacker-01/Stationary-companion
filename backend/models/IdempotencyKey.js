const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const IdempotencyKey = sequelize.define("IdempotencyKey", {
  key: { type: DataTypes.STRING, unique: true, allowNull: false },
  responseStatus: { type: DataTypes.INTEGER },
  responseBody: { type: DataTypes.JSON },
  expiresAt: { type: DataTypes.DATE }
});

module.exports = IdempotencyKey;
