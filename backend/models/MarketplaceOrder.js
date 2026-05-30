const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MarketplaceOrder = sequelize.define("MarketplaceOrder", {
  orderNo:       { type: DataTypes.STRING, unique: true },
  customerId:    { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Customers', key: 'id' } },
  customerName:  { type: DataTypes.STRING },
  customerPhone: { type: DataTypes.STRING },
  items:         { type: DataTypes.JSON, defaultValue: [] },
  itemCount:     { type: DataTypes.INTEGER, defaultValue: 0 },
  subtotal:      { type: DataTypes.FLOAT, defaultValue: 0 },
  gstAmount:     { type: DataTypes.FLOAT, defaultValue: 0 },
  total:         { type: DataTypes.FLOAT, defaultValue: 0 },
  status:        { type: DataTypes.ENUM("placed", "confirmed", "processing", "dispatched", "delivered", "cancelled"), defaultValue: "placed" },
  paymentStatus: { type: DataTypes.ENUM("pending", "paid", "partial", "refunded"), defaultValue: "pending" },
  source:        { type: DataTypes.ENUM("app", "whatsapp", "portal", "phone"), defaultValue: "app" },
  deliveryDate:  { type: DataTypes.DATEONLY },
  notes:         { type: DataTypes.TEXT },
});

module.exports = MarketplaceOrder;
