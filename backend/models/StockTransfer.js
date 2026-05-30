const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const StockTransfer = sequelize.define("StockTransfer", {
  transferNo:   { type: DataTypes.STRING, unique: true },
  fromBranchId: { type: DataTypes.INTEGER, allowNull: false },
  fromBranch:   { type: DataTypes.STRING },
  toBranchId:   { type: DataTypes.INTEGER, allowNull: false },
  toBranch:     { type: DataTypes.STRING },
  items:        { type: DataTypes.JSON, defaultValue: [] },
  itemCount:    { type: DataTypes.INTEGER, defaultValue: 0 },
  totalValue:   { type: DataTypes.FLOAT, defaultValue: 0 },
  status:       { type: DataTypes.ENUM("draft", "approved", "in_transit", "received", "cancelled"), defaultValue: "draft" },
  requestedBy:  { type: DataTypes.STRING },
  approvedBy:   { type: DataTypes.STRING },
  dispatchDate: { type: DataTypes.DATE },
  receiveDate:  { type: DataTypes.DATE },
  notes:        { type: DataTypes.TEXT },
});

module.exports = StockTransfer;
