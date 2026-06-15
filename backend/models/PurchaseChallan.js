const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PurchaseChallan = sequelize.define("PurchaseChallan", {
  challanNo:       { type: DataTypes.STRING }, // unique per branch — see composite index
  supplierId:      { type: DataTypes.INTEGER },
  supplierName: { type: DataTypes.STRING, allowNull: false },
  supplierPhone: { type: DataTypes.STRING },
  supplierAddress: { type: DataTypes.TEXT },
  supplierDl: { type: DataTypes.STRING },
  supplierGst: { type: DataTypes.STRING },
  date:         { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  items:           { type: DataTypes.JSON }, // [{name, batch, expiry, qty, rate, mrp, gstPct, amount}]
  subtotal:     { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  gstAmount:    { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  discount:     { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  total:        { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  paymentMode:  { type: DataTypes.STRING, defaultValue: 'cash' },
  status:       { type: DataTypes.ENUM("draft", "pending", "converted", "cancelled"), defaultValue: "draft" },
  invoiceNo:    { type: DataTypes.STRING },
  dueDate:      { type: DataTypes.DATEONLY },
  transportDetails: { type: DataTypes.STRING },
  salesmanId:   { type: DataTypes.INTEGER },
  salesmanName: { type: DataTypes.STRING },
  convertedAt:  { type: DataTypes.DATE },
  purchaseOrderId: { type: DataTypes.INTEGER },
  notes:           { type: DataTypes.TEXT },
  userId:          { type: DataTypes.INTEGER },
  branchId:        { type: DataTypes.INTEGER, allowNull: false },
}, {
  indexes: [
    { fields: ['supplierId'] },
    { fields: ['status'] },
    { fields: ['branchId', 'id'] },
    { unique: true, fields: ['branchId', 'challanNo'] }
  ]
});

module.exports = PurchaseChallan;
