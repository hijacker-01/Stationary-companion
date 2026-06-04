const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SalesChallan = sequelize.define("SalesChallan", {
  challanNo:     { type: DataTypes.STRING, unique: true },
  customerId:    { type: DataTypes.INTEGER, references: { model: 'Customers', key: 'id' } },
  customerName:  { type: DataTypes.STRING, allowNull: false },
  customerPhone: { type: DataTypes.STRING },
  customerAddress: { type: DataTypes.STRING },
  customerGst:   { type: DataTypes.STRING },
  customerDl:    { type: DataTypes.STRING },
  date:          { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  items:         { type: DataTypes.JSON }, // [{name, batch, expiry, qty, rate, mrp, gstPct, discount, amount}]
  subtotal:      { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  gstAmount:     { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  discount:      { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  total:         { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  paymentMode:   { type: DataTypes.STRING, defaultValue: 'cash' },
  status:        { type: DataTypes.ENUM("draft","pending","invoiced","cancelled"), defaultValue: "draft" },
  invoicedAt:    { type: DataTypes.DATE },
  dueDate:       { type: DataTypes.DATEONLY },
  transportDetails: { type: DataTypes.STRING, defaultValue: 'Hand Delivery' },
  salesmanId:    { type: DataTypes.INTEGER },
  salesmanName:  { type: DataTypes.STRING },
  billId:        { type: DataTypes.INTEGER },
  notes:         { type: DataTypes.TEXT },
  userId:        { type: DataTypes.INTEGER },
}, {
  indexes: [
    { fields: ['customerId'] },
    { fields: ['status'] }
  ]
});

module.exports = SalesChallan;
