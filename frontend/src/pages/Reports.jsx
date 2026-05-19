import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const StatCard = ({ label, value, icon, sub, color }) => (
  <div className={`${color} text-white rounded-2xl p-5 shadow`}>
    <div className="text-3xl mb-2">{icon}</div>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-sm opacity-80 mt-1">{label}</div>
    {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
  </div>
);

export default function Reports() {
  const [tab, setTab] = useState("sales");
  const [sales, setSales] = useState(null);
  const [stock, setStock] = useState(null);
  const [expiry, setExpiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchSales = () => {
    const params = dateFrom && dateTo ? `?from=${dateFrom}&to=${dateTo}` : "";
    return axios.get(`http://localhost:5000/api/reports/sales${params}`, { headers: headers() })
      .then(res => setSales(res.data));
  };

  const fetchStock = () =>
    axios.get("http://localhost:5000/api/reports/stock", { headers: headers() })
      .then(res => setStock(res.data));

  const fetchExpiry = () =>
    axios.get("http://localhost:5000/api/reports/expiry-summary", { headers: headers() })
      .then(res => setExpiry(res.data));

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSales(), fetchStock(), fetchExpiry()])
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: "sales", label: "📈 Sales Report" },
    { key: "stock", label: "📦 Stock Report" },
    { key: "expiry", label: "⏰ Expiry Report" },
  ];

  if (loading) return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading reports...</div>
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📊 Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Insights across sales, stock and expiry</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                tab === t.key
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── SALES REPORT ── */}
        {tab === "sales" && sales && (
          <div className="space-y-6">

            {/* Date Filter */}
            <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-xs text-gray-500 block mb-1">From Date</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">To Date</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <button onClick={fetchSales}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Apply Filter
              </button>
              <button onClick={() => { setDateFrom(""); setDateTo(""); setTimeout(fetchSales, 100); }}
                className="text-sm text-gray-500 hover:text-gray-700">
                Clear
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Revenue" value={`₹${sales.totalSales?.toFixed(2)}`} icon="💰" color="bg-green-600" />
              <StatCard label="Total Bills" value={sales.totalBills} icon="🧾" color="bg-blue-600" />
              <StatCard label="Total GST" value={`₹${sales.totalGst?.toFixed(2)}`} icon="🏛️" color="bg-purple-600" />
              <StatCard label="Total Discount" value={`₹${sales.totalDiscount?.toFixed(2)}`} icon="🎁" color="bg-orange-500" />
            </div>

            {/* Sales Chart */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-semibold text-gray-700 mb-4">Daily Sales Trend</h2>
              {sales.chart?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sales.chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `₹${v.toFixed(2)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Sales ₹" />
                    <Line type="monotone" dataKey="gst" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="GST ₹" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-400">No sales data for this period</div>
              )}
            </div>

            {/* Bills Table */}
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="font-semibold text-gray-700">All Bills</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Bill No</th>
                    <th className="px-6 py-3 text-left">Customer</th>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-right">Subtotal</th>
                    <th className="px-6 py-3 text-right">GST</th>
                    <th className="px-6 py-3 text-right">Discount</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3 text-left">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.bills?.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-blue-600 text-xs">{b.billNo}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">{b.customerName}</td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-600">₹{b.subtotal}</td>
                      <td className="px-6 py-3 text-right text-purple-600">₹{b.gstAmount}</td>
                      <td className="px-6 py-3 text-right text-red-500">₹{b.discount}</td>
                      <td className="px-6 py-3 text-right font-bold text-green-600">₹{b.total}</td>
                      <td className="px-6 py-3 capitalize text-gray-500">{b.paymentMode}</td>
                    </tr>
                  ))}
                  {!sales.bills?.length && (
                    <tr><td colSpan={8} className="text-center py-10 text-gray-400">No bills found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── STOCK REPORT ── */}
        {tab === "stock" && stock && (
          <div className="space-y-6">

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Items" value={stock.totalItems} icon="📦" color="bg-blue-600" />
              <StatCard label="Stock Value" value={`₹${stock.totalValue?.toFixed(2)}`} icon="💹" color="bg-green-600" />
              <StatCard label="Low Stock (≤10)" value={stock.lowStock?.length} icon="⚠️" color="bg-yellow-500" />
              <StatCard label="Out of Stock" value={stock.outOfStock?.length} icon="❌" color="bg-red-500" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="font-semibold text-gray-700 mb-4">Items by Category</h2>
                {stock.byCategory?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stock.byCategory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Items" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-10 text-gray-400">No category data</div>
                )}
              </div>

              {/* Pie Chart */}
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="font-semibold text-gray-700 mb-4">Stock Value by Category</h2>
                {stock.byCategory?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={stock.byCategory} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`}>
                        {stock.byCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => `₹${v.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-10 text-gray-400">No category data</div>
                )}
              </div>
            </div>

            {/* Low Stock Table */}
            {stock.lowStock?.length > 0 && (
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center gap-2">
                  <span>⚠️</span>
                  <h2 className="font-semibold text-gray-700">Low Stock Items</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 text-left">Item</th>
                      <th className="px-6 py-3 text-left">Category</th>
                      <th className="px-6 py-3 text-left">Batch</th>
                      <th className="px-6 py-3 text-left">Qty Left</th>
                      <th className="px-6 py-3 text-left">Location</th>
                      <th className="px-6 py-3 text-right">MRP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stock.lowStock.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-semibold text-gray-800">{item.name}</td>
                        <td className="px-6 py-3 text-gray-500">{item.category || "—"}</td>
                        <td className="px-6 py-3 text-gray-500">{item.batch || "—"}</td>
                        <td className="px-6 py-3">
                          <span className={`font-bold ${item.qty === 0 ? "text-red-600" : "text-yellow-600"}`}>
                            {item.qty} {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-500">{item.location || "—"}</td>
                        <td className="px-6 py-3 text-right text-green-600 font-medium">₹{item.mrp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── EXPIRY REPORT ── */}
        {tab === "expiry" && expiry && (
          <div className="space-y-6">

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Already Expired" value={expiry.expired} icon="💀" color="bg-red-600" />
              <StatCard label="Expiring in 7 Days" value={expiry.in7} icon="🚨" color="bg-orange-500" />
              <StatCard label="Expiring in 30 Days" value={expiry.in30} icon="⚠️" color="bg-yellow-500" />
              <StatCard label="Expiring in 90 Days" value={expiry.in90} icon="📅" color="bg-blue-500" />
            </div>

            {/* Expiry Bar Chart */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-semibold text-gray-700 mb-4">Expiry Overview</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: "Expired", count: expiry.expired, fill: "#ef4444" },
                  { name: "≤ 7 Days", count: expiry.in7, fill: "#f97316" },
                  { name: "≤ 30 Days", count: expiry.in30, fill: "#eab308" },
                  { name: "≤ 90 Days", count: expiry.in90, fill: "#3b82f6" },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Items">
                    {[
                      { fill: "#ef4444" }, { fill: "#f97316" },
                      { fill: "#eab308" }, { fill: "#3b82f6" }
                    ].map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Expired Items Table */}
            {expiry.expiredItems?.length > 0 && (
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center gap-2">
                  <span>💀</span>
                  <h2 className="font-semibold text-red-600">Expired Items — Immediate Action Required</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-red-50 text-red-400 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 text-left">Item</th>
                      <th className="px-6 py-3 text-left">Batch</th>
                      <th className="px-6 py-3 text-left">Category</th>
                      <th className="px-6 py-3 text-left">Qty</th>
                      <th className="px-6 py-3 text-left">Expired On</th>
                      <th className="px-6 py-3 text-left">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expiry.expiredItems.map(item => (
                      <tr key={item.id} className="hover:bg-red-50">
                        <td className="px-6 py-3 font-semibold text-gray-800">{item.name}</td>
                        <td className="px-6 py-3 text-gray-500">{item.batch || "—"}</td>
                        <td className="px-6 py-3 text-gray-500">{item.category || "—"}</td>
                        <td className="px-6 py-3 font-bold text-red-600">{item.qty} {item.unit}</td>
                        <td className="px-6 py-3 text-red-500">
                          {new Date(item.expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-3 text-gray-500">{item.location || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Critical Items */}
            {expiry.criticalItems?.length > 0 && (
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center gap-2">
                  <span>🚨</span>
                  <h2 className="font-semibold text-orange-600">Critical — Expiring within 7 Days</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-orange-50 text-orange-400 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 text-left">Item</th>
                      <th className="px-6 py-3 text-left">Batch</th>
                      <th className="px-6 py-3 text-left">Qty</th>
                      <th className="px-6 py-3 text-left">Expiry Date</th>
                      <th className="px-6 py-3 text-left">Days Left</th>
                      <th className="px-6 py-3 text-left">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expiry.criticalItems.map(item => {
                      const days = Math.ceil((new Date(item.expiry) - new Date()) / 86400000);
                      return (
                        <tr key={item.id} className="hover:bg-orange-50">
                          <td className="px-6 py-3 font-semibold text-gray-800">{item.name}</td>
                          <td className="px-6 py-3 text-gray-500">{item.batch || "—"}</td>
                          <td className="px-6 py-3 font-bold text-orange-600">{item.qty} {item.unit}</td>
                          <td className="px-6 py-3 text-gray-600">
                            {new Date(item.expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-6 py-3">
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold">
                              {days} days
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-500">{item.location || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}