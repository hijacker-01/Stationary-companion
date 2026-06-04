const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Salesman = sequelize.define("Salesman", {
  name:    { type: DataTypes.STRING, allowNull: false },
  phone:   { type: DataTypes.STRING },
  email:   { type: DataTypes.STRING },
  area:    { type: DataTypes.STRING },
  target:  { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  commission: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 }, // % commission
  isActive:{ type: DataTypes.BOOLEAN, defaultValue: true },
}, { paranoid: true });

module.exports = Salesman;
