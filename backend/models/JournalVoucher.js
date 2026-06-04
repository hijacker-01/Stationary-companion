const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const JournalVoucher = sequelize.define("JournalVoucher", {
  jvNo: { type: DataTypes.STRING, unique: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  
  debitPartyType: { type: DataTypes.ENUM("customer", "supplier"), allowNull: false },
  debitPartyId: { type: DataTypes.INTEGER, allowNull: false },
  debitPartyName: { type: DataTypes.STRING, allowNull: false },
  
  creditPartyType: { type: DataTypes.ENUM("customer", "supplier"), allowNull: false },
  creditPartyId: { type: DataTypes.INTEGER, allowNull: false },
  creditPartyName: { type: DataTypes.STRING, allowNull: false },
  
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  narration: { type: DataTypes.STRING, allowNull: false },
});

module.exports = JournalVoucher;
