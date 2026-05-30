const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Plugin = sequelize.define("Plugin", {
  name:        { type: DataTypes.STRING, allowNull: false, unique: true },
  version:     { type: DataTypes.STRING, defaultValue: "1.0.0" },
  author:      { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  entryPoint:  { type: DataTypes.STRING },
  hooks:       { type: DataTypes.JSON, defaultValue: [] },
  config:      { type: DataTypes.JSON, defaultValue: {} },
  permissions: { type: DataTypes.JSON, defaultValue: [] },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: false },
  installedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = Plugin;
