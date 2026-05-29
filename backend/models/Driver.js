const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Driver = sequelize.define("Driver", {
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  license: { type: DataTypes.STRING }
});

module.exports = Driver;
