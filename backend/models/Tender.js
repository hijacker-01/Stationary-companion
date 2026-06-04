const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Tender = sequelize.define("Tender", {
  tenderNo:     { type: DataTypes.STRING, unique: true },
  institution:  { type: DataTypes.STRING, allowNull: false },
  type:         { type: DataTypes.ENUM("hospital", "government", "medical_college", "psu", "defense"), allowNull: false },
  title:        { type: DataTypes.STRING },
  items:        { type: DataTypes.JSON, defaultValue: [] },
  rateContract: { type: DataTypes.JSON, defaultValue: {} },
  validFrom:    { type: DataTypes.DATEONLY },
  validTo:      { type: DataTypes.DATEONLY },
  status:       { type: DataTypes.ENUM("open", "bid_submitted", "awarded", "lost", "completed", "cancelled"), defaultValue: "open" },
  total:        { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  emd:          { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  terms:        { type: DataTypes.TEXT },
  contactPerson:{ type: DataTypes.STRING },
  contactPhone: { type: DataTypes.STRING },
  notes:        { type: DataTypes.TEXT },
});

module.exports = Tender;
