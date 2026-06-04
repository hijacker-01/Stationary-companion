const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Bill = sequelize.define("Bill", {
  billNo:       { type: DataTypes.STRING, unique: true },
  customerId:   { type: DataTypes.INTEGER, references: { model: 'Customers', key: 'id' } },
  customerName: { type: DataTypes.STRING, allowNull: false },
  customerPhone:{ type: DataTypes.STRING },
  customerAddress: { type: DataTypes.STRING },
  customerDl:   { type: DataTypes.STRING },
  customerGst:  { type: DataTypes.STRING },
  items:        { type: DataTypes.JSON },
  subtotal:     { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  gstAmount:    { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  discount:     { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  total:        { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  paymentMode:  { type: DataTypes.ENUM("cash", "upi", "card", "credit"), defaultValue: "cash" },
  status:       { type: DataTypes.ENUM("paid", "unpaid", "partial"), defaultValue: "paid" },
  dueDate:      { type: DataTypes.DATEONLY },
  transportDetails: { type: DataTypes.STRING },
  salesmanId:   { type: DataTypes.INTEGER, references: { model: 'Salesmans', key: 'id' } },
  salesmanName: { type: DataTypes.STRING },
  deliveryManId: { type: DataTypes.INTEGER },
  deliveryManName: { type: DataTypes.STRING },
  deliveryStatus: { type: DataTypes.ENUM("pending", "dispatched", "delivered", "returned"), defaultValue: "pending" },
  cgstAmount:   { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  sgstAmount:   { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  igstAmount:   { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  cessAmount:   { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  irn:          { type: DataTypes.STRING(64) },
  ewbNumber:    { type: DataTypes.STRING(15) },
}, {
  paranoid: true
});

module.exports = Bill;
