const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ITCRecord = sequelize.define("ITCRecord", {
  purchaseBillId: { type: DataTypes.INTEGER, allowNull: false },
  supplierGstin: { type: DataTypes.STRING(15) },
  status: {
    type: DataTypes.ENUM("eligible", "ineligible", "blocked", "reversed"),
    defaultValue: "eligible"
  },
  cgstAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  sgstAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  igstAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  cessAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  reasonForBlock: { type: DataTypes.STRING },
  matchedWith2B: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = ITCRecord;
