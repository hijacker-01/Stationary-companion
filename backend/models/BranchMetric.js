const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BranchMetric = sequelize.define("BranchMetric", {
  branchId:      { type: DataTypes.INTEGER, allowNull: false },
  branchName:    { type: DataTypes.STRING },
  date:          { type: DataTypes.DATEONLY, allowNull: false },
  totalSales:    { type: DataTypes.FLOAT, defaultValue: 0 },
  totalPurchases:{ type: DataTypes.FLOAT, defaultValue: 0 },
  stockValue:    { type: DataTypes.FLOAT, defaultValue: 0 },
  receivables:   { type: DataTypes.FLOAT, defaultValue: 0 },
  payables:      { type: DataTypes.FLOAT, defaultValue: 0 },
  profitMargin:  { type: DataTypes.FLOAT, defaultValue: 0 },
  billCount:     { type: DataTypes.INTEGER, defaultValue: 0 },
  customerCount: { type: DataTypes.INTEGER, defaultValue: 0 },
});

module.exports = BranchMetric;
