const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ItemBatch = sequelize.define("ItemBatch", {
  itemId: { type: DataTypes.INTEGER, allowNull: false },
  batchNo: { type: DataTypes.STRING, allowNull: false },
  expiryDate: { type: DataTypes.DATEONLY },
  mrp: { type: DataTypes.DECIMAL(15, 2) },
  purchaseRate: { type: DataTypes.DECIMAL(15, 2) },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  rackCode: { type: DataTypes.STRING },
  branchId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  indexes: [
    { fields: ['branchId', 'id'] }
  ]
});

module.exports = ItemBatch;
