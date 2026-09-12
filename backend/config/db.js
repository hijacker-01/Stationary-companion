const path = require("path");
const fs = require("fs");
const { Sequelize } = require("sequelize");
require("dotenv").config();

const storagePath = process.env.DB_STORAGE_PATH || path.join(__dirname, "../data/stationary-companion.db");
fs.mkdirSync(path.dirname(storagePath), { recursive: true });

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: storagePath,
  logging: false
});

module.exports = sequelize;