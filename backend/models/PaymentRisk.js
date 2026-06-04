const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PaymentRisk = sequelize.define("PaymentRisk", {
  customerId:       { type: DataTypes.INTEGER, allowNull: false },
  customerName:     { type: DataTypes.STRING },
  riskScore:        { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  riskLevel:        { type: DataTypes.ENUM("low", "medium", "high", "critical"), defaultValue: "low" },
  avgDelayDays:     { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  totalOutstanding: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  overdueAmount:    { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  predictedDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
  lastAssessed:     { type: DataTypes.DATE },
  factors:          { type: DataTypes.JSON, defaultValue: {} },
});

module.exports = PaymentRisk;
