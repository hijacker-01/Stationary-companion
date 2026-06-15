const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const StockMovement = sequelize.define("StockMovement", {
  itemId: { type: DataTypes.INTEGER, allowNull: false },
  batchNo: { type: DataTypes.STRING },
  type: { type: DataTypes.ENUM("in", "out", "adjust"), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  referenceType: { type: DataTypes.ENUM("sale", "purchase", "return", "adjust"), allowNull: false },
  referenceId: { type: DataTypes.INTEGER },
  userId: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.STRING },
  branchId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  indexes: [
    { fields: ['branchId', 'id'] }
  ]
});

module.exports = StockMovement;
