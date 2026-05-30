const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SupplierScheme = sequelize.define("SupplierScheme", {
  supplierId:     { type: DataTypes.INTEGER, allowNull: false },
  supplierName:   { type: DataTypes.STRING },
  schemeName:     { type: DataTypes.STRING, allowNull: false },
  type:           { type: DataTypes.ENUM("buy_get_free", "flat_discount", "volume", "slab"), allowNull: false },
  applicableItems:{ type: DataTypes.JSON, defaultValue: [] },
  minQty:         { type: DataTypes.INTEGER, defaultValue: 0 },
  freeQty:        { type: DataTypes.INTEGER, defaultValue: 0 },
  discountPercent:{ type: DataTypes.FLOAT, defaultValue: 0 },
  slabRates:      { type: DataTypes.JSON, defaultValue: [] },
  validFrom:      { type: DataTypes.DATEONLY },
  validTo:        { type: DataTypes.DATEONLY },
  isActive:       { type: DataTypes.BOOLEAN, defaultValue: true },
  description:    { type: DataTypes.TEXT },
});

module.exports = SupplierScheme;
