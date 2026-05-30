const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Bin = sequelize.define("Bin", {
  warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
  zone: { type: DataTypes.STRING },
  rack: { type: DataTypes.STRING },
  shelf: { type: DataTypes.STRING },
  bin_code: { type: DataTypes.STRING, allowNull: false },
  temperature: { type: DataTypes.FLOAT },
  humidity: { type: DataTypes.FLOAT },
  lastAccessed: { type: DataTypes.DATE },
  accessCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  itemCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  capacityUsed: { type: DataTypes.FLOAT, defaultValue: 0 },
  itemsStored: { type: DataTypes.JSON, defaultValue: [] }
});

module.exports = Bin;
