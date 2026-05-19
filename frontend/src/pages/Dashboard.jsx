import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });
const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#14b8a6"];

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    axios.get("http://localhost:5000/api/dashboard", { headers: headers() })
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) return (
    <div className="flex min-h-screen bg-gray-100"><Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-center">
          <div className="text-5xl mb-4 animate-pulse">📊</div>
          <p className="font-medium">Loading dashboard...</p>
        </div>
      </main>
    </div>
  );

  const d = data || {};

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{greeting}, {user.name || "User"} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here's your business snapshot for today.</p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Today's Sales",     value: `₹${(d.todaySales||0).toLocaleString("en-IN")}`, icon: "💰", sub: `${d.todayBillCount||0} invoices`, color: "from-green-500 to-emerald-600" },
            { label: "Total Revenue",     value: `₹${(d.totalRevenue||0).toLocaleString("en-IN")}`, icon: "📈", sub: "All time", color: "from-blue-500 to-blue-700" },
            { label: "Outstanding Dues",  value: `₹${(d.totalOutstanding||0).toLocaleString("en-IN")}`, icon: "⏳", sub: `${d.unpaidBillCount||0} unpaid bills`, color: "from-red-500 to-rose-600" },
            { label: "Today's Cash",      value: `₹${(d.todayCash||0).toLocaleString("en-IN")}`, icon: "💵", sub: `Credit: ₹${(d.todayCredit||0).toLocaleString("en-IN")}`, color: "from-violet-500 to-purple-700" },
          ].map(c => (
            <div key={c.label} className={`bg-gradient-to-br ${c.color} text-white rounded-2xl p-5 shadow-lg`}>
              <div className="text-3xl mb-2">{c.icon}</div>
              <p className="text-2xl font-bold leading-tight">{c.value}</p>
              <p className="text-xs opacity-80 mt-1">{c.label}</p>
              <p className="text-xs opacity-60 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Alert Row */}
        {(d.lowStockCount > 0 || d.nearExpiryCount > 0) && (
          <div className="flex gap-4 mb-6">
            {d.lowStockCount > 0 && (
              <div className="flex-1 bg-yellow-50 border border-yellow-300 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <p className="font-bold text-yellow-800">{d.lowStockCount} Low Stock Items</p>
                  <p className="text-xs text-yellow-600">Stock below 10 units — reorder soon</p>
                </div>
                <a href="/inventory" className="ml-auto text-xs text-yellow-700 underline font-medium">View →</a>
              </div>
            )}
            {d.nearExpiryCount > 0 && (
              <div className="flex-1 bg-red-50 border border-red-300 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-3xl">⏰</span>
                <div>
                  <p className="font-bold text-red-800">{d.nearExpiryCount} Near-Expiry Items</p>
                  <p className="text-xs text-red-600">Expiring within 60 days</p>
                </div>
                <a href="/expiry" className="ml-auto text-xs text-red-700 underline font-medium">View →</a>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Monthly Sales Chart */}
          <div className="col-span-2 bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-700 mb-4">📈 Monthly Sales Trend</h2>
            {(d.monthlySales || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={d.monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Sales"]} />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400">No sales data yet</div>
            )}
          </div>

          {/* Top Items Pie */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-700 mb-4">🏆 Top Items by Revenue</h2>
            {(d.topItems || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={d.topItems} dataKey="sales" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name.slice(0, 8)}>
                    {(d.topItems || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => `₹${v.toLocaleString("en-IN")}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400">No data</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Top Items Bar */}
          <div className="col-span-2 bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-700 mb-4">📦 Item-wise Sales</h2>
            {(d.topItems || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.topItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Sales"]} />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400">Bill items will appear here</div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-700 mb-4">⚡ Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "New Bill", icon: "🧾", href: "/billing", color: "bg-blue-50 hover:bg-blue-100 text-blue-700" },
                { label: "Sales Return", icon: "↩️", href: "/sales-return", color: "bg-green-50 hover:bg-green-100 text-green-700" },
                { label: "Add Inventory", icon: "📦", href: "/inventory", color: "bg-purple-50 hover:bg-purple-100 text-purple-700" },
                { label: "Collect Payment", icon: "💵", href: "/customers", color: "bg-orange-50 hover:bg-orange-100 text-orange-700" },
                { label: "Check Expiry", icon: "⏰", href: "/expiry", color: "bg-red-50 hover:bg-red-100 text-red-700" },
                { label: "Reports", icon: "📈", href: "/reports", color: "bg-gray-50 hover:bg-gray-100 text-gray-700" },
              ].map(a => (
                <a key={a.label} href={a.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${a.color}`}>
                  <span>{a.icon}</span>{a.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Outstanding Customers */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-700 mb-4">⏳ Top Outstanding Customers</h2>
            {(d.outstanding || []).length > 0 ? (
              <div className="space-y-3">
                {(d.outstanding || []).map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.phone || "—"}</p>
                    </div>
                    <span className="font-bold text-red-600 text-sm">₹{parseFloat(c.balance).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">🎉 No outstanding dues</p>
            )}
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-700 mb-4">📉 Low Stock Items</h2>
            {(d.lowStock || []).length > 0 ? (
              <div className="space-y-3">
                {(d.lowStock || []).map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-400">Batch: {item.batch || "—"}</p>
                    </div>
                    <span className={`font-bold text-sm px-2 py-0.5 rounded-full ${
                      item.stock_qty === 0 ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {item.stock_qty === 0 ? "OUT" : `${item.stock_qty} left`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">✅ All items adequately stocked</p>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}