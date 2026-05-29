const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Warehouse = sequelize.define("Warehouse", {
  name: { type: DataTypes.STRING, allowNull: false },
  location: { type: DataTypes.STRING }
});

module.exports = Warehouse;
