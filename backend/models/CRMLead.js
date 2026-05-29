const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CRMLead = sequelize.define("CRMLead", {
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING }, // Doctor/Chemist
  contact: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING }
});

module.exports = CRMLead;
