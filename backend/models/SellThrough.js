const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SellThrough = sequelize.define("SellThrough", {
  supplierId:         { type: DataTypes.INTEGER },
  name:               { type: DataTypes.STRING, allowNull: false },
  stockAtDistributor: { type: DataTypes.INTEGER, defaultValue: 0 },
  sold30d:            { type: DataTypes.INTEGER, defaultValue: 0 },
  velocity:           { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  trend:              { type: DataTypes.STRING, defaultValue: "stable" }
});

module.exports = SellThrough;
