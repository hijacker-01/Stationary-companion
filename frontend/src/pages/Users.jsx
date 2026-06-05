import { useEffect, useState } from "react";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import {
  Users as UsersIcon,
  UserPlus,
  Plus,
  Search,
  Pencil,
  Trash2,
  Phone,
  Package,
  Receipt,
  ClipboardList,
  Clock,
  Shield,
  ShieldCheck,
  Target,
  User,
  Briefcase,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const ALL_PERMISSIONS = [
  { key: "view_inventory",  label: "View Inventory",  icon: Package },
  { key: "edit_inventory",  label: "Edit Inventory",  icon: Pencil },
  { key: "view_billing",    label: "View Billing",    icon: Receipt },
  { key: "create_billing",  label: "Create Bills",    icon: Plus },
  { key: "delete_billing",  label: "Delete Bills",    icon: Trash2 },
  { key: "view_reports",    label: "View Reports",    icon: ClipboardList },
  { key: "view_expiry",     label: "View Expiry Box",  icon: Clock },
  { key: "manage_users",    label: "Manage Users",    icon: UsersIcon },
];

const ROLE_COLORS = {
  admin:   "bg-purple-100 text-purple-700 border-purple-200",
  manager: "bg-teal-100 text-teal-700 border-teal-200",
  staff:   "bg-slate-100 text-slate-600 border-slate-200",
  billing_operator: "bg-green-100 text-green-700 border-green-200",
  accountant: "bg-orange-100 text-orange-700 border-orange-200",
};

const ROLE_ICONS = {
  admin: ShieldCheck, manager: Target, staff: User,
  billing_operator: Receipt, accountant: Briefcase,
};

const ROLES = [
  { key: "admin",            label: "Admin",            desc: "Full access to all modules" },
  { key: "manager",          label: "Manager",          desc: "Inventory, billing & reports" },
  { key: "billing_operator", label: "Billing Operator", desc: "Create and manage invoices only" },
  { key: "accountant",       label: "Accountant",       desc: "Reports, ledger & GST access" },
  { key: "staff",            label: "Staff",            desc: "View-only basic access" },
];

const ROLE_DEFAULT_PERMS = {
  admin:            ALL_PERMISSIONS.map(p => p.key),
  manager:          ["view_inventory", "edit_inventory", "view_billing", "create_billing", "view_reports", "view_expiry"],
  billing_operator: ["view_inventory", "view_billing", "create_billing"],
  accountant:       ["view_inventory", "view_billing", "view_reports"],
  staff:            ["view_inventory", "view_billing", "view_expiry"],
};

const emptyForm = { name: "", email: "", password: "", role: "staff", phone: "", permissions: [] };

export default function Users() {
  const [users, setUsers]         = useState([]);
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState(null);
  const [view, setView]           = useState("list"); // "list" | "register"
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchUsers = () => {
    setLoading(true);
    axios.get("/users")
      .then(res => setUsers(res.data?.rows || res.data?.items || res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const togglePermission = (key) =>
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }));

  const setRoleDefaults = (role) =>
    setForm(f => ({ ...f, role, permissions: ROLE_DEFAULT_PERMS[role] || [] }));

  const handleSubmit = async () => {
    if (!form.name || !form.email) return 
    if (!editId && !form.password) return 
    try {
      if (editId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await axios.put(`/users/${editId}`, payload);
      } else {
        await axios.post("/users", form);
      }
      setView("list");
      setForm(emptyForm);
      setEditId(null);
      fetchUsers();
    } catch (err) {
      
    }
  };

  const handleEdit = (user) => {
    setForm({ name: user.name, email: user.email, password: "", role: user.role, phone: user.phone || "", permissions: user.permissions || [] });
    setEditId(user.id);
    setView("register");
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) return 
    if (!window.confirm("Delete this user? This action cannot be undone.")) return;
    await axios.delete(`/users/${id}`);
    fetchUsers();
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const counts = {
    total:   users.length,
    admin:   users.filter(u => u.role === "admin").length,
    manager: users.filter(u => u.role === "manager").length,
    staff:   users.filter(u => ["staff", "billing_operator", "accountant"].includes(u.role)).length,
  };

  // ── REGISTER / EDIT VIEW ──
  if (view === "register") return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{editId ? "Edit User" : "Register New User"}</h1>
            <p className="text-sm text-slate-500 mt-1">{editId ? "Update account details and permissions" : "Create a new staff account with role-based access"}</p>
          </div>
          <button onClick={() => { setView("list"); setForm(emptyForm); setEditId(null); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back to Users
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 space-y-8">

          {/* Basic Info */}
          <div>
            <h2 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">Account Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "name",     label: "Full Name *",     type: "text",     placeholder: "John Doe" },
                { key: "email",    label: "Email Address *", type: "email",    placeholder: "john@company.com" },
                { key: "phone",    label: "Phone Number",    type: "text",     placeholder: "+91 XXXXXXXXXX" },
                { key: "password", label: editId ? "New Password (leave blank to keep)" : "Password *", type: "password", placeholder: "Min. 8 characters" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="form-input"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <h2 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">Assign Role</h2>
            <p className="text-xs text-slate-400 mb-3">Selecting a role auto-fills recommended permissions. Customise below.</p>
            <div className="grid grid-cols-5 gap-3">
              {ROLES.map(r => {
                const RoleIcon = ROLE_ICONS[r.key];
                return (
                  <button
                    key={r.key}
                    onClick={() => setRoleDefaults(r.key)}
                    className={`p-3 rounded-xl text-center border-2 transition cursor-pointer ${
                      form.role === r.key
                        ? r.key === "admin"    ? "border-purple-500 bg-purple-50"
                        : r.key === "manager"  ? "border-teal-500 bg-teal-50"
                        : r.key === "accountant" ? "border-orange-500 bg-orange-50"
                        : r.key === "billing_operator" ? "border-green-500 bg-green-50"
                        : "border-slate-400 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      <RoleIcon className="w-6 h-6 text-slate-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">{r.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{r.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Module Permissions</h2>
              <div className="flex gap-3">
                <button onClick={() => setForm(f => ({ ...f, permissions: ALL_PERMISSIONS.map(p => p.key) }))}
                  className="text-xs text-teal-600 hover:underline cursor-pointer">Select All</button>
                <span className="text-slate-300">|</span>
                <button onClick={() => setForm(f => ({ ...f, permissions: [] }))}
                  className="text-xs text-rose-500 hover:underline cursor-pointer">Clear All</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PERMISSIONS.map(p => {
                const PermIcon = p.icon;
                return (
                  <button
                    key={p.key}
                    onClick={() => togglePermission(p.key)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition text-left cursor-pointer ${
                      form.permissions.includes(p.key)
                        ? "bg-teal-50 border-teal-300 text-teal-700"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs flex-shrink-0 font-bold ${
                      form.permissions.includes(p.key) ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-400"
                    }`}>
                      {form.permissions.includes(p.key) ? "✓" : ""}
                    </span>
                    <PermIcon className="w-4 h-4 flex-shrink-0" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg font-semibold text-sm shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> {editId ? "Update User" : "Create User Account"}
            </button>
            <button
              onClick={() => { setView("list"); setForm(emptyForm); setEditId(null); }}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg font-semibold text-sm cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </main>
    </div>
  );

  // ── LIST VIEW ──
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
            <p className="text-sm text-slate-500 mt-1">Manage staff accounts, roles and access permissions</p>
          </div>
          <button
            onClick={() => { setForm(emptyForm); setEditId(null); setView("register"); }}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" /> Register New User
          </button>
        </div>

        {/* Quick Add Prompt Banner — shown if only 1 user exists */}
        {users.length <= 1 && (
          <div className="bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-xl p-6 mb-6 flex items-center justify-between shadow-lg">
            <div>
              <p className="font-bold text-lg mb-1">Set up your team</p>
              <p className="text-teal-100 text-sm">You're the only user registered. Add staff members so they can log in and use the system with appropriate permissions.</p>
            </div>
            <button
              onClick={() => { setForm(emptyForm); setEditId(null); setView("register"); }}
              className="bg-white text-teal-600 px-6 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition shrink-0 ml-6 cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add First Staff
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total Users", value: counts.total, icon: UsersIcon, borderColor: "border-l-teal-500", color: "bg-teal-50 text-teal-600" },
            { label: "Admins",      value: counts.admin,  icon: ShieldCheck, borderColor: "border-l-purple-500", color: "bg-purple-50 text-purple-600" },
            { label: "Managers",    value: counts.manager, icon: Target, borderColor: "border-l-indigo-500", color: "bg-indigo-50 text-indigo-600" },
            { label: "Operators",   value: counts.staff,  icon: User, borderColor: "border-l-slate-500", color: "bg-slate-100 text-slate-600" },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className={`bg-white border-l-4 ${c.borderColor} border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between`}>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{c.value}</p>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-1">{c.label}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${c.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-3 flex-1 min-w-48">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", ...ROLES.map(r => r.key)].map(r => {
              const RIcon = ROLE_ICONS[r];
              return (
                <button
                  key={r}
                  onClick={() => setFilterRole(r)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                    filterRole === r ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {RIcon && <RIcon className="w-3.5 h-3.5" />}
                  {r === "all" ? "All" : ROLES.find(x => x.key === r)?.label || r}
                </button>
              );
            })}
          </div>
          <span className="text-sm text-slate-400 ml-auto">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading users...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(user => {
              const UserRoleIcon = ROLE_ICONS[user.role] || User;
              return (
                <div key={user.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-150">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white ${
                        user.role === "admin"    ? "bg-purple-500" :
                        user.role === "manager"  ? "bg-teal-500"   :
                        user.role === "accountant" ? "bg-orange-500" :
                        user.role === "billing_operator" ? "bg-green-500" :
                        "bg-slate-400"
                      }`}>
                        {user.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-slate-400 text-xs">{user.email}</p>
                        {user.phone && <p className="text-slate-400 text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> {user.phone}</p>}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${ROLE_COLORS[user.role] || ROLE_COLORS.staff}`}>
                      <UserRoleIcon className="w-3 h-3" /> {ROLES.find(r => r.key === user.role)?.label || user.role}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Access</p>
                    <div className="flex flex-wrap gap-1">
                      {(user.permissions || []).length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No permissions set</span>
                      ) : (
                        <>
                          {(user.permissions || []).slice(0, 3).map(p => {
                            const perm = ALL_PERMISSIONS.find(x => x.key === p);
                            return (
                              <span key={p} className="bg-teal-50 text-teal-600 text-xs px-2 py-0.5 rounded-full border border-teal-100">
                                {perm?.label || p}
                              </span>
                            );
                          })}
                          {(user.permissions || []).length > 3 && (
                            <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">
                              +{user.permissions.length - 3} more
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-4">
                    Joined {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>

                  <div className="flex gap-2 pt-3 border-t border-slate-200">
                    <button onClick={() => handleEdit(user)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-600 py-2 rounded-lg text-xs font-semibold transition cursor-pointer">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    {user.id !== currentUser.id ? (
                      <button onClick={() => handleDelete(user.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 py-2 rounded-lg text-xs font-semibold transition cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    ) : (
                      <span className="flex-1 text-center text-xs text-slate-400 py-2 bg-slate-50 rounded-lg">That's you</span>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-16 text-slate-400">
                <div className="flex justify-center mb-3">
                  <UsersIcon className="w-12 h-12 text-slate-300" />
                </div>
                <p className="font-medium">No users found</p>
                <p className="text-sm mt-1">Try changing the filter or <button onClick={() => { setForm(emptyForm); setView("register"); }} className="text-teal-600 underline cursor-pointer">register a new user</button>.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}