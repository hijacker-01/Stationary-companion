const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Vehicle = sequelize.define("Vehicle", {
  type: { type: DataTypes.STRING },
  capacity: { type: DataTypes.DECIMAL(15, 2) },
  reg_no: { type: DataTypes.STRING, allowNull: false }
});

module.exports = Vehicle;
