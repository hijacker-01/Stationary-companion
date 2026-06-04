const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const GSTCategory = sequelize.define("GSTCategory", {
  hsnCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: DataTypes.STRING,
  cgstRate: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  sgstRate: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  igstRate: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  cessRate: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  }
});

module.exports = GSTCategory;
