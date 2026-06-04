const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Item = sequelize.define("Item", {
  name:           { type: DataTypes.STRING, allowNull: false },
  batch:          { type: DataTypes.STRING },
  category:       { type: DataTypes.STRING },
  company:        { type: DataTypes.STRING },
  hsn:            { type: DataTypes.STRING },
  pack:           { type: DataTypes.STRING },
  stock_qty:      { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
  scheme_qty:     { type: DataTypes.INTEGER, defaultValue: 0 },
  unit:           { type: DataTypes.STRING },
  expiry:         { type: DataTypes.DATEONLY },
  location:       { type: DataTypes.STRING },
  mrp:            { type: DataTypes.FLOAT, defaultValue: 0, validate: { min: 0 } },
  selling_price:  { type: DataTypes.FLOAT, defaultValue: 0, validate: { min: 0 } },
  cost_price:     { type: DataTypes.FLOAT, defaultValue: 0, validate: { min: 0 } },
  purchaseScheme: { type: DataTypes.STRING },
  schedule:       { type: DataTypes.ENUM("None","H","H1","X"), defaultValue: "None" },
  reorderPoint:   { type: DataTypes.INTEGER, defaultValue: 10 },
  salesmanId:     { type: DataTypes.INTEGER },
  taxCategoryId:  { type: DataTypes.INTEGER },
}, {
  indexes: [
    { fields: ['name'] },
    { fields: ['batch'] },
    { fields: ['category'] }
  ],
  paranoid: true, // Enables Soft Deletes (deletedAt)
});

module.exports = Item;