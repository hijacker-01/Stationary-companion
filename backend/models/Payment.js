const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Payment = sequelize.define("Payment", {
  type:        { type: DataTypes.ENUM("customer","supplier"), allowNull: false },
  partyId:     { type: DataTypes.INTEGER, allowNull: false },
  partyName:   { type: DataTypes.STRING },
  amount:      { type: DataTypes.FLOAT, allowNull: false },
  mode:        { type: DataTypes.ENUM("cash","upi","card","bank"), defaultValue: "cash" },
  reference:   { type: DataTypes.STRING },
  note:        { type: DataTypes.TEXT },
  direction:   { type: DataTypes.ENUM("in","out"), allowNull: false },
});

module.exports = Payment;