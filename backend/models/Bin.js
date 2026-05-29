const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Bin = sequelize.define("Bin", {
  warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
  zone: { type: DataTypes.STRING },
  rack: { type: DataTypes.STRING },
  shelf: { type: DataTypes.STRING },
  bin_code: { type: DataTypes.STRING, allowNull: false }
});

module.exports = Bin;
