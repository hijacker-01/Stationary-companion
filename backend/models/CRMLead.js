const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CRMLead = sequelize.define("CRMLead", {
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING }, // Doctor/Chemist
  contact: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING },
  branchId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  indexes: [
    { fields: ['branchId', 'id'] }
  ]
});

module.exports = CRMLead;
