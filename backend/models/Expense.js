const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Expense = sequelize.define("Expense", {
  date: { type: DataTypes.DATEONLY, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  paymentMode: { type: DataTypes.ENUM("cash", "bank", "upi", "credit"), defaultValue: "cash" },
  note: { type: DataTypes.STRING },
});

module.exports = Expense;
