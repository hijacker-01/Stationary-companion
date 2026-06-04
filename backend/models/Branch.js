const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Branch = sequelize.define("Branch", {
  name:       { type: DataTypes.STRING, allowNull: false },
  code:       { type: DataTypes.STRING, unique: true, allowNull: false },
  city:       { type: DataTypes.STRING },
  state:      { type: DataTypes.STRING },
  address:    { type: DataTypes.TEXT },
  gstNumber:  { type: DataTypes.STRING },
  phone:      { type: DataTypes.STRING },
  managerId:  { type: DataTypes.INTEGER },
  managerName:{ type: DataTypes.STRING },
  lat:        { type: DataTypes.DECIMAL(15, 2) },
  lng:        { type: DataTypes.DECIMAL(15, 2) },
  isActive:   { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = Branch;
