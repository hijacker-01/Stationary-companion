const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const JournalLine = sequelize.define("JournalLine", {
  journalVoucherId: { type: DataTypes.INTEGER, allowNull: false },
  ledgerAccountId: { type: DataTypes.INTEGER, allowNull: false },
  debit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  credit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  narration: { type: DataTypes.STRING }
});

module.exports = JournalLine;
