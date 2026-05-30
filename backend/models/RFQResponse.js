const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const RFQResponse = sequelize.define("RFQResponse", {
  rfqId:        { type: DataTypes.INTEGER, allowNull: false },
  supplierId:   { type: DataTypes.INTEGER, allowNull: false },
  supplierName: { type: DataTypes.STRING },
  unitPrice:    { type: DataTypes.FLOAT, allowNull: false },
  deliveryDays: { type: DataTypes.INTEGER, defaultValue: 7 },
  freeQty:      { type: DataTypes.INTEGER, defaultValue: 0 },
  discount:     { type: DataTypes.FLOAT, defaultValue: 0 },
  gstPercent:   { type: DataTypes.FLOAT, defaultValue: 12 },
  landedCost:   { type: DataTypes.FLOAT },
  totalCost:    { type: DataTypes.FLOAT },
  selected:     { type: DataTypes.BOOLEAN, defaultValue: false },
  notes:        { type: DataTypes.TEXT },
});

module.exports = RFQResponse;
