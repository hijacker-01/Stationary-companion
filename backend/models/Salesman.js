const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Salesman = sequelize.define("Salesman", {
  name:    { type: DataTypes.STRING, allowNull: false },
  phone:   { type: DataTypes.STRING },
  email:   { type: DataTypes.STRING },
  area:    { type: DataTypes.STRING },
  target:  { type: DataTypes.FLOAT, defaultValue: 0 },
  commission: { type: DataTypes.FLOAT, defaultValue: 0 }, // % commission
  isActive:{ type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = Salesman;
