import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const ALL_PERMISSIONS = [
  { key: "view_inventory", label: "View Inventory" },
  { key: "edit_inventory", label: "Edit Inventory" },
  { key: "view_billing",   label: "View Billing" },
  { key: "create_billing", label: "Create Bills" },
  { key: "delete_billing", label: "Delete Bills" },
  { key: "view_reports",   label: "View Reports" },
  { key: "view_expiry",    label: "View Expiry Box" },
  { key: "manage_users",   label: "Manage Users" },
];

const ROLE_COLORS = {
  admin:   "bg-purple-100 text-purple-700 border-purple-200",
  manager: "bg-blue-100 text-blue-700 border-blue-200",
  staff:   "bg-gray-100 text-gray-600 border-gray-200",
};

const ROLE_ICONS = { admin: "👑", manager: "🎯", staff: "👤" };

const emptyForm = {
  name: "", email: "", password: "", role: "staff",
  phone: "", permissions: [],
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchUsers = () => {
    setLoading(true);
    axios.get("http://localhost:5000/api/users", { headers: headers() })
      .then(res => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const togglePermission = (key) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }));
  };

  const setRoleDefaults = (role) => {
    const defaults = {
      admin:   ALL_PERMISSIONS.map(p => p.key),
      manager: ["view_inventory", "edit_inventory", "view_billing", "create_billing", "view_reports", "view_expiry"],
      staff:   ["view_inventory", "view_billing", "create_billing", "view_expiry"],
    };
    setForm(f => ({ ...f, role, permissions: defaults[role] || [] }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) return alert("Name and email are required");
    if (!editId && !form.password) return alert("Password is required for new users");

    try {
      if (editId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await axios.put(`http://localhost:5000/api/users/${editId}`, payload, { headers: headers() });
      } else {
        await axios.post("http://localhost:5000/api/users", form, { headers: headers() });
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditId(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Something went wrong");
    }
  };

  const handleEdit = (user) => {
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      phone: user.phone || "",
      permissions: user.permissions || [],
    });
    setEditId(user.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) return alert("You cannot delete yourself");
    if (!window.confirm("Delete this user?")) return;
    await axios.delete(`http://localhost:5000/api/users/${id}`, { headers: headers() });
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
    staff:   users.filter(u => u.role === "staff").length,
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">👥 User Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage staff accounts and permissions</p>
          </div>
          <button
            onClick={() => { setForm(emptyForm); setEditId(null); setShowModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow"
          >
            + Add User
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Users", value: counts.total, icon: "👥", color: "bg-blue-600" },
            { label: "Admins", value: counts.admin, icon: "👑", color: "bg-purple-600" },
            { label: "Managers", value: counts.manager, icon: "🎯", color: "bg-indigo-500" },
            { label: "Staff", value: counts.staff, icon: "👤", color: "bg-gray-600" },
          ].map(c => (
            <div key={c.label} className={`${c.color} text-white rounded-2xl p-5 shadow`}>
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="text-3xl font-bold">{c.value}</div>
              <div className="text-sm opacity-80 mt-1">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="🔍 Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-2">
            {["all", "admin", "manager", "staff"].map(r => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                  filterRole === r
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {r === "all" ? "All" : `${ROLE_ICONS[r]} ${r}`}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-400 ml-auto">
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading users...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(user => (
              <div key={user.id} className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition">

                {/* User Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white ${
                      user.role === "admin" ? "bg-purple-500" :
                      user.role === "manager" ? "bg-blue-500" : "bg-gray-400"
                    }`}>
                      {user.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{user.name}</p>
                      <p className="text-gray-400 text-xs">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border capitalize ${ROLE_COLORS[user.role]}`}>
                    {ROLE_ICONS[user.role]} {user.role}
                  </span>
                </div>

                {/* Phone */}
                {user.phone && (
                  <p className="text-sm text-gray-500 mb-3">📞 {user.phone}</p>
                )}

                {/* Permissions */}
                <div className="mb-4">
                  <p className="text-xs text-gray-400 uppercase font-medium mb-2">Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {(user.permissions || []).length === 0 ? (
                      <span className="text-xs text-gray-400">No permissions set</span>
                    ) : (
                      (user.permissions || []).slice(0, 4).map(p => {
                        const perm = ALL_PERMISSIONS.find(x => x.key === p);
                        return (
                          <span key={p} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full border border-blue-100">
                            {perm?.label || p}
                          </span>
                        );
                      })
                    )}
                    {(user.permissions || []).length > 4 && (
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                        +{user.permissions.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Created */}
                <p className="text-xs text-gray-400 mb-4">
                  Joined {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(user)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg text-xs font-semibold transition"
                  >
                    ✏️ Edit
                  </button>
                  {user.id !== currentUser.id && (
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 py-2 rounded-lg text-xs font-semibold transition"
                    >
                      🗑️ Delete
                    </button>
                  )}
                  {user.id === currentUser.id && (
                    <span className="flex-1 text-center text-xs text-gray-400 py-2">That's you</span>
                  )}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">👥</div>
                <p>No users found</p>
              </div>
            )}
          </div>
        )}

        {/* ── MODAL ── */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-800">
                    {editId ? "Edit User" : "Add New User"}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { key: "name", label: "Full Name *", type: "text", placeholder: "John Doe" },
                    { key: "email", label: "Email *", type: "email", placeholder: "john@company.com" },
                    { key: "phone", label: "Phone", type: "text", placeholder: "10-digit number" },
                    { key: "password", label: editId ? "New Password (leave blank to keep)" : "Password *", type: "password", placeholder: "••••••••" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        value={form[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  ))}
                </div>

                {/* Role */}
                <div className="mb-6">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Role</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["admin", "manager", "staff"].map(r => (
                      <button
                        key={r}
                        onClick={() => setRoleDefaults(r)}
                        className={`py-3 rounded-xl text-sm font-semibold capitalize border-2 transition ${
                          form.role === r
                            ? r === "admin" ? "border-purple-500 bg-purple-50 text-purple-700"
                            : r === "manager" ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-400 bg-gray-50 text-gray-700"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-xl mb-1">{ROLE_ICONS[r]}</div>
                        {r}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Selecting a role auto-fills recommended permissions. You can customize below.
                  </p>
                </div>

                {/* Permissions */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-600">Permissions</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setForm(f => ({ ...f, permissions: ALL_PERMISSIONS.map(p => p.key) }))}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => setForm(f => ({ ...f, permissions: [] }))}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PERMISSIONS.map(p => (
                      <button
                        key={p.key}
                        onClick={() => togglePermission(p.key)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition text-left ${
                          form.permissions.includes(p.key)
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-xs flex-shrink-0 ${
                          form.permissions.includes(p.key)
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200"
                        }`}>
                          {form.permissions.includes(p.key) ? "✓" : ""}
                        </span>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm"
                  >
                    {editId ? "Update User" : "Create User"}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}