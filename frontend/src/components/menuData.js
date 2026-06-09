export const menuTree = [
  {
    id: "quick-actions",
    label: "Quick Actions",
    children: [
      { to: "/billing", label: "Cash/Credit Bill" },
      { to: "/purchase-challan", label: "Purchase Challan" },
      { to: "/sales-challan", label: "Sales DM" },
      { to: "/purchase-bills", label: "Purchase Bills" },
    ],
  },
  {
    id: "accounts",
    label: "Accounts",
    children: [
      { to: "/receipt-voucher", label: "Receipt Voucher" },
      { to: "/payment-voucher", label: "Payment Voucher" },
      { to: "/cashbook", label: "Cash & Bank Book" },
      { to: "/ledger", label: "Ledger A/c" },
      { to: "/journal-vouchers", label: "Journal Vouchers" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    children: [
      { to: "/debtors", label: "Debtors (Accounts Receivable)" },
      { to: "/collection-agent", label: "Collection Agent (AI Dunning)" },
      { to: "/auto-reconciliation", label: "Bank Auto-Reconciliation" },
      { to: "/creditors", label: "Creditors (Accounts Payable)" },
      { to: "/outstanding-bills/tagging", label: "Outstanding Bills" },
      { to: "/dispatch-summary", label: "Dispatch Summary" },
      { to: "/reports", label: "Sales & Purchase Reports" },
      { to: "/profit-analytics", label: "Profit Analytics" },
      { to: "/inventory-valuation", label: "Inventory Valuation" },
      { to: "/audit-log", label: "Audit Trail" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    children: [
      { to: "/inventory", label: "Current Stock" },
      { to: "/expiry", label: "Near Expiry Stock" },
      { to: "/schemes", label: "Schemes" },
      { to: "/items", label: "Item Master" },
      // Example of nested submenu to prove unlimited nesting:
      {
        id: "inventory-tools",
        label: "Inventory Tools",
        children: [
          { to: "/barcode-gen", label: "Barcode Generator" },
          { to: "/bulk-import", label: "Bulk Import" },
        ]
      }
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    children: [
      { to: "/godown-master", label: "Godown Master (Multi-Loc)" },
      { to: "/wms", label: "Warehouse (WMS)" },
      { to: "/logistics", label: "Route & Delivery" },
      { to: "/approvals", label: "Approvals Inbox" },
      { to: "/crm", label: "Advanced CRM" },
      { to: "/dms", label: "Document Mgmt" },
      { to: "/drug-recall", label: "Drug Recall Mgmt" },
    ],
  },
  {
    id: "portals",
    label: "Portals",
    children: [
      { to: "/customer-portal", label: "Customer Portal" },
      { to: "/salesman-app", label: "Salesman App" },
      { to: "/owner-app", label: "Owner Mobile App" },
      { to: "/health", label: "Business Health" },
      { to: "/retailer-app", label: "Retailer Marketplace" },
      { to: "/supplier-portal", label: "Supplier Portal" },
    ],
  },
  {
    id: "enterprise-12",
    label: "12.0 Enterprise",
    color: "text-blue-700",
    children: [
      { to: "/autonomous-procurement", label: "Auto Procurement", badge: "AI" },
      { to: "/control-tower", label: "Distribution Tower" },
      { to: "/ceo-dashboard", label: "CEO AI Dashboard", badge: "AI" },
      { to: "/institutional-sales", label: "Hospital/Institutional" },
      { to: "/cashflow-engine", label: "Cash Flow Engine", badge: "AI" },
      { to: "/warehouse-twin", label: "Warehouse Twin 2D" },
      { to: "/compliance", label: "Compliance Center" },
      { to: "/automation", label: "Hyper Automation" },
      { to: "/platform-admin", label: "Platform Admin" },
    ],
  },
  {
    id: "gst-compliance",
    label: "GST & Compliance",
    color: "text-green-700",
    children: [
      { to: "/gst-dashboard", label: "GST Dashboard", badge: "GST" },
      { to: "/einvoice", label: "E-Invoice & E-Way Bill" },
      { to: "/compliance-rules", label: "Compliance Rules" },
      { to: "/compliance-audit", label: "System Audit", badge: "SEC" },
    ],
  },
  {
    id: "ai-tools",
    label: "AI Tools",
    color: "text-purple-700",
    children: [
      { to: "/ai-cockpit", label: "AI Cockpit", badge: "AI" },
      { to: "/ai-ledger", label: "AI Smart Ledger", badge: "AI" },
      { to: "/reorder-center", label: "AI Re-Order Agent", badge: "AI" },
      { to: "/expiry-guard", label: "AI Expiry Guard", badge: "AI" },
      { to: "/pricing-engine", label: "AI Pricing Engine", badge: "AI" },
      { to: "/copilot", label: "AI Copilot", badge: "AI" },
    ],
  }
];
