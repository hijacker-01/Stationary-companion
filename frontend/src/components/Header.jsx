import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Sparkles } from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const settings = JSON.parse(localStorage.getItem("settings") || "{}");
  const companyName = settings.companyName || "BPartners Pharma Pvt. Ltd.";
  const finYear = settings.financialYear || "2026-2027";

  const topBarText = `BPartner ERP 9+ | Pro User | Ver-1.0.0 | LIC-998877 | ${companyName} ${finYear} | USER-${user.name?.toUpperCase() || 'ADMIN'} | MAIN COMPUTER`;

  const menus = [
    { label: "Masters", path: "/items" },
    { label: "Transactions", path: "/billing" },
    { label: "Accounts", path: "/ledger" },
    { label: "Digital", path: "/ai-ledger" },
    { label: "Books", path: "/journal-vouchers" },
    { label: "Final Reports", path: "/reports" },
    { label: "Gst", path: "/reports" },
    { label: "Stocks", path: "/inventory" },
    { label: "Daily Reports", path: "/reports" },
    { label: "Hot Keys", path: "/dashboard" },
    { label: "Exit", path: "/", action: () => { localStorage.clear(); navigate("/"); } },
  ];

  const subMenus = [
    { label: "Wallet", active: true, color: "bg-red-600" },
    { label: "Marketplace", active: false },
    { label: "Message", active: false },
    { label: "Ticket", active: false },
    { label: "HELP", active: true, color: "bg-red-600" },
    { label: "Training", active: false },
    { label: "Community", active: true, color: "bg-blue-700" },
    { label: "Dashboard", active: true, color: "bg-red-600" },
    { label: "Search", active: false },
  ];

  return (
    <div className="w-full bg-[#f0f0f0] border-b border-gray-300 shadow-sm z-50">
      {/* Absolute Top Title Bar - Classic ERP Style */}
      <div className="bg-[#e4e4e4] border-b border-gray-300 px-2 py-0.5 text-[10px] font-mono text-gray-700 flex items-center shadow-inner">
        <span className="font-bold text-[#b71c1c] mr-2 text-xs leading-none">M</span> 
        <span className="truncate">{topBarText}</span>
      </div>

      {/* Main Classic Menu Bar */}
      <div className="flex flex-wrap items-center px-1 bg-[#f4f4f4] border-b border-gray-300">
        {menus.map((menu, idx) => (
          <button
            key={idx}
            onClick={menu.action ? menu.action : () => navigate(menu.path)}
            className="px-3 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-200 hover:text-black border-r border-transparent hover:border-gray-300 transition-colors flex items-center gap-1"
          >
            {menu.label}
          </button>
        ))}
      </div>

      {/* Sub Menu / Action Bar (Wallet, Marketplace, etc.) */}
      <div className="flex items-center justify-center gap-1 py-1 bg-[#f0f0f0] overflow-x-auto shadow-sm">
        {subMenus.map((sub, idx) => (
          <button
            key={idx}
            className={`px-3 py-0.5 text-[11px] font-bold border border-gray-300 rounded shadow-sm flex items-center gap-1
              ${sub.active ? `${sub.color} text-white` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
          >
            {sub.label}
          </button>
        ))}
        {/* AI Action Indicator */}
        <button onClick={() => navigate("/ai-ledger")} className="ml-4 px-3 py-0.5 text-[11px] font-bold border border-purple-300 rounded shadow-sm bg-purple-100 text-purple-800 flex items-center gap-1 hover:bg-purple-200">
          <Sparkles className="w-3 h-3" /> AI Engine Active
        </button>
      </div>
    </div>
  );
}
