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
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  sgstRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  igstRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  cessRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
});

module.exports = GSTCategory;
