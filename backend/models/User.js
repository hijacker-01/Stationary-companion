const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  name:        { type: DataTypes.STRING, allowNull: false },
  email:       { type: DataTypes.STRING, unique: true, allowNull: false },
  password:    { type: DataTypes.STRING, allowNull: false },
  role:        { type: DataTypes.ENUM("admin", "billing_operator", "accountant", "manager", "staff"), defaultValue: "staff" },
  phone:       { type: DataTypes.STRING },
  permissions: { type: DataTypes.JSON, defaultValue: [] },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
});

User.beforeCreate(async (user, options) => {
  if (!user.permissions || user.permissions.length === 0) {
    switch (user.role) {
      case "admin":
        user.permissions = ["*"];
        break;
      case "billing_operator":
        user.permissions = ["billing.create", "billing.read", "customers.read", "items.read"];
        break;
      case "accountant":
        user.permissions = ["ledger.read", "ledger.write", "reports.read"];
        break;
      case "manager":
        user.permissions = ["billing.read", "reports.read", "inventory.read", "suppliers.read"];
        break;
      case "staff":
        user.permissions = ["inventory.read"];
        break;
      default:
        user.permissions = [];
    }
  }
});

module.exports = User;