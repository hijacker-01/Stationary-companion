const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const LedgerAccount = sequelize.define("LedgerAccount", {
  code: { type: DataTypes.STRING, unique: true, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  group: { type: DataTypes.ENUM("Asset", "Liability", "Equity", "Revenue", "Expense"), allowNull: false }
});

module.exports = LedgerAccount;
