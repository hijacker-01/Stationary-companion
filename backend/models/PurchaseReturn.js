const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PurchaseReturn = sequelize.define("PurchaseReturn", {
  returnNo:     { type: DataTypes.STRING, unique: true },
  originalPoNo: { type: DataTypes.STRING },
  supplierName: { type: DataTypes.STRING, allowNull: false },
  items:        { type: DataTypes.JSON },
  subtotal:     { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  gstAmount:    { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  totalAmount:  { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  reason:       { type: DataTypes.STRING },
  status:       { type: DataTypes.ENUM("pending","approved"), defaultValue: "approved" },
});

module.exports = PurchaseReturn;
