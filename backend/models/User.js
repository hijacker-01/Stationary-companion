const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  name:        { type: DataTypes.STRING, allowNull: false },
  email:       { type: DataTypes.STRING, unique: true, allowNull: false },
  password:    { type: DataTypes.STRING, allowNull: false },
  role:        { type: DataTypes.ENUM("admin", "manager", "staff"), defaultValue: "staff" },
  phone:       { type: DataTypes.STRING },
  permissions: { type: DataTypes.JSON, defaultValue: [] },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = User;