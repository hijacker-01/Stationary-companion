const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Document = sequelize.define("Document", {
  filename: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING }, // License/GST
  expiry: { type: DataTypes.DATEONLY },
  filepath: { type: DataTypes.STRING }
});

module.exports = Document;
