const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Scheme = sequelize.define("Scheme", {
  name:             { type: DataTypes.STRING, allowNull: false },
  company:          { type: DataTypes.STRING, allowNull: false },
  type:             { type: DataTypes.ENUM("buy_get_free", "flat_discount"), allowNull: false },
  buyQty:           { type: DataTypes.INTEGER, defaultValue: 0 },
  freeQty:          { type: DataTypes.INTEGER, defaultValue: 0 },
  discountPercent:  { type: DataTypes.FLOAT, defaultValue: 0 },
  applicableItems:  { type: DataTypes.JSON, defaultValue: [] },
  startDate:        { type: DataTypes.DATEONLY },
  endDate:          { type: DataTypes.DATEONLY },
  isActive:         { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = Scheme;
