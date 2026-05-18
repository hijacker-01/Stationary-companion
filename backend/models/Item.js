const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Item = sequelize.define("Item", {
  name:       { type: DataTypes.STRING, allowNull: false },
  batch:      { type: DataTypes.STRING },
  category:   { type: DataTypes.STRING },
  qty:        { type: DataTypes.INTEGER, defaultValue: 0 },
  unit:       { type: DataTypes.STRING },
  expiry:     { type: DataTypes.DATEONLY },
  location:   { type: DataTypes.STRING },
  mrp:        { type: DataTypes.FLOAT },
  costPrice:  { type: DataTypes.FLOAT },
});

module.exports = Item;