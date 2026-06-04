const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    pool: {
      max: 50,
      min: 10,
      acquire: 30000,
      idle: 10000
    },
    logging: false // Disable logging to keep console clean
  }
);

module.exports = sequelize;