const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const GSTReturn = sequelize.define("GSTReturn", {
  returnType: { 
    type: DataTypes.ENUM("GSTR-1", "GSTR-3B", "GSTR-9", "GSTR-9C", "GSTR-2A", "GSTR-2B"),
    allowNull: false
  },
  financialYear: { type: DataTypes.STRING(9) }, // e.g., 2026-2027
  period: { type: DataTypes.STRING }, // e.g., 05-2026 (Month) or Q1
  status: { 
    type: DataTypes.ENUM("draft", "filed", "reconciled", "mismatch"),
    defaultValue: "draft"
  },
  snapshotJson: { type: DataTypes.JSON }, // Computed output or downloaded JSON from GSTN
  mismatchReport: { type: DataTypes.JSON } // For 2A/2B reconciliations
});

module.exports = GSTReturn;
