import { NavLink, useNavigate } from "react-router-dom";

const links = [
  { to: "/dashboard",       icon: "📊", label: "Dashboard" },
  { to: "/inventory",       icon: "📦", label: "Inventory" },
  { to: "/expiry",          icon: "⏰", label: "Expiry Box" },
  { to: "/billing",         icon: "🧾", label: "Billing" },
  { to: "/sales-return",    icon: "↩️", label: "Sales Return" },
  { to: "/purchase-return", icon: "📤", label: "Purchase Return" },
  { to: "/schemes",         icon: "🎁", label: "Schemes" },
  { to: "/suppliers",       icon: "🏭", label: "Suppliers" },
  { to: "/customers",       icon: "👤", label: "Customers" },
  { to: "/salesman",        icon: "🧑‍💼", label: "Salesman" },
  { to: "/vouchers",        icon: "💵", label: "Vouchers" },
  { to: "/delivery-man",    icon: "🚚", label: "Delivery Man" },
  { to: "/messages",        icon: "💬", label: "Team Chat" },
  { to: "/expenses",        icon: "🧾", label: "Expenses" },
  { to: "/journal-vouchers",icon: "📓", label: "Journal Vouchers" },
  { to: "/reports",         icon: "📈", label: "Reports" },
  { to: "/users",           icon: "👥", label: "Users" },
  { to: "/settings",        icon: "⚙️", label: "Settings" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="w-64 min-h-screen bg-blue-900 text-white flex flex-col">

      {/* Logo */}
      <div className="px-6 py-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <span className="text-blue-700 font-bold text-lg">M</span>
          </div>
          <div>
            <p className="font-bold text-lg leading-none">Marg ERP</p>
            <p className="text-blue-300 text-xs">Management Suite</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {links.filter((link) => {
          if (user.role === "admin") return true;
          const p = user.permissions || [];
          const req = {
            "/inventory": "view_inventory",
            "/expiry": "view_expiry",
            "/billing": "view_billing",
            "/sales-return": "create_billing",
            "/purchase-return": "create_billing",
            "/reports": "view_reports",
            "/users": "manage_users",
            "/settings": "manage_users",
            "/schemes": "edit_inventory",
            "/suppliers": "view_inventory",
            "/customers": "view_billing",
            "/salesman": "manage_users",
            "/vouchers": "view_reports",
            "/delivery-man": "view_billing",
          }[link.to];
          if (!req) return true; // Dashboard, Messages
          return p.includes(req) || p.includes("admin");
        }).map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white text-blue-900 shadow"
                  : "text-blue-200 hover:bg-blue-800 hover:text-white"
              }`
            }
          >
            <span className="text-lg">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-5 border-t border-blue-800">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold uppercase">
            {user.name?.[0] || "U"}
          </div>
          <div>
            <p className="text-sm font-semibold">{user.name || "User"}</p>
            <p className="text-blue-400 text-xs capitalize">{user.role || "staff"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-sm text-blue-300 hover:text-white hover:bg-blue-800 py-2 px-4 rounded-lg transition"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}