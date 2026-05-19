const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DeliveryMan = sequelize.define("DeliveryMan", {
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  vehicleNo: { type: DataTypes.STRING },
  route: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active" },
  pendingCash: { type: DataTypes.FLOAT, defaultValue: 0 },
});

module.exports = DeliveryMan;
