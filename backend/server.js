const express = require("express");
const cors = require("cors");
require("dotenv").config();
const sequelize = require("./config/db");

require("./models/User");
require("./models/Item");
require("./models/Bill");
require("./models/Settings");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth",     require("./routes/auth"));
app.use("/api/items",    require("./routes/items"));
app.use("/api/expiry",   require("./routes/expiry"));
app.use("/api/billing",  require("./routes/billing"));
app.use("/api/reports",  require("./routes/reports"));
app.use("/api/users",    require("./routes/users"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/gst",      require("./routes/gst"));

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log("✅ Database connected & tables synced");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error("❌ DB connection failed:", err));