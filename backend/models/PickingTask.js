const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PickingTask = sequelize.define("PickingTask", {
  taskNo:      { type: DataTypes.STRING, unique: true },
  billId:      { type: DataTypes.INTEGER },
  billNo:      { type: DataTypes.STRING },
  customerName:{ type: DataTypes.STRING },
  items:       { type: DataTypes.JSON, defaultValue: [] },
  itemCount:   { type: DataTypes.INTEGER, defaultValue: 0 },
  assignedTo:  { type: DataTypes.STRING },
  status:      { type: DataTypes.ENUM("pending", "assigned", "in_progress", "completed", "cancelled"), defaultValue: "pending" },
  route:       { type: DataTypes.JSON, defaultValue: [] },
  priority:    { type: DataTypes.ENUM("low", "normal", "high", "urgent"), defaultValue: "normal" },
  startTime:   { type: DataTypes.DATE },
  endTime:     { type: DataTypes.DATE },
  notes:       { type: DataTypes.TEXT },
});

module.exports = PickingTask;
