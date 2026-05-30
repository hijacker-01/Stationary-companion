const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SalesChallan = sequelize.define("SalesChallan", {
  challanNo:     { type: DataTypes.STRING, unique: true },
  customerId:    { type: DataTypes.INTEGER, references: { model: 'Customers', key: 'id' } },
  customerName:  { type: DataTypes.STRING, allowNull: false },
  customerPhone: { type: DataTypes.STRING },
  customerGst:   { type: DataTypes.STRING },
  customerDl:    { type: DataTypes.STRING },
  date:          { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  items:         { type: DataTypes.JSON }, // [{name, batch, expiry, qty, rate, mrp, gstPct, discount, amount}]
  subtotal:      { type: DataTypes.FLOAT, defaultValue: 0 },
  gstAmount:     { type: DataTypes.FLOAT, defaultValue: 0 },
  discount:      { type: DataTypes.FLOAT, defaultValue: 0 },
  total:         { type: DataTypes.FLOAT, defaultValue: 0 },
  status:        { type: DataTypes.ENUM("draft","pending","invoiced","cancelled"), defaultValue: "draft" },
  invoicedAt:    { type: DataTypes.DATE },
  billId:        { type: DataTypes.INTEGER },
  notes:         { type: DataTypes.TEXT },
  userId:        { type: DataTypes.INTEGER },
});

module.exports = SalesChallan;
