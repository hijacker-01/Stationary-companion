const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const GSTStateMaster = sequelize.define("GSTStateMaster", {
  stateCode: {
    type: DataTypes.STRING(2),
    primaryKey: true,
    allowNull: false
  },
  stateName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: "India"
  },
  zoneClassification: {
    type: DataTypes.STRING // North, South, East, West, Central, North-East
  },
  isUnionTerritory: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, { timestamps: false });

module.exports = GSTStateMaster;
