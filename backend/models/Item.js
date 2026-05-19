const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Item = sequelize.define("Item", {
  name:           { type: DataTypes.STRING, allowNull: false },
  batch:          { type: DataTypes.STRING },
  category:       { type: DataTypes.STRING },
  company:        { type: DataTypes.STRING },
  stock_qty:      { type: DataTypes.INTEGER, defaultValue: 0 },
  scheme_qty:     { type: DataTypes.INTEGER, defaultValue: 0 },
  unit:           { type: DataTypes.STRING },
  expiry:         { type: DataTypes.DATEONLY },
  location:       { type: DataTypes.STRING },
  mrp:            { type: DataTypes.FLOAT },
  selling_price:  { type: DataTypes.FLOAT },
  cost_price:     { type: DataTypes.FLOAT },
  purchaseScheme: { type: DataTypes.STRING },
});

module.exports = Item;