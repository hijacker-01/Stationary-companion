const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Customer = sequelize.define("Customer", {
  name:          { type: DataTypes.STRING, allowNull: false },
  phone:         { type: DataTypes.STRING },
  email:         { type: DataTypes.STRING },
  address:       { type: DataTypes.STRING },
  gstNumber:     { type: DataTypes.STRING },
  dlNumber:      { type: DataTypes.STRING },
  creditLimit:   { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  creditDays:    { type: DataTypes.INTEGER, defaultValue: 30 },
  openingBalance:{ type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  balance:       { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  totalPurchased:{ type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  totalPaid:     { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  status:        { type: DataTypes.ENUM("active","inactive"), defaultValue: "active" },
  legalName:     { type: DataTypes.STRING },
  tradeName:     { type: DataTypes.STRING },
  stateCode:     { type: DataTypes.STRING(2) },
  registrationType: { type: DataTypes.ENUM("regular", "composition", "unregistered", "consumer"), defaultValue: "regular" },
  isComposition: { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive:      { type: DataTypes.BOOLEAN, defaultValue: true },
  branchId:      { type: DataTypes.INTEGER, allowNull: false },
}, {
  paranoid: true,
  indexes: [
    { fields: ['branchId', 'id'] }
  ]
});

module.exports = Customer;
