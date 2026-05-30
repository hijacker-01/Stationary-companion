const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AutomationRule = sequelize.define("AutomationRule", {
  name:           { type: DataTypes.STRING, allowNull: false },
  description:    { type: DataTypes.TEXT },
  trigger:        { type: DataTypes.ENUM("invoice_created", "stock_below_reorder", "payment_overdue", "expiry_approaching", "high_value_invoice", "payment_received", "purchase_created", "custom"), allowNull: false },
  triggerConfig:  { type: DataTypes.JSON, defaultValue: {} },
  action:         { type: DataTypes.ENUM("send_whatsapp", "create_po", "notify_manager", "apply_discount", "create_task", "webhook", "email", "log"), allowNull: false },
  actionConfig:   { type: DataTypes.JSON, defaultValue: {} },
  isActive:       { type: DataTypes.BOOLEAN, defaultValue: true },
  executionCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastExecuted:   { type: DataTypes.DATE },
  createdBy:      { type: DataTypes.STRING },
});

module.exports = AutomationRule;
