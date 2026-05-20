import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Package, Clock, Receipt, Undo2, 
  CornerUpRight, Tag, Factory, Users, Briefcase, 
  DollarSign, Truck, MessageSquare, Wallet, BookOpen, 
  BarChart3, UserCheck, Settings, LogOut, Inbox
} from "lucide-react";

const links = [
  { to: "/dashboard",       icon: LayoutDashboard, label: "Dashboard" },
  { to: "/inventory",       icon: Package, label: "Inventory" },
  { to: "/expiry",          icon: Clock, label: "Expiry Box" },
  { to: "/billing",         icon: Receipt, label: "Billing" },
  { to: "/sales-return",    icon: Undo2, label: "Sales Return" },
  { to: "/purchase-return", icon: CornerUpRight, label: "Purchase Return" },
  { to: "/purchase-bills",  icon: Inbox, label: "Purchase Entry" },
  { to: "/schemes",         icon: Tag, label: "Schemes" },
  { to: "/suppliers",       icon: Factory, label: "Suppliers" },
  { to: "/customers",       icon: Users, label: "Customers" },
  { to: "/salesman",        icon: Briefcase, label: "Salesman" },
  { to: "/vouchers",        icon: DollarSign, label: "Vouchers" },
  { to: "/delivery-man",    icon: Truck, label: "Delivery Man" },
  { to: "/messages",        icon: MessageSquare, label: "Team Chat" },
  { to: "/expenses",        icon: Wallet, label: "Expenses" },
  { to: "/journal-vouchers",icon: BookOpen, label: "Journal Vouchers" },
  { to: "/reports",         icon: BarChart3, label: "Reports" },
  { to: "/users",           icon: UserCheck, label: "Users" },
  { to: "/settings",        icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="w-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col border-r border-slate-800">

      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
            <span className="text-white font-extrabold text-lg">M</span>
          </div>
          <div>
            <p className="font-bold text-lg leading-none text-white">Marg ERP</p>
            <p className="text-slate-400 text-xs mt-1">Management Suite</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-teal-600 text-white shadow-md font-semibold border-l-4 border-teal-400"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`
              }
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-5 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold uppercase text-white shadow-inner">
            {user.name?.[0] || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user.name || "User"}</p>
            <p className="text-slate-400 text-xs capitalize truncate">{user.role || "staff"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-900 py-2.5 px-4 rounded-lg transition-all duration-150 border border-slate-800 hover:border-slate-700 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}