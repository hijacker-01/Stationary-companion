const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AutomationLog = sequelize.define("AutomationLog", {
  ruleId:    { type: DataTypes.INTEGER, allowNull: false },
  ruleName:  { type: DataTypes.STRING },
  trigger:   { type: DataTypes.STRING },
  action:    { type: DataTypes.STRING },
  payload:   { type: DataTypes.JSON, defaultValue: {} },
  result:    { type: DataTypes.ENUM("success", "failure", "skipped"), defaultValue: "success" },
  error:     { type: DataTypes.TEXT },
  executedAt:{ type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = AutomationLog;
