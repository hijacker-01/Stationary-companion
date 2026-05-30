const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Webhook = sequelize.define("Webhook", {
  name:          { type: DataTypes.STRING },
  url:           { type: DataTypes.STRING, allowNull: false },
  events:        { type: DataTypes.JSON, defaultValue: [] },
  secret:        { type: DataTypes.STRING },
  isActive:      { type: DataTypes.BOOLEAN, defaultValue: true },
  lastTriggered: { type: DataTypes.DATE },
  failureCount:  { type: DataTypes.INTEGER, defaultValue: 0 },
  createdBy:     { type: DataTypes.STRING },
});

module.exports = Webhook;
