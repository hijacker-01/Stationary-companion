const fs = require("fs");
const path = require("path");

// Load every model in this directory. Each model file calls sequelize.define()
// as a side effect, so requiring it here is enough to register it.
const models = {};
fs.readdirSync(__dirname)
  .filter((file) => file !== "index.js" && file.endsWith(".js"))
  .forEach((file) => {
    const modelName = path.basename(file, ".js");
    models[modelName] = require(path.join(__dirname, file));
  });

// Associations are defined with constraints: false everywhere — this is a
// query-layer (`include`) convenience only. It does not touch the DB schema,
// so it's safe alongside the hand-written ALTER TABLE migration scripts and
// existing data that has no enforced referential integrity yet.
const belongsTo = (sourceName, foreignKey, targetName, opts = {}) => {
  const Source = models[sourceName];
  const Target = models[targetName];
  Source.belongsTo(Target, { foreignKey, as: opts.as, constraints: false });
  Target.hasMany(Source, { foreignKey, as: opts.hasManyAs, constraints: false });
};

// Standard belongsTo/hasMany pairs derived from `{model}Id`-style foreign keys.
[
  ["APIKey", "userId", "User"],
  ["AuditLog", "userId", "User"],
  ["AutomationLog", "ruleId", "AutomationRule"],
  ["Bill", "customerId", "Customer"],
  ["Bill", "salesmanId", "Salesman"],
  ["Bill", "deliveryManId", "DeliveryMan"],
  ["Branch", "managerId", "User", { as: "manager", hasManyAs: "managedBranches" }],
  ["BranchMetric", "branchId", "Branch"],
  ["ComplianceAlert", "complianceItemId", "ComplianceItem"],
  ["ComplianceAuditLog", "userId", "User"],
  ["ComplianceItem", "branchId", "Branch"],
  ["EInvoiceLog", "billId", "Bill"],
  ["EWayBillLog", "billId", "Bill"],
  ["GSTAuditLog", "userId", "User"],
  ["ITCRecord", "purchaseBillId", "Bill", { as: "purchaseBill", hasManyAs: "itcRecords" }],
  ["InstitutionalBill", "tenderId", "Tender"],
  ["Item", "salesmanId", "Salesman"],
  ["Item", "taxCategoryId", "GSTCategory", { as: "taxCategory", hasManyAs: "items" }],
  ["ItemBatch", "itemId", "Item"],
  ["JournalLine", "journalVoucherId", "JournalVoucher"],
  ["JournalLine", "ledgerAccountId", "LedgerAccount"],
  ["MarketplaceOrder", "customerId", "Customer"],
  ["PaymentRisk", "customerId", "Customer"],
  ["PickingTask", "billId", "Bill"],
  ["PurchaseChallan", "supplierId", "Supplier"],
  ["PurchaseChallan", "salesmanId", "Salesman"],
  ["PurchaseChallan", "purchaseOrderId", "PurchaseOrder"],
  ["PurchaseChallan", "userId", "User"],
  ["PurchaseOrder", "supplierId", "Supplier"],
  ["PurchaseOrder", "rfqId", "RFQ"],
  ["RFQ", "itemId", "Item"],
  ["RFQ", "bestSupplierId", "Supplier", { as: "bestSupplier", hasManyAs: "wonRFQs" }],
  ["RFQResponse", "rfqId", "RFQ"],
  ["RFQResponse", "supplierId", "Supplier"],
  ["SalesChallan", "customerId", "Customer"],
  ["SalesChallan", "salesmanId", "Salesman"],
  ["SalesChallan", "billId", "Bill"],
  ["SalesChallan", "userId", "User"],
  ["SalesReturn", "originalBillId", "Bill", { as: "originalBill", hasManyAs: "salesReturns" }],
  ["SellThrough", "supplierId", "Supplier"],
  ["StockAdjustment", "itemId", "Item"],
  ["StockMovement", "itemId", "Item"],
  ["StockMovement", "userId", "User"],
  ["SupplierPerformance", "supplierId", "Supplier"],
  ["SupplierScheme", "supplierId", "Supplier"],
  ["Bin", "warehouse_id", "Warehouse"],
  ["Route", "driver_id", "Driver"],
  ["Route", "vehicle_id", "Vehicle"],
].forEach(([source, fk, target, opts]) => belongsTo(source, fk, target, opts));

// Same-target double foreign keys need explicit aliases on both sides to
// avoid Sequelize association-name collisions.
belongsTo("DirectMessage", "senderId", "User", { as: "sender", hasManyAs: "sentMessages" });
belongsTo("DirectMessage", "receiverId", "User", { as: "receiver", hasManyAs: "receivedMessages" });
belongsTo("StockTransfer", "fromBranchId", "Branch", { as: "fromBranchRef", hasManyAs: "outgoingTransfers" });
belongsTo("StockTransfer", "toBranchId", "Branch", { as: "toBranchRef", hasManyAs: "incomingTransfers" });

// Polymorphic party references: `partyId`/`debitPartyId`/`creditPartyId` point
// at either a Customer or a Supplier row, discriminated by a sibling
// `type`/`*PartyType` field. Both sides are modeled so `include` can resolve
// whichever one actually matches.
const polymorphicParty = (sourceName, foreignKey, asPrefix) => {
  models[sourceName].belongsTo(models.Customer, { foreignKey, as: `${asPrefix}Customer`, constraints: false });
  models[sourceName].belongsTo(models.Supplier, { foreignKey, as: `${asPrefix}Supplier`, constraints: false });
};
polymorphicParty("Payment", "partyId", "party");
polymorphicParty("JournalVoucher", "debitPartyId", "debit");
polymorphicParty("JournalVoucher", "creditPartyId", "credit");

// AuditLog.entityId, GSTAuditLog.entityId and StockMovement.referenceId are
// generic polymorphic references (the target table varies by an `entityType`/
// `type` field) and are intentionally left without associations.

// Branch-level tenant scoping: every core transactional model carries a
// `branchId` column (see add_branch_id.js).
[
  "User", "Item", "ItemBatch", "Customer", "Supplier", "Bill", "PurchaseOrder",
  "SalesChallan", "PurchaseChallan", "SalesReturn", "PurchaseReturn",
  "Payment", "JournalVoucher", "StockMovement", "CRMLead",
].forEach((modelName) => belongsTo(modelName, "branchId", "Branch"));

module.exports = models;
