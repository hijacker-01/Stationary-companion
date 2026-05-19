const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Customer = sequelize.define("Customer", {
  name:          { type: DataTypes.STRING, allowNull: false },
  phone:         { type: DataTypes.STRING },
  email:         { type: DataTypes.STRING },
  address:       { type: DataTypes.STRING },
  gstNumber:     { type: DataTypes.STRING },
  creditLimit:   { type: DataTypes.FLOAT, defaultValue: 0 },
  creditDays:    { type: DataTypes.INTEGER, defaultValue: 30 },
  openingBalance:{ type: DataTypes.FLOAT, defaultValue: 0 },
  balance:       { type: DataTypes.FLOAT, defaultValue: 0 },
  totalPurchased:{ type: DataTypes.FLOAT, defaultValue: 0 },
  totalPaid:     { type: DataTypes.FLOAT, defaultValue: 0 },
  status:        { type: DataTypes.ENUM("active","inactive"), defaultValue: "active" },
});

module.exports = Customer;