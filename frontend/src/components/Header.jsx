import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Building2, Calendar, Clock, KeyRound, Receipt, Package, 
  Users, HelpCircle, ArrowRightLeft, UserCheck 
} from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  
  // Fetch logged in user and company settings
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const settings = JSON.parse(localStorage.getItem("settings") || "{}");
  const companyName = settings.companyName || "BPartners Pharma Pvt. Ltd.";

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const shortcutActions = [
    { label: "Billing", shortcut: "Alt+S", path: "/billing", icon: Receipt },
    { label: "Purchase", shortcut: "Alt+P", path: "/purchase-bills", icon: ArrowRightLeft },
    { label: "Items", shortcut: "Alt+I", path: "/inventory", icon: Package },
    { label: "Ledger", shortcut: "Alt+L", path: "/customers", icon: Users },
  ];

  return (
    <header className="bg-[#0f2c59] text-white px-4 py-2 flex flex-col md:flex-row items-center justify-between border-b border-[#071730] shadow-sm z-40">
      {/* Company Branding & Fin Year */}
      <div className="flex items-center gap-3 w-full md:w-auto mb-2 md:mb-0">
        <div className="p-1.5 bg-teal-600 rounded-md shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide leading-tight text-teal-300">
            {companyName}
          </h2>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-300 font-semibold uppercase">
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-white border border-slate-700">
              F.Y. 2025-2026
            </span>
            <span className="text-teal-400 font-bold">•</span>
            <span>BUSINESS CONSOLE</span>
          </div>
        </div>
      </div>

      {/* Keyboard Quick Shortcuts Panel */}
      <div className="hidden lg:flex items-center gap-1.5">
        {shortcutActions.map((action, i) => {
          const Icon = action.icon;
          const isActive = location.pathname === action.path;
          return (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${
                isActive
                  ? "bg-teal-600 border-teal-500 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-600"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{action.label}</span>
              <kbd className="bg-slate-950 px-1 py-0.2 rounded text-[9px] text-teal-400 font-mono">
                {action.shortcut}
              </kbd>
            </button>
          );
        })}
      </div>

      {/* Date, Time & Profile Info */}
      <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 border-slate-700 pt-2 md:pt-0">
        {/* Dynamic Clock & Calendar */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            <span>
              {time.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-mono text-white">
              {time.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              })}
            </span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block w-px h-6 bg-slate-700"></div>

        {/* User Role Card */}
        <div className="flex items-center gap-2.5">
          <div className="bg-[#1b4985] text-white border border-slate-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-teal-400" />
            {user.role || "Operator"}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-teal-200 leading-none">{user.name || "User"}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Terminal 01</p>
          </div>
        </div>
      </div>
    </header>
  );
}
