const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const EInvoiceLog = sequelize.define("EInvoiceLog", {
  billId: { type: DataTypes.INTEGER, allowNull: false }, // Links to Bill model
  environment: { 
    type: DataTypes.ENUM("sandbox", "production"), 
    allowNull: false 
  },
  isMock: { type: DataTypes.BOOLEAN, defaultValue: false }, // True only in sandbox
  irn: { type: DataTypes.STRING(64) },
  ackNo: { type: DataTypes.STRING(20) },
  ackDate: { type: DataTypes.DATE },
  signedInvoiceJson: { type: DataTypes.JSON },
  signedQrData: { type: DataTypes.TEXT },
  status: { 
    type: DataTypes.ENUM("generated", "cancelled", "failed"), 
    defaultValue: "generated" 
  },
  cancelReason: { type: DataTypes.STRING },
  apiResponseLog: { type: DataTypes.JSON } // Full NIC/ClearTax response
});

module.exports = EInvoiceLog;
