const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PurchaseChallan = sequelize.define("PurchaseChallan", {
  challanNo:       { type: DataTypes.STRING, unique: true },
  supplierId:      { type: DataTypes.INTEGER },
  supplierName:    { type: DataTypes.STRING, allowNull: false },
  date:            { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  items:           { type: DataTypes.JSON }, // [{name, batch, expiry, qty, rate, mrp, gstPct, amount}]
  subtotal:        { type: DataTypes.FLOAT, defaultValue: 0 },
  gstAmount:       { type: DataTypes.FLOAT, defaultValue: 0 },
  total:           { type: DataTypes.FLOAT, defaultValue: 0 },
  status:          { type: DataTypes.ENUM("draft","pending","approved","converted","cancelled"), defaultValue: "draft" },
  invoiceNo:       { type: DataTypes.STRING },
  convertedAt:     { type: DataTypes.DATE },
  purchaseOrderId: { type: DataTypes.INTEGER },
  notes:           { type: DataTypes.TEXT },
  userId:          { type: DataTypes.INTEGER },
});

module.exports = PurchaseChallan;
