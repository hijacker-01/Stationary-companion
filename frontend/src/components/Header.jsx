import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const settings = JSON.parse(localStorage.getItem("settings") || "{}");
  const companyName = settings.companyName || "BPartners Pharma Pvt. Ltd.";
  const finYear = settings.financialYear || "2026-2027";

  const topBarText = `BPartner ERP 9+ | Pro | Ver-1.0.0 | ${companyName} | ${finYear} | USER: ${user.name?.toUpperCase() || "ADMIN"} | MAIN`;

  const menus = [
    { label: "Masters", items: [
      { label: "Item Master", path: "/items" },
      { label: "Suppliers", path: "/suppliers" },
      { label: "Customers", path: "/customers" },
      { label: "Salesman", path: "/salesman" },
      { label: "Schemes", path: "/schemes" },
    ]},
    { label: "Transactions", items: [
      { label: "Cash/Credit Bill", path: "/billing" },
      { label: "Purchase Challan", path: "/purchase-challan" },
      { label: "Sales DM", path: "/sales-challan" },
      { label: "Purchase Bills", path: "/purchase-bills" },
      { label: "Sales Return", path: "/sales-return" },
      { label: "Purchase Return", path: "/purchase-return" },
    ]},
    { label: "Accounts", items: [
      { label: "Receipt Voucher", path: "/receipt-voucher" },
      { label: "Payment Voucher", path: "/payment-voucher" },
      { label: "Journal Voucher", path: "/journal-vouchers" },
      { label: "Ledger A/c", path: "/ledger" },
      { label: "Cash Book", path: "/cashbook" },
      { label: "Expenses", path: "/expenses" },
    ]},
    { label: "Books", items: [
      { label: "Debtors", path: "/debtors" },
      { label: "Creditors", path: "/creditors" },
    ]},
    { label: "Reports", items: [
      { label: "Sales & Purchase", path: "/reports" },
      { label: "Profit Analytics", path: "/profit-analytics" },
      { label: "Inventory Valuation", path: "/inventory-valuation" },
      { label: "GST Reports", path: "/reports" },
      { label: "Audit Trail", path: "/audit-log" },
    ]},
    { label: "Stocks", items: [
      { label: "Current Stock", path: "/inventory" },
      { label: "Near Expiry", path: "/expiry" },
      { label: "Stock Adjustment", path: "/stock-adjust" },
    ]},
    { label: "AI Tools", items: [
      { label: "Smart Ledger / OCR", path: "/ai-ledger" },
      { label: "Re-Order Agent", path: "/reorder-center" },
      { label: "Expiry Guard", path: "/expiry-guard" },
    ]},
  ];

  const [openMenu, setOpenMenu] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = () => setOpenMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div className="w-full bg-[#f0f0f0] border-b border-gray-300 shadow-sm z-50">
      {/* System Info Bar */}
      <div className="bg-[#e4e4e4] border-b border-gray-300 px-2 py-0.5 text-[10px] font-mono text-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="font-bold text-[#b71c1c] text-xs leading-none">M</span>
          <span className="truncate">{topBarText}</span>
        </div>
        <div className="flex items-center gap-2 text-[9px]">
          <span className="bg-green-600 text-white px-1.5 rounded font-bold">ONLINE</span>
        </div>
      </div>

      {/* Main Menu Bar with Dropdowns */}
      <div className="flex items-center px-1 bg-[#f4f4f4] border-b border-gray-300 relative">
        {menus.map((menu, idx) => (
          <div key={idx} className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === idx ? null : idx); }}
              className={`px-3 py-1 text-xs font-semibold border-r border-transparent transition-colors
                ${openMenu === idx ? "bg-[#1b4985] text-white" : "text-gray-800 hover:bg-gray-200 hover:text-black"}
                ${menu.label === "AI Tools" ? "text-purple-700" : ""}
              `}
            >
              {menu.label}
            </button>
            {openMenu === idx && (
              <div className="absolute top-full left-0 bg-white border border-gray-300 shadow-lg z-50 min-w-[180px] py-1">
                {menu.items.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { navigate(item.path); setOpenMenu(null); }}
                    className={`w-full text-left px-4 py-1.5 text-[11px] font-medium hover:bg-[#dbeafe] hover:text-[#1e3a8a] transition-colors
                      ${location.pathname === item.path ? "bg-[#dbeafe] text-[#1e3a8a] font-bold" : "text-gray-800"}
                    `}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {/* Direct nav links */}
        <button onClick={() => navigate("/dashboard")} className="px-3 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-200 ml-auto">Dashboard</button>
        <button onClick={() => navigate("/settings")} className="px-3 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-200">Settings</button>
        <button onClick={() => { localStorage.clear(); navigate("/"); }} className="px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">Exit</button>
      </div>

      {/* Quick Action Sub-bar */}
      <div className="flex items-center justify-center gap-1 py-0.5 bg-[#efefef] overflow-x-auto">
        {[
          { label: "Alt+S Bill", path: "/billing" },
          { label: "Alt+P Purchase", path: "/purchase-challan" },
          { label: "Alt+I Items", path: "/inventory" },
          { label: "Alt+L Ledger", path: "/ledger" },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={() => navigate(btn.path)}
            className={`px-3 py-0.5 text-[10px] font-bold border border-gray-300 rounded shadow-sm transition-colors
              ${location.pathname === btn.path ? "bg-[#1b4985] text-white border-[#1b4985]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}
            `}
          >
            {btn.label}
          </button>
        ))}
        <button onClick={() => navigate("/ai-ledger")} className="ml-3 px-3 py-0.5 text-[10px] font-bold border border-purple-300 rounded shadow-sm bg-purple-50 text-purple-800 flex items-center gap-1 hover:bg-purple-100">
          <Sparkles className="w-3 h-3" /> AI Engine
        </button>
      </div>
    </div>
  );
}
