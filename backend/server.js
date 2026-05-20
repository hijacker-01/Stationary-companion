const express = require("express");
const cors = require("cors");
require("dotenv").config();
const sequelize = require("./config/db");

require("./models/User");
require("./models/Item");
require("./models/Bill");
require("./models/Settings");
require("./models/Supplier");
require("./models/PurchaseOrder");
require("./models/Customer");
require("./models/Payment");
require("./models/Scheme");
require("./models/SalesReturn");
require("./models/PurchaseReturn");
require("./models/Salesman");
require("./models/StockAdjustment");
require("./models/DeliveryMan");
require("./models/DirectMessage");
require("./models/Expense");
require("./models/JournalVoucher");

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/api/auth",           require("./routes/auth"));
app.use("/api/items",          require("./routes/items"));
app.use("/api/expiry",         require("./routes/expiry"));
app.use("/api/billing",        require("./routes/billing"));
app.use("/api/reports",        require("./routes/reports"));
app.use("/api/users",          require("./routes/users"));
app.use("/api/settings",       require("./routes/settings"));
app.use("/api/gst",            require("./routes/gst"));
app.use("/api/suppliers",      require("./routes/suppliers"));
app.use("/api/customers",      require("./routes/customers"));
app.use("/api/schemes",        require("./routes/schemes"));
app.use("/api/sales-return",   require("./routes/salesReturn"));
app.use("/api/purchase-return",require("./routes/purchaseReturn"));
app.use("/api/salesman",       require("./routes/salesman"));
app.use("/api/stock-adjust",   require("./routes/stockAdjustment"));
app.use("/api/dashboard",      require("./routes/dashboard"));
app.use("/api/vouchers",       require("./routes/vouchers"));
app.use("/api/delivery-man",   require("./routes/deliveryMan"));
app.use("/api/messages",       require("./routes/messages"));
app.use("/api/expenses",       require("./routes/expenses"));
app.use("/api/journal",        require("./routes/journal"));

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log("✅ Database connected & tables synced");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error("❌ DB connection failed:", err));