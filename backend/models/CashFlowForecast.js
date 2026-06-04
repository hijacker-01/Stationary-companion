const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CashFlowForecast = sequelize.define("CashFlowForecast", {
  date:             { type: DataTypes.DATEONLY, allowNull: false },
  period:           { type: DataTypes.ENUM("7d", "30d", "60d", "90d"), allowNull: false },
  predictedInflow:  { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  predictedOutflow: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  netPosition:      { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  confidence:       { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  factors:          { type: DataTypes.JSON, defaultValue: {} },
  generatedAt:      { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = CashFlowForecast;
