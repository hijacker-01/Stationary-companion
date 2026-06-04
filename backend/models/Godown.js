const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Godown = sequelize.define("Godown", {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  address: { type: DataTypes.STRING },
  managerName: { type: DataTypes.STRING },
  capacity: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active" },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = Godown;
