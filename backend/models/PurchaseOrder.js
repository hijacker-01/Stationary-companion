const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PurchaseOrder = sequelize.define("PurchaseOrder", {
  poNumber:     { type: DataTypes.STRING, unique: true },
  supplierId:   { type: DataTypes.INTEGER, allowNull: false },
  supplierName: { type: DataTypes.STRING },
  items:        { type: DataTypes.JSON },
  subtotal:     { type: DataTypes.FLOAT, defaultValue: 0 },
  gstAmount:    { type: DataTypes.FLOAT, defaultValue: 0 },
  discount:     { type: DataTypes.FLOAT, defaultValue: 0 },
  total:        { type: DataTypes.FLOAT, defaultValue: 0 },
  amountPaid:   { type: DataTypes.FLOAT, defaultValue: 0 },
  balanceDue:   { type: DataTypes.FLOAT, defaultValue: 0 },
  paymentMode:  { type: DataTypes.ENUM("cash","upi","card","credit"), defaultValue: "credit" },
  status:       { type: DataTypes.ENUM("pending","received","partial","cancelled"), defaultValue: "pending" },
  expectedDate: { type: DataTypes.DATEONLY },
  receivedDate: { type: DataTypes.DATEONLY },
  notes:        { type: DataTypes.TEXT },
  source:       { type: DataTypes.ENUM("manual", "ai_auto", "rfq"), defaultValue: "manual" },
  autoScore:    { type: DataTypes.FLOAT },
  rfqId:        { type: DataTypes.INTEGER },
  cgstAmount:   { type: DataTypes.FLOAT, defaultValue: 0 },
  sgstAmount:   { type: DataTypes.FLOAT, defaultValue: 0 },
  igstAmount:   { type: DataTypes.FLOAT, defaultValue: 0 },
  cessAmount:   { type: DataTypes.FLOAT, defaultValue: 0 },
});

module.exports = PurchaseOrder;