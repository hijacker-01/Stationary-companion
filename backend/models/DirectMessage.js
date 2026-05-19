const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DirectMessage = sequelize.define("DirectMessage", {
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  senderName: { type: DataTypes.STRING },
  receiverId: { type: DataTypes.INTEGER, allowNull: false },
  receiverName: { type: DataTypes.STRING },
  message: { type: DataTypes.TEXT, allowNull: false },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = DirectMessage;
