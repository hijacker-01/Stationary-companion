import { NavLink } from "react-router-dom";

const quickActions = [
  { to: "/billing", label: "Cash/Credit Bill" },
  { to: "/purchase-challan", label: "Purchase Challan" },
  { to: "/sales-challan", label: "Sales DM" },
  { to: "/purchase-bills", label: "Purchase Bills" },
];

const accounts = [
  { to: "/receipt-voucher", label: "Receipt Voucher" },
  { to: "/payment-voucher", label: "Payment Voucher" },
  { to: "/cashbook", label: "Cash & Bank Book" },
  { to: "/ledger", label: "Ledger A/c" },
  { to: "/journal-vouchers", label: "Journal Vouchers" },
];

const reports = [
  { to: "/debtors", label: "Debtors (Receivable)" },
  { to: "/creditors", label: "Creditors (Payable)" },
  { to: "/outstanding-bills/tagging", label: "Outstanding Bills" },
  { to: "/dispatch-summary", label: "Dispatch Summary" },
  { to: "/reports", label: "Sales & Purchase Reports" },
  { to: "/profit-analytics", label: "Profit Analytics" },
  { to: "/inventory-valuation", label: "Inventory Valuation" },
  { to: "/audit-log", label: "Audit Trail" },
];

const inventory = [
  { to: "/inventory", label: "Current Stock" },
  { to: "/expiry", label: "Near Expiry Stock" },
  { to: "/schemes", label: "Schemes" },
  { to: "/items", label: "Item Master" },
];

const aiTools = [
  { to: "/ai-ledger", label: "AI Smart Ledger", badge: "AI" },
  { to: "/reorder-center", label: "AI Re-Order Agent", badge: "AI" },
  { to: "/expiry-guard", label: "AI Expiry Guard", badge: "AI" },
  { to: "/copilot", label: "AI Copilot", badge: "AI" },
];

const enterprise = [
  { to: "/wms", label: "Warehouse (WMS)" },
  { to: "/logistics", label: "Route & Delivery" },
  { to: "/approvals", label: "Approvals Inbox" },
  { to: "/crm", label: "Advanced CRM" },
  { to: "/schemes", label: "Promotions & Schemes" },
  { to: "/dms", label: "Document Mgmt" },
  { to: "/drug-recall", label: "Drug Recall Mgmt" },
];

const portals = [
  { to: "/customer-portal", label: "Customer Portal" },
  { to: "/salesman-app", label: "Salesman App" },
  { to: "/owner-app", label: "Owner Mobile App" },
  { to: "/health", label: "Business Health" },
  { to: "/retailer-app", label: "Retailer Marketplace" },
  { to: "/supplier-portal", label: "Supplier Portal" },
];

const enterprise12 = [
  { to: "/autonomous-procurement", label: "Auto Procurement", badge: "AI" },
  { to: "/control-tower", label: "Distribution Tower" },
  { to: "/ceo-dashboard", label: "CEO AI Dashboard", badge: "AI" },
  { to: "/institutional-sales", label: "Hospital/Institutional" },
  { to: "/cashflow-engine", label: "Cash Flow Engine", badge: "AI" },
  { to: "/warehouse-twin", label: "Warehouse Twin 2D" },
  { to: "/compliance", label: "Compliance Center" },
  { to: "/automation", label: "Hyper Automation" },
  { to: "/platform-admin", label: "Platform Admin" },
];

const gstCompliance = [
  { to: "/gst-dashboard", label: "GST Dashboard", badge: "GST" },
  { to: "/einvoice", label: "E-Invoice & E-Way Bill" },
  { to: "/compliance-rules", label: "Compliance Rules" },
  { to: "/compliance-audit", label: "System Audit", badge: "SEC" },
];

const SidebarSection = ({ title, links, color }) => (
  <div className="py-1.5">
    <h3 className={`px-3 text-[11px] font-extrabold uppercase tracking-wider mb-0.5 ${color || "text-[#1b4985]"}`}>{title}</h3>
    <nav className="flex flex-col">
      {links.map((link, i) => (
        <NavLink
          key={i}
          to={link.to}
          className={({ isActive }) =>
            `px-4 py-[3px] text-[11.5px] font-medium transition-colors flex items-center justify-between ${
              isActive ? "bg-[#dbeafe] text-[#1e3a8a] border-l-2 border-[#1e3a8a]" : "text-gray-700 hover:bg-[#e8e8e8]"
            }`
          }
        >
          {link.label}
          {link.badge && <span className="bg-purple-100 text-purple-700 text-[8px] font-extrabold px-1 rounded">{link.badge}</span>}
        </NavLink>
      ))}
    </nav>
  </div>
);

export default function Sidebar() {
  return (
    <div className="w-52 h-full bg-[#f4f4f4] border-r border-gray-300 flex flex-col overflow-y-auto shrink-0 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.02)]">
      <SidebarSection title="Quick Actions" links={quickActions} />
      <div className="border-t border-gray-200" />
      <SidebarSection title="Accounts" links={accounts} />
      <div className="border-t border-gray-200" />
      <SidebarSection title="Reports" links={reports} />
      <div className="border-t border-gray-200" />
      <SidebarSection title="Inventory" links={inventory} />
      <div className="border-t border-gray-200" />
      <SidebarSection title="Enterprise" links={enterprise} />
      <div className="border-t border-gray-200" />
      <SidebarSection title="Portals" links={portals} />
      <div className="border-t border-gray-200" />
      <SidebarSection title="12.0 Enterprise" links={enterprise12} color="text-blue-700" />
      <div className="border-t border-gray-200" />
      <SidebarSection title="GST & Compliance" links={gstCompliance} color="text-green-700" />
      <div className="border-t border-gray-200" />
      <SidebarSection title="AI Tools" links={aiTools} color="text-purple-700" />
      {/* Bottom section */}
      <div className="mt-auto p-2 border-t border-gray-300 bg-[#e4e4e4]">
        <div className="flex flex-col gap-1">
          <NavLink to="/suppliers" className="text-[10px] font-bold text-gray-700 hover:text-blue-700 px-2">Suppliers</NavLink>
          <NavLink to="/customers" className="text-[10px] font-bold text-gray-700 hover:text-blue-700 px-2">Customers</NavLink>
          <NavLink to="/salesman" className="text-[10px] font-bold text-gray-700 hover:text-blue-700 px-2">Salesman</NavLink>
          <NavLink to="/users" className="text-[10px] font-bold text-gray-700 hover:text-blue-700 px-2">Users & Roles</NavLink>
          <NavLink to="/settings" className="text-[10px] font-bold text-gray-700 hover:text-blue-700 px-2">Settings</NavLink>
        </div>
      </div>
    </div>
  );
}