const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const RFQ = sequelize.define("RFQ", {
  rfqNumber:    { type: DataTypes.STRING, unique: true },
  itemId:       { type: DataTypes.INTEGER },
  itemName:     { type: DataTypes.STRING, allowNull: false },
  requiredQty:  { type: DataTypes.INTEGER, allowNull: false },
  currentStock: { type: DataTypes.INTEGER, defaultValue: 0 },
  urgency:      { type: DataTypes.ENUM("low", "medium", "high", "critical"), defaultValue: "medium" },
  status:       { type: DataTypes.ENUM("draft", "sent", "received", "compared", "converted", "expired"), defaultValue: "draft" },
  deadline:     { type: DataTypes.DATEONLY },
  bestSupplierId:   { type: DataTypes.INTEGER },
  bestSupplierName: { type: DataTypes.STRING },
  bestLandedCost:   { type: DataTypes.DECIMAL(15, 2) },
  responsesCount:   { type: DataTypes.INTEGER, defaultValue: 0 },
  createdBy:    { type: DataTypes.STRING },
  notes:        { type: DataTypes.TEXT },
});

module.exports = RFQ;
