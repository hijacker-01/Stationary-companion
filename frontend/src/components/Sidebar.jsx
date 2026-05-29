import { NavLink } from "react-router-dom";

const mostViewed = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/inventory", label: "Filtered Stock" },
  { to: "/billing", label: "Modify" },
  { to: "/sales-return", label: "Credit Note" },
  { to: "/users", label: "Change User" },
  { to: "/reports", label: "Area Wise" },
];

const recentlyViewed = [
  { to: "/settings", label: "Change Company" },
  { to: "/ledger", label: "Ledger A/C" },
  { to: "/purchase-bills", label: "Receive" },
  { to: "/expiry", label: "Near Expiry Stock" },
  { to: "/items", label: "Item Master" },
  { to: "/inventory", label: "Current Stock" },
  { to: "/suppliers", label: "Route Wise" },
];

export default function Sidebar() {
  return (
    <div className="w-56 h-full bg-[#f4f4f4] border-r border-gray-300 flex flex-col overflow-y-auto shrink-0 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.02)]">
      
      <div className="py-2">
        <h3 className="px-4 text-[13px] font-bold text-[#1b4985] mb-1">Most viewed reports</h3>
        <nav className="flex flex-col">
          {mostViewed.map((link, i) => (
            <NavLink
              key={i}
              to={link.to}
              className={({ isActive }) =>
                `px-6 py-0.5 text-[12px] font-medium transition-colors ${
                  isActive ? "bg-[#dbeafe] text-[#1e3a8a] border-l-2 border-[#1e3a8a]" : "text-gray-700 hover:bg-[#e5e7eb]"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="py-2 flex-1">
        <h3 className="px-4 text-[13px] font-bold text-[#1b4985] mb-1">Recently viewed reports</h3>
        <nav className="flex flex-col">
          {recentlyViewed.map((link, i) => (
            <NavLink
              key={i}
              to={link.to}
              className={({ isActive }) =>
                `px-6 py-0.5 text-[12px] font-medium transition-colors ${
                  isActive ? "bg-[#dbeafe] text-[#1e3a8a] border-l-2 border-[#1e3a8a]" : "text-gray-700 hover:bg-[#e5e7eb]"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Digital Actions */}
      <div className="p-3 border-t border-gray-300 bg-[#e4e4e4]">
        <div className="flex flex-col gap-1.5">
          <NavLink to="/ai-ledger" className="flex items-center gap-2 text-[11px] font-bold text-gray-800 hover:text-blue-700">
            <span className="text-blue-600 font-extrabold text-sm">➔</span> Digital Entry
          </NavLink>
          <NavLink to="/reorder-center" className="flex items-center gap-2 text-[11px] font-bold text-gray-800 hover:text-blue-700">
            <span className="text-blue-600 font-extrabold text-sm">➔</span> ERP to ERP Order <span className="bg-yellow-400 text-[9px] px-1 rounded text-black ml-auto">NEW</span>
          </NavLink>
          <NavLink to="/delivery-man" className="flex items-center gap-2 text-[11px] font-bold text-gray-800 hover:text-blue-700">
            <span className="text-blue-600 font-extrabold text-sm">➔</span> Digital Delivery
          </NavLink>
        </div>
      </div>
    </div>
  );
}