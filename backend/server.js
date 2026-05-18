const express = require("express");
const cors = require("cors");
require("dotenv").config();
const sequelize = require("./config/db");

// Import models so Sequelize knows about them
require("./models/User");
require("./models/Item");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/items", require("./routes/items"));
app.use("/api/expiry", require("./routes/expiry"));
app.use("/api/billing", require("./routes/billing"));

const PORT = process.env.PORT || 5000;

// Sync DB then start server
sequelize.sync({ alter: true })
  .then(() => {
    console.log("✅ Database connected & tables synced");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error("❌ DB connection failed:", err));