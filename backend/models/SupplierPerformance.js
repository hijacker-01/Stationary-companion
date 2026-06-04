const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SupplierPerformance = sequelize.define("SupplierPerformance", {
  supplierId:         { type: DataTypes.INTEGER, allowNull: false },
  supplierName:       { type: DataTypes.STRING },
  onTimeDeliveryRate: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  qualityScore:       { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  avgLeadDays:        { type: DataTypes.INTEGER, defaultValue: 0 },
  totalOrders:        { type: DataTypes.INTEGER, defaultValue: 0 },
  fulfilledOrders:    { type: DataTypes.INTEGER, defaultValue: 0 },
  rejectedOrders:     { type: DataTypes.INTEGER, defaultValue: 0 },
  avgDiscount:        { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  overallScore:       { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  lastEvaluated:      { type: DataTypes.DATE },
});

module.exports = SupplierPerformance;
