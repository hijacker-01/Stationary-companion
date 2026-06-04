const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const RFQResponse = sequelize.define("RFQResponse", {
  rfqId:        { type: DataTypes.INTEGER, allowNull: false },
  supplierId:   { type: DataTypes.INTEGER, allowNull: false },
  supplierName: { type: DataTypes.STRING },
  unitPrice:    { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  deliveryDays: { type: DataTypes.INTEGER, defaultValue: 7 },
  freeQty:      { type: DataTypes.INTEGER, defaultValue: 0 },
  discount:     { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  gstPercent:   { type: DataTypes.DECIMAL(15, 2), defaultValue: 12 },
  landedCost:   { type: DataTypes.DECIMAL(15, 2) },
  totalCost:    { type: DataTypes.DECIMAL(15, 2) },
  selected:     { type: DataTypes.BOOLEAN, defaultValue: false },
  notes:        { type: DataTypes.TEXT },
});

module.exports = RFQResponse;
