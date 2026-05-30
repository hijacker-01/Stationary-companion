const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Supplier = sequelize.define("Supplier", {
  name:         { type: DataTypes.STRING, allowNull: false },
  phone:        { type: DataTypes.STRING },
  email:        { type: DataTypes.STRING },
  address:      { type: DataTypes.STRING },
  gstNumber:    { type: DataTypes.STRING },
  panNumber:    { type: DataTypes.STRING },
  contactPerson:{ type: DataTypes.STRING },
  creditLimit:  { type: DataTypes.FLOAT, defaultValue: 0 },
  creditDays:   { type: DataTypes.INTEGER, defaultValue: 30 },
  openingBalance:{ type: DataTypes.FLOAT, defaultValue: 0 },
  balance:      { type: DataTypes.FLOAT, defaultValue: 0 },
  status:       { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active" },
  legalName:    { type: DataTypes.STRING },
  tradeName:    { type: DataTypes.STRING },
  stateCode:    { type: DataTypes.STRING(2) },
  registrationType: { type: DataTypes.ENUM("regular", "composition", "unregistered", "sez"), defaultValue: "regular" },
});

module.exports = Supplier;