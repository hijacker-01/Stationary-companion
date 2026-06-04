const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
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
// New Models
require("./models/ItemBatch");
require("./models/StockMovement");
require("./models/LedgerAccount");
require("./models/JournalLine");
require("./models/AuditLog");
require("./models/IdempotencyKey");
require("./models/PurchaseChallan");
require("./models/SalesChallan");
// 12.0 Enterprise Routes Models
require("./models/SupplierPerformance");
require("./models/RFQ");
require("./models/RFQResponse");
require("./models/Branch");
require("./models/StockTransfer");
require("./models/BranchMetric");
require("./models/MarketplaceOrder");
require("./models/SupplierScheme");
require("./models/Tender");
require("./models/InstitutionalBill");
require("./models/CashFlowForecast");
require("./models/PaymentRisk");
require("./models/PickingTask");
require("./models/ComplianceItem");
require("./models/ComplianceAlert");
require("./models/AutomationRule");
require("./models/AutomationLog");
require("./models/Plugin");
require("./models/Webhook");
require("./models/APIKey");
// 12.0 Enterprise GST & Compliance Models
require("./models/GSTStateMaster");
require("./models/GSTCategory");
require("./models/EInvoiceLog");
require("./models/EWayBillLog");
require("./models/ComplianceRule");
require("./models/ComplianceAuditLog");
require("./models/GSTReturn");
require("./models/ITCRecord");
require("./models/GSTAuditLog");

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

const rateLimit = require("express-rate-limit");
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // limit each IP to 200 requests per windowMs
  message: { error: "Too many requests from this IP, please try again later" }
});
app.use("/api", globalLimiter);

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
app.use("/api/ledger",         require("./routes/ledger"));
app.use("/api/audit",          require("./routes/audit"));
app.use("/api/ai",             require("./routes/ai-proxy"));   // 🤖 AI microservice proxy
// Domain 1 & 2: Challan workflows
app.use("/api/purchase-challan", require("./routes/purchase-challan"));
app.use("/api/sales-challan",    require("./routes/sales-challan"));
// Domain 4: Financial reports
app.use("/api/cashbook",        require("./routes/cashbook"));
app.use("/api/debtors",         require("./routes/debtors"));
app.use("/api/creditors",       require("./routes/creditors"));
app.use("/api/analytics",       require("./routes/analytics"));
app.use("/api/intelligence",    require("./routes/intelligence"));
// 11.0 Enterprise Expansion
app.use("/api/enterprise",      require("./routes/enterprise"));
app.use("/api/ai-advanced",     require("./routes/ai-advanced"));
app.use("/api/portals",         require("./routes/portals"));
// 12.0 Enterprise Routes
app.use("/api/procurement",     require("./routes/procurement"));
app.use("/api/distribution",    require("./routes/distribution"));
app.use("/api/marketplace",     require("./routes/marketplace"));
app.use("/api/ai-ceo",          require("./routes/ai-ceo"));
app.use("/api/institutional",   require("./routes/institutional"));
app.use("/api/cashflow",        require("./routes/cashflow"));
app.use("/api/warehouse-twin",  require("./routes/warehouse-twin"));
app.use("/api/compliance",      require("./routes/compliance"));
app.use("/api/compliance-rules",require("./routes/compliance-rules"));
app.use("/api/communication",   require("./routes/communication"));
app.use("/api/automation",      require("./routes/automation"));
app.use("/api/plugins",         require("./routes/plugins"));
app.use("/api/webhooks",        require("./routes/webhooks"));
app.use("/api/api-keys",        require("./routes/api-keys"));

const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const { seedStateMaster } = require("./seeders/stateMasterSeeder");

sequelize.authenticate()
  .then(async () => {
    console.log("✅ Database connected successfully");
    // In production, migrations should be run via CLI (e.g. sequelize-cli) 
    // rather than auto-syncing.
    await seedStateMaster();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error("❌ DB connection failed:", err));