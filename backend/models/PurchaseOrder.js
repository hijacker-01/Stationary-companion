const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PurchaseOrder = sequelize.define("PurchaseOrder", {
  poNumber:     { type: DataTypes.STRING, unique: true },
  supplierId:   { type: DataTypes.INTEGER, allowNull: false },
  supplierName: { type: DataTypes.STRING },
  items:        { type: DataTypes.JSON },
  subtotal:     { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  gstAmount:    { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  discount:     { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  total:        { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  amountPaid:   { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  balanceDue:   { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  paymentMode:  { type: DataTypes.ENUM("cash","upi","card","credit"), defaultValue: "credit" },
  status:       { type: DataTypes.ENUM("pending","received","partial","cancelled"), defaultValue: "pending" },
  expectedDate: { type: DataTypes.DATEONLY },
  receivedDate: { type: DataTypes.DATEONLY },
  notes:        { type: DataTypes.TEXT },
  source:       { type: DataTypes.ENUM("manual", "ai_auto", "rfq"), defaultValue: "manual" },
  autoScore:    { type: DataTypes.DECIMAL(15, 2) },
  rfqId:        { type: DataTypes.INTEGER },
  cgstAmount:   { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  sgstAmount:   { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  igstAmount:   { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  cessAmount:   { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
}, {
  paranoid: true,
  indexes: [
    { fields: ['supplierId'] },
    { fields: ['status'] }
  ]
});

module.exports = PurchaseOrder;
