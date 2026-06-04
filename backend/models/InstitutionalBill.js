const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const InstitutionalBill = sequelize.define("InstitutionalBill", {
  billNo:          { type: DataTypes.STRING, unique: true },
  tenderId:        { type: DataTypes.INTEGER },
  tenderNo:        { type: DataTypes.STRING },
  institutionName: { type: DataTypes.STRING, allowNull: false },
  institutionType: { type: DataTypes.ENUM("hospital", "government", "medical_college", "psu", "defense") },
  poNumber:        { type: DataTypes.STRING },
  items:           { type: DataTypes.JSON, defaultValue: [] },
  subtotal:        { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  gstAmount:       { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  total:           { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  status:          { type: DataTypes.ENUM("draft", "submitted", "approved", "paid", "partial"), defaultValue: "draft" },
  compliance:      { type: DataTypes.JSON, defaultValue: {} },
  dueDate:         { type: DataTypes.DATEONLY },
  notes:           { type: DataTypes.TEXT },
});

module.exports = InstitutionalBill;
