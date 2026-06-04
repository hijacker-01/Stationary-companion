const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const WarehouseBin = sequelize.define("WarehouseBin", {
  bin_code:     { type: DataTypes.STRING, allowNull: false, unique: true },
  zone:         { type: DataTypes.STRING, allowNull: false },
  rack:         { type: DataTypes.STRING, allowNull: false },
  shelf:        { type: DataTypes.STRING, allowNull: false },
  capacityUsed: { type: DataTypes.INTEGER, defaultValue: 0 },
  accessCount:  { type: DataTypes.INTEGER, defaultValue: 0 },
  itemCount:    { type: DataTypes.INTEGER, defaultValue: 0 },
  temperature:  { type: DataTypes.DECIMAL(15, 2), defaultValue: 22.0 },
  humidity:     { type: DataTypes.DECIMAL(15, 2), defaultValue: 45.0 }
});

module.exports = WarehouseBin;
