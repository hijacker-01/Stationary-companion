const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const StockAdjustment = sequelize.define("StockAdjustment", {
  itemId:    { type: DataTypes.INTEGER },
  itemName:  { type: DataTypes.STRING },
  batch:     { type: DataTypes.STRING },
  type:      { type: DataTypes.ENUM("increase","decrease"), allowNull: false },
  quantity:  { type: DataTypes.INTEGER, allowNull: false },
  reason:    { type: DataTypes.ENUM("damage","theft","audit","expiry","other"), defaultValue: "other" },
  note:      { type: DataTypes.STRING },
  adjustedBy:{ type: DataTypes.STRING },
});

module.exports = StockAdjustment;
