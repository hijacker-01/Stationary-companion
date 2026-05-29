const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Vehicle = sequelize.define("Vehicle", {
  type: { type: DataTypes.STRING },
  capacity: { type: DataTypes.FLOAT },
  reg_no: { type: DataTypes.STRING, allowNull: false }
});

module.exports = Vehicle;
