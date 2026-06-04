import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Search, X } from "lucide-react";

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
      { label: "Closing Stock", path: "/closing-stock" },
      { label: "Near Expiry", path: "/expiry" },
      { label: "Stock Adjustment", path: "/stock-adjust" },
    ]},
    { label: "AI Tools", items: [
      { label: "Smart Ledger / OCR", path: "/ai-ledger" },
      { label: "Re-Order Agent", path: "/reorder-center" },
      { label: "Expiry Guard", path: "/expiry-guard" },
      { label: "AI Copilot", path: "/copilot" },
    ]},
    { label: "Enterprise", items: [
      { label: "Warehouse WMS", path: "/wms" },
      { label: "Logistics", path: "/logistics" },
      { label: "Approvals", path: "/approvals" },
      { label: "CRM", path: "/crm" },
      { label: "Schemes", path: "/schemes" },
      { label: "Documents", path: "/dms" },
      { label: "Drug Recall", path: "/drug-recall" },
    ]},
    { label: "Portals", items: [
      { label: "Customer Portal", path: "/customer-portal" },
      { label: "Salesman App", path: "/salesman-app" },
      { label: "Owner Dashboard", path: "/owner-app" },
      { label: "Business Health", path: "/health" },
    ]},
  ];

  const [openMenu, setOpenMenu] = useState(null);

  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Build flat searchable index from all menus
  const searchIndex = useMemo(() => {
    const items = [];
    menus.forEach(menu => {
      menu.items.forEach(item => {
        items.push({ label: item.label, path: item.path, category: menu.label });
      });
    });
    // Add direct links
    items.push({ label: "Dashboard", path: "/dashboard", category: "Navigation" });
    items.push({ label: "Settings", path: "/settings", category: "Navigation" });
    items.push({ label: "Dispatch Summary", path: "/dispatch-summary", category: "Reports" });
    items.push({ label: "GST Dashboard", path: "/gst-dashboard", category: "Compliance" });
    items.push({ label: "E-Invoice Center", path: "/einvoice", category: "Compliance" });
    items.push({ label: "CEO Dashboard", path: "/ceo-dashboard", category: "Enterprise" });
    items.push({ label: "Control Tower", path: "/control-tower", category: "Enterprise" });
    return items;
  }, []);

  // Filter results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return searchIndex.filter(item =>
      item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [searchQuery, searchIndex]);

  // Reset highlight when results change
  useEffect(() => { setHighlightIdx(0); }, [searchResults]);

  // Keyboard navigation inside search
  const handleSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && searchResults[highlightIdx]) {
      e.preventDefault();
      navigate(searchResults[highlightIdx].path);
      setSearchQuery("");
      setSearchFocused(false);
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setSearchQuery("");
      setSearchFocused(false);
      inputRef.current?.blur();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      setOpenMenu(null);
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Ctrl+K shortcut to focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchFocused(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
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

        {/* Search Bar — after Portals */}
        <div ref={searchRef} className="relative ml-2" onClick={e => e.stopPropagation()}>
          <div className={`flex items-center bg-white border rounded h-[24px] px-2 transition-all ${searchFocused ? 'w-[260px] border-[#1b4985] shadow-sm' : 'w-[180px] border-gray-300'}`}>
            <Search className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search pages..."
              className="flex-1 bg-transparent outline-none text-[11px] text-gray-700 px-1.5 placeholder-gray-400"
            />
            {searchQuery ? (
              <button onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-[9px] text-gray-400 font-mono flex-shrink-0">Ctrl+K</span>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchFocused && searchQuery.trim() && (
            <div className="absolute top-full left-0 mt-1 w-[300px] bg-white border border-gray-200 rounded-md shadow-xl z-[100] py-1 max-h-[320px] overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="px-4 py-3 text-xs text-gray-400 text-center">No pages found for "{searchQuery}"</div>
              ) : (
                searchResults.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { navigate(item.path); setSearchQuery(""); setSearchFocused(false); }}
                    onMouseEnter={() => setHighlightIdx(i)}
                    className={`w-full text-left px-4 py-2 flex items-center justify-between transition-colors
                      ${highlightIdx === i ? 'bg-[#dbeafe]' : 'hover:bg-gray-50'}
                    `}
                  >
                    <span className={`text-[12px] font-medium ${highlightIdx === i ? 'text-[#1b4985]' : 'text-gray-800'}`}>
                      {item.label}
                    </span>
                    <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.category}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        
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
