import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import AICopilotWidget from "./components/AICopilotWidget";
import AICockpit from "./pages/AICockpit";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import ExpiryBox from "./pages/ExpiryBox";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import SalesReturn from "./pages/SalesReturn";
import PurchaseReturn from "./pages/PurchaseReturn";
import SalesmanPage from "./pages/Salesman";
import Vouchers from "./pages/Vouchers";
import Register from "./pages/Register";
import DeliveryMan from "./pages/DeliveryMan";
import DirectMessages from "./pages/DirectMessages";
import Expenses from "./pages/Expenses";
import JournalVouchers from "./pages/JournalVouchers";
import PurchaseBills from "./pages/PurchaseBills";
import AILedger      from "./pages/AILedger";
import ReorderCenter from "./pages/ReorderCenter";
import ExpiryGuard   from "./pages/ExpiryGuard";
import LedgerView    from "./pages/LedgerView";
import AuditLog      from "./pages/AuditLog";
import CashBook      from "./pages/CashBook";
import DebtorsBoard  from "./pages/DebtorsBoard";
import CreditorsBoard from "./pages/CreditorsBoard";
import OutstandingBillsTagging from "./pages/OutstandingBillsTagging";
import InvoicePrint  from "./pages/InvoicePrint";
import PurchaseChallan from "./pages/PurchaseChallan";
import SalesChallan   from "./pages/SalesChallan";
import ReceiptVoucher from "./pages/ReceiptVoucher";
import PaymentVoucher from "./pages/PaymentVoucher";
import ProfitAnalytics from "./pages/ProfitAnalytics";
import InventoryValuation from "./pages/InventoryValuation";
import AICopilot from "./pages/AICopilot";
import CustomerPortal from "./pages/CustomerPortal";
import SalesmanApp from "./pages/SalesmanApp";

// 11.0 Enterprise Imports
import Warehouse from "./pages/Warehouse";
import Logistics from "./pages/Logistics";
import Approvals from "./pages/Approvals";
import CRM from "./pages/CRM";
import Schemes from "./pages/Schemes";
import OwnerApp from "./pages/OwnerApp";
import HealthDashboard from "./pages/HealthDashboard";
import DocumentManagement from "./pages/DocumentManagement";
import DrugRecall from "./pages/DrugRecall";

// 12.0 Enterprise Routes
import AutonomousProcurement from "./pages/AutonomousProcurement";
import ControlTower from "./pages/ControlTower";
import RetailerApp from "./pages/RetailerApp";
import SupplierPortal from "./pages/SupplierPortal";
import CEODashboard from "./pages/CEODashboard";
import InstitutionalSales from "./pages/InstitutionalSales";
import CashFlowEngine from "./pages/CashFlowEngine";
import WarehouseTwin from "./pages/WarehouseTwin";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import AutomationBuilder from "./pages/AutomationBuilder";
import PlatformAdmin from "./pages/PlatformAdmin";
import ExpiryCommandCenter from "./pages/ExpiryCommandCenter";
import CollectionAgent from "./pages/CollectionAgent";
import AutoReconciliation from "./pages/AutoReconciliation";
import PricingEngine from "./pages/PricingEngine";

// 12.0 Phase 2: GST & Compliance
import GSTDashboard from "./pages/GSTDashboard";
import ComplianceRuleManager from "./pages/ComplianceRuleManager";
import EInvoiceCenter from "./pages/EInvoiceCenter";
import ComplianceAudit from "./pages/ComplianceAudit";
import DispatchSummary from "./pages/DispatchSummary";
import ClosingStock from "./pages/ClosingStock";

import CommandPalette from "./components/CommandPalette";
import { useHotkeys } from "./hooks/useHotkeys";
import { useKeyboardNav } from "./hooks/useKeyboardNav";

function GlobalHooks() {
  useHotkeys();
  useKeyboardNav();
  return <CommandPalette />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AICopilotWidget />
      <GlobalHooks />
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
    </BrowserRouter>
  );
}

export default App;