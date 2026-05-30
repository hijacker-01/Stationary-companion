const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const crypto = require("crypto");

const APIKey = sequelize.define("APIKey", {
  key:         { type: DataTypes.STRING, unique: true, defaultValue: () => `bpk_${crypto.randomBytes(24).toString('hex')}` },
  name:        { type: DataTypes.STRING, allowNull: false },
  userId:      { type: DataTypes.INTEGER },
  userName:    { type: DataTypes.STRING },
  permissions: { type: DataTypes.JSON, defaultValue: ["read"] },
  rateLimit:   { type: DataTypes.INTEGER, defaultValue: 60 },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  lastUsed:    { type: DataTypes.DATE },
  expiresAt:   { type: DataTypes.DATE },
});

module.exports = APIKey;
