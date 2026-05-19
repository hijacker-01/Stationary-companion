const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SalesReturn = sequelize.define("SalesReturn", {
  returnNo:       { type: DataTypes.STRING, unique: true },
  originalBillNo: { type: DataTypes.STRING },
  originalBillId: { type: DataTypes.INTEGER },
  customerName:   { type: DataTypes.STRING, allowNull: false },
  customerPhone:  { type: DataTypes.STRING },
  items:          { type: DataTypes.JSON },  // array of returned items
  subtotal:       { type: DataTypes.FLOAT, defaultValue: 0 },
  gstAmount:      { type: DataTypes.FLOAT, defaultValue: 0 },
  totalAmount:    { type: DataTypes.FLOAT, defaultValue: 0 },
  reason:         { type: DataTypes.STRING },
  status:         { type: DataTypes.ENUM("pending","approved","rejected"), defaultValue: "approved" },
  restockItems:   { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = SalesReturn;
