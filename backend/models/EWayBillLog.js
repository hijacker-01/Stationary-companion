const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const EWayBillLog = sequelize.define("EWayBillLog", {
  billId: { type: DataTypes.INTEGER, allowNull: false },
  environment: { 
    type: DataTypes.ENUM("sandbox", "production"), 
    allowNull: false 
  },
  isMock: { type: DataTypes.BOOLEAN, defaultValue: false },
  ewbNumber: { type: DataTypes.STRING(15) },
  ewbDate: { type: DataTypes.DATE },
  validUntil: { type: DataTypes.DATE },
  transporterId: { type: DataTypes.STRING },
  vehicleNo: { type: DataTypes.STRING },
  distance: { type: DataTypes.FLOAT },
  status: { 
    type: DataTypes.ENUM("generated", "cancelled", "extended", "failed"), 
    defaultValue: "generated" 
  },
  apiResponseLog: { type: DataTypes.JSON }
});

module.exports = EWayBillLog;
