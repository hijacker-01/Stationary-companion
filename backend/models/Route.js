const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Route = sequelize.define("Route", {
  driver_id: { type: DataTypes.INTEGER, allowNull: false },
  vehicle_id: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.STRING }
});

module.exports = Route;
