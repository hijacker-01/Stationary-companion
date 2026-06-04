const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Bin = sequelize.define("Bin", {
  warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
  zone: { type: DataTypes.STRING },
  rack: { type: DataTypes.STRING },
  shelf: { type: DataTypes.STRING },
  bin_code: { type: DataTypes.STRING, allowNull: false },
  temperature: { type: DataTypes.DECIMAL(15, 2) },
  humidity: { type: DataTypes.DECIMAL(15, 2) },
  lastAccessed: { type: DataTypes.DATE },
  accessCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  itemCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  capacityUsed: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  itemsStored: { type: DataTypes.JSON, defaultValue: [] }
});

module.exports = Bin;
