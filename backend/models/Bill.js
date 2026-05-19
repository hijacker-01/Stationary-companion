const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Bill = sequelize.define("Bill", {
  billNo:       { type: DataTypes.STRING, unique: true },
  customerName: { type: DataTypes.STRING, allowNull: false },
  customerPhone:{ type: DataTypes.STRING },
  customerAddress: { type: DataTypes.STRING },
  customerDl:   { type: DataTypes.STRING },
  customerGst:  { type: DataTypes.STRING },
  items:        { type: DataTypes.JSON },
  subtotal:     { type: DataTypes.FLOAT, defaultValue: 0 },
  gstAmount:    { type: DataTypes.FLOAT, defaultValue: 0 },
  discount:     { type: DataTypes.FLOAT, defaultValue: 0 },
  total:        { type: DataTypes.FLOAT, defaultValue: 0 },
  paymentMode:  { type: DataTypes.ENUM("cash", "upi", "card", "credit"), defaultValue: "cash" },
  status:       { type: DataTypes.ENUM("paid", "unpaid", "partial"), defaultValue: "paid" },
  dueDate:      { type: DataTypes.DATEONLY },
  transportDetails: { type: DataTypes.STRING },
  salesmanId:   { type: DataTypes.INTEGER },
  salesmanName: { type: DataTypes.STRING },
});

module.exports = Bill;