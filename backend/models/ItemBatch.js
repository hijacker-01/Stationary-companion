const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ItemBatch = sequelize.define("ItemBatch", {
  itemId: { type: DataTypes.INTEGER, allowNull: false },
  batchNo: { type: DataTypes.STRING, allowNull: false },
  expiryDate: { type: DataTypes.DATEONLY },
  mrp: { type: DataTypes.FLOAT },
  purchaseRate: { type: DataTypes.FLOAT },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  rackCode: { type: DataTypes.STRING }
});

module.exports = ItemBatch;
