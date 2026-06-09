import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import AICopilotWidget from "./components/AICopilotWidget";
const AICockpit = React.lazy(() => import("./pages/AICockpit"));
const Login = React.lazy(() => import("./pages/Login"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Inventory = React.lazy(() => import("./pages/Inventory"));
const ExpiryBox = React.lazy(() => import("./pages/ExpiryBox"));
const Billing = React.lazy(() => import("./pages/Billing"));
const Reports = React.lazy(() => import("./pages/Reports"));
const Users = React.lazy(() => import("./pages/Users"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Suppliers = React.lazy(() => import("./pages/Suppliers"));
const Customers = React.lazy(() => import("./pages/Customers"));
const SalesReturn = React.lazy(() => import("./pages/SalesReturn"));
const PurchaseReturn = React.lazy(() => import("./pages/PurchaseReturn"));
const SalesmanPage = React.lazy(() => import("./pages/Salesman"));
const Vouchers = React.lazy(() => import("./pages/Vouchers"));
const Register = React.lazy(() => import("./pages/Register"));
const DeliveryMan = React.lazy(() => import("./pages/DeliveryMan"));
const DirectMessages = React.lazy(() => import("./pages/DirectMessages"));
const Expenses = React.lazy(() => import("./pages/Expenses"));
const JournalVouchers = React.lazy(() => import("./pages/JournalVouchers"));
const PurchaseBills = React.lazy(() => import("./pages/PurchaseBills"));
const AILedger = React.lazy(() => import("./pages/AILedger"));
const ReorderCenter = React.lazy(() => import("./pages/ReorderCenter"));
const ExpiryGuard = React.lazy(() => import("./pages/ExpiryGuard"));
const LedgerView = React.lazy(() => import("./pages/LedgerView"));
const AuditLog = React.lazy(() => import("./pages/AuditLog"));
const CashBook = React.lazy(() => import("./pages/CashBook"));
const DebtorsBoard = React.lazy(() => import("./pages/DebtorsBoard"));
const CreditorsBoard = React.lazy(() => import("./pages/CreditorsBoard"));
const OutstandingBillsTagging = React.lazy(() => import("./pages/OutstandingBillsTagging"));
const InvoicePrint = React.lazy(() => import("./pages/InvoicePrint"));
const PurchaseChallan = React.lazy(() => import("./pages/PurchaseChallan"));
const SalesChallan = React.lazy(() => import("./pages/SalesChallan"));
const ReceiptVoucher = React.lazy(() => import("./pages/ReceiptVoucher"));
const PaymentVoucher = React.lazy(() => import("./pages/PaymentVoucher"));
const ProfitAnalytics = React.lazy(() => import("./pages/ProfitAnalytics"));
const InventoryValuation = React.lazy(() => import("./pages/InventoryValuation"));
const AICopilot = React.lazy(() => import("./pages/AICopilot"));
const CustomerPortal = React.lazy(() => import("./pages/CustomerPortal"));
const SalesmanApp = React.lazy(() => import("./pages/SalesmanApp"));

// 11.0 Enterprise Imports
const Warehouse = React.lazy(() => import("./pages/Warehouse"));
const GodownMaster = React.lazy(() => import("./pages/GodownMaster"));
const Logistics = React.lazy(() => import("./pages/Logistics"));
const Approvals = React.lazy(() => import("./pages/Approvals"));
const CRM = React.lazy(() => import("./pages/CRM"));
const Schemes = React.lazy(() => import("./pages/Schemes"));
const OwnerApp = React.lazy(() => import("./pages/OwnerApp"));
const HealthDashboard = React.lazy(() => import("./pages/HealthDashboard"));
const DocumentManagement = React.lazy(() => import("./pages/DocumentManagement"));
const DrugRecall = React.lazy(() => import("./pages/DrugRecall"));

// 12.0 Enterprise Routes
const AutonomousProcurement = React.lazy(() => import("./pages/AutonomousProcurement"));
const ControlTower = React.lazy(() => import("./pages/ControlTower"));
const RetailerApp = React.lazy(() => import("./pages/RetailerApp"));
const SupplierPortal = React.lazy(() => import("./pages/SupplierPortal"));
const CEODashboard = React.lazy(() => import("./pages/CEODashboard"));
const InstitutionalSales = React.lazy(() => import("./pages/InstitutionalSales"));
const CashFlowEngine = React.lazy(() => import("./pages/CashFlowEngine"));
const WarehouseTwin = React.lazy(() => import("./pages/WarehouseTwin"));
const ComplianceDashboard = React.lazy(() => import("./pages/ComplianceDashboard"));
const AutomationBuilder = React.lazy(() => import("./pages/AutomationBuilder"));
const PlatformAdmin = React.lazy(() => import("./pages/PlatformAdmin"));
const ExpiryCommandCenter = React.lazy(() => import("./pages/ExpiryCommandCenter"));
const CollectionAgent = React.lazy(() => import("./pages/CollectionAgent"));
const AutoReconciliation = React.lazy(() => import("./pages/AutoReconciliation"));
const PricingEngine = React.lazy(() => import("./pages/PricingEngine"));

// 12.0 Phase 2: GST & Compliance
const GSTDashboard = React.lazy(() => import("./pages/GSTDashboard"));
const ComplianceRuleManager = React.lazy(() => import("./pages/ComplianceRuleManager"));
const EInvoiceCenter = React.lazy(() => import("./pages/EInvoiceCenter"));
const ComplianceAudit = React.lazy(() => import("./pages/ComplianceAudit"));
const DispatchSummary = React.lazy(() => import("./pages/DispatchSummary"));
const ClosingStock = React.lazy(() => import("./pages/ClosingStock"));

import CommandPalette from "./components/CommandPalette";
import { useHotkeys } from "./hooks/useHotkeys";
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import ShortcutModal from "./components/ShortcutModal";
import QuickCreateModal from "./components/QuickCreateModal";
import { useState, useEffect } from "react";

function GlobalHooks() {
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  
  useHotkeys();
  useKeyboardNav();
  useKeyboardShortcuts(() => setShowShortcutModal(prev => !prev));
  
  useEffect(() => {
    const handleOpenQuickCreate = () => setShowQuickCreate(true);
    window.addEventListener("open-quick-create", handleOpenQuickCreate);
    return () => window.removeEventListener("open-quick-create", handleOpenQuickCreate);
  }, []);

  return (
    <>
      <CommandPalette />
      <ShortcutModal isOpen={showShortcutModal} onClose={() => setShowShortcutModal(false)} />
      <QuickCreateModal isOpen={showQuickCreate} onClose={() => setShowQuickCreate(false)} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AICopilotWidget />
      <GlobalHooks />
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-500">Loading Module...</div>}>
          <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<ProtectedRoute allowedRoles={['admin', 'user']} />}>
          <Route path="/ai-cockpit" element={<AICockpit />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
        <Route path="/expiry" element={<ExpiryBox />} />
        <Route path="/expiry-center" element={<ExpiryCommandCenter />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/sales-return" element={<SalesReturn />} />
        <Route path="/purchase-return" element={<PurchaseReturn />} />
        <Route path="/salesman" element={<SalesmanPage />} />
        <Route path="/vouchers" element={<Vouchers />} />
        <Route path="/delivery-man" element={<DeliveryMan />} />
        <Route path="/messages" element={<DirectMessages />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/journal-vouchers" element={<JournalVouchers />} />
        <Route path="/purchase-bills"  element={<PurchaseBills />} />
        <Route path="/ai-ledger"       element={<AILedger />} />
        <Route path="/reorder-center"   element={<ReorderCenter />} />
        <Route path="/expiry-guard"     element={<ExpiryGuard />} />
        <Route path="/ledger"           element={<LedgerView />} />
        <Route path="/audit-log"        element={<AuditLog />} />
        {/* Domain 1 & 2: Challan workflows */}
        <Route path="/purchase-challan" element={<PurchaseChallan />} />
        <Route path="/sales-challan"    element={<SalesChallan />} />
        {/* Domain 3: Financial vouchers */}
        <Route path="/receipt-voucher"  element={<ReceiptVoucher />} />
        <Route path="/payment-voucher"  element={<PaymentVoucher />} />
        {/* Domain 4: Reports & Dashboards */}
        <Route path="/cashbook"          element={<CashBook />} />
        <Route path="/debtors"           element={<DebtorsBoard />} />
        <Route path="/creditors"         element={<CreditorsBoard />} />
        <Route path="/outstanding-bills/tagging" element={<OutstandingBillsTagging />} />
        <Route path="/invoice-print/:id" element={<InvoicePrint />} />
        {/* Domain 6: Analytics */}
        <Route path="/profit-analytics"  element={<ProfitAnalytics />} />
        <Route path="/inventory-valuation" element={<InventoryValuation />} />
        {/* Domain 7: Portals & Integrations */}
        <Route path="/copilot" element={<AICopilot />} />
        <Route path="/customer-portal" element={<CustomerPortal />} />
        <Route path="/salesman-app" element={<SalesmanApp />} />
        
        {/* Domain 8: 11.0 Enterprise */}
        <Route path="/wms" element={<Warehouse />} />
        <Route path="/godown-master" element={<GodownMaster />} />
        <Route path="/logistics" element={<Logistics />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/crm" element={<CRM />} />
        <Route path="/owner-app" element={<OwnerApp />} />
        <Route path="/health" element={<HealthDashboard />} />
        <Route path="/dms" element={<DocumentManagement />} />
        <Route path="/drug-recall" element={<DrugRecall />} />

        {/* 12.0 Enterprise Routes */}
        <Route path="/autonomous-procurement" element={<AutonomousProcurement />} />
        <Route path="/control-tower" element={<ControlTower />} />
        <Route path="/retailer-app" element={<RetailerApp />} />
        <Route path="/supplier-portal" element={<SupplierPortal />} />
        <Route path="/ceo-dashboard" element={<CEODashboard />} />
        <Route path="/institutional-sales" element={<InstitutionalSales />} />
        <Route path="/cashflow-engine" element={<CashFlowEngine />} />
        <Route path="/collection-agent" element={<CollectionAgent />} />
        <Route path="/auto-reconciliation" element={<AutoReconciliation />} />
        <Route path="/pricing-engine" element={<PricingEngine />} />
        <Route path="/warehouse-twin" element={<WarehouseTwin />} />
        <Route path="/compliance" element={<ComplianceDashboard />} />
        <Route path="/automation" element={<AutomationBuilder />} />
        <Route path="/platform-admin" element={<PlatformAdmin />} />

        {/* 12.0 GST & Compliance UI */}
        <Route path="/gst-dashboard" element={<GSTDashboard />} />
        <Route path="/compliance-rules" element={<ComplianceRuleManager />} />
        <Route path="/einvoice" element={<EInvoiceCenter />} />
        <Route path="/dispatch-summary" element={<DispatchSummary />} />
        <Route path="/closing-stock" element={<ClosingStock />} />
        <Route path="/compliance-audit" element={<ComplianceAudit />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
        </Suspense>
    </BrowserRouter>
  );
}

export default App;