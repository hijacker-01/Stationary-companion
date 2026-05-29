import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Schemes from "./pages/Schemes";
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
import InvoicePrint  from "./pages/InvoicePrint";
import PurchaseChallan from "./pages/PurchaseChallan";
import SalesChallan   from "./pages/SalesChallan";
import ReceiptVoucher from "./pages/ReceiptVoucher";
import PaymentVoucher from "./pages/PaymentVoucher";
import ProfitAnalytics from "./pages/ProfitAnalytics";
import InventoryValuation from "./pages/InventoryValuation";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/expiry" element={<ExpiryBox />} />
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
        <Route path="/invoice-print/:id" element={<InvoicePrint />} />
        {/* Domain 6: Analytics */}
        <Route path="/profit-analytics"  element={<ProfitAnalytics />} />
        <Route path="/inventory-valuation" element={<InventoryValuation />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;