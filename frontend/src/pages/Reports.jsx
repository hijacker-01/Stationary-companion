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
  const [outstanding, setOutstanding] = useState(null);
  const [salesmanSales, setSalesmanSales] = useState([]);
  const [itemSales, setItemSales] = useState([]);
  const [gstPeriod, setGstPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [gstr1Data, setGstr1Data] = useState(null);
  const [gstr2Data, setGstr2Data] = useState(null);
  const [gstr3bData, setGstr3bData] = useState(null);
  const [pnlData, setPnlData] = useState(null);
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

  const fetchOutstanding = () =>
    axios.get("http://localhost:5000/api/reports/outstanding", { headers: headers() })
      .then(res => setOutstanding(res.data));

  const fetchSalesmanSales = () =>
    axios.get("http://localhost:5000/api/reports/salesman-sales", { headers: headers() })
      .then(res => setSalesmanSales(res.data || []));

  const fetchItemSales = () =>
    axios.get("http://localhost:5000/api/reports/item-sales", { headers: headers() })
      .then(res => setItemSales(res.data || []));

  const fetchGstData = () => {
    const { month, year } = gstPeriod;
    const p = `?month=${month}&year=${year}`;
    return Promise.all([
      axios.get(`http://localhost:5000/api/gst/gstr1${p}`, { headers: headers() }).then(res => setGstr1Data(res.data)).catch(() => {}),
      axios.get(`http://localhost:5000/api/gst/gstr2${p}`, { headers: headers() }).then(res => setGstr2Data(res.data)).catch(() => {}),
      axios.get(`http://localhost:5000/api/gst/gstr3b${p}`, { headers: headers() }).then(res => setGstr3bData(res.data)).catch(() => {})
    ]);
  };

  const fetchPnl = () =>
    axios.get("http://localhost:5000/api/reports/pnl", { headers: headers() })
      .then(res => setPnlData(res.data)).catch(() => {});

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSales(),
      fetchStock(),
      fetchExpiry(),
      fetchOutstanding(),
      fetchSalesmanSales(),
      fetchItemSales(),
      fetchGstData(),
      fetchPnl()
    ]).finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: "sales", label: "📈 Sales Report" },
    { key: "stock", label: "📦 Stock Report" },
    { key: "expiry", label: "⏰ Expiry Report" },
    { key: "outstanding", label: "⚖️ Outstanding" },
    { key: "salesman", label: "👨‍💼 Rep Sales" },
    { key: "items", label: "💊 Item Sales" },
    { key: "gst", label: "🏛️ GST Returns" },
    { key: "pnl", label: "💰 Profit & Loss" },
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
                          <span className={`font-bold ${item.stock_qty === 0 ? "text-red-600" : "text-yellow-600"}`}>
                            {item.stock_qty} {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-500">{item.location || "—"}</td>
                        <td className="px-6 py-3 text-right text-green-600 font-medium">₹{item.selling_price || item.mrp}</td>
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
                        <td className="px-6 py-3 font-bold text-red-600">{item.stock_qty} {item.unit}</td>
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
                          <td className="px-6 py-3 font-bold text-orange-600">{item.stock_qty} {item.unit}</td>
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

        {/* ── OUTSTANDING REPORT ── */}
        {tab === "outstanding" && outstanding && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Total Customer Receivables" value={`₹${outstanding.totalCustomerOutstanding?.toFixed(2)}`} icon="📥" color="bg-blue-600" />
              <StatCard label="Total Supplier Payables" value={`₹${outstanding.totalSupplierOutstanding?.toFixed(2)}`} icon="📤" color="bg-indigo-600" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Customer Outstanding */}
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <h2 className="font-semibold text-gray-700">Customer Outstanding Aging</h2>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Receivables</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left">Customer</th>
                        <th className="px-6 py-3 text-right">Balance</th>
                        <th className="px-6 py-3 text-center">Aging Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {outstanding.customers?.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3">
                            <span className="font-semibold text-gray-800">{c.name}</span>
                            {c.phone && <p className="text-[10px] text-gray-400">{c.phone}</p>}
                          </td>
                          <td className="px-6 py-3 text-right font-bold text-red-600">₹{c.balance?.toFixed(2)}</td>
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                              c.days > 90 ? "bg-red-100 text-red-700" :
                              c.days > 60 ? "bg-orange-100 text-orange-700" :
                              c.days > 30 ? "bg-yellow-100 text-yellow-700" :
                              "bg-green-100 text-green-700"
                            }`}>
                              {c.days} days
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!outstanding.customers?.length && (
                        <tr><td colSpan={3} className="text-center py-8 text-gray-400">No customer receivables</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Supplier Outstanding */}
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <h2 className="font-semibold text-gray-700">Supplier Outstanding Payables</h2>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Payables</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left">Supplier</th>
                        <th className="px-6 py-3 text-right">Balance</th>
                        <th className="px-6 py-3 text-center">Aging Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {outstanding.suppliers?.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3">
                            <span className="font-semibold text-gray-800">{s.name}</span>
                            {s.phone && <p className="text-[10px] text-gray-400">{s.phone}</p>}
                          </td>
                          <td className="px-6 py-3 text-right font-bold text-indigo-600">₹{s.outstanding?.toFixed(2)}</td>
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                              s.days > 90 ? "bg-red-100 text-red-700" :
                              s.days > 60 ? "bg-orange-100 text-orange-700" :
                              s.days > 30 ? "bg-yellow-100 text-yellow-700" :
                              "bg-green-100 text-green-700"
                            }`}>
                              {s.days} days
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!outstanding.suppliers?.length && (
                        <tr><td colSpan={3} className="text-center py-8 text-gray-400">No supplier payables</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SALESMAN SALES REPORT ── */}
        {tab === "salesman" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Salesman Table */}
              <div className="col-span-2 bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="font-semibold text-gray-700">Representative Sales Performance</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 text-left">Representative Name</th>
                      <th className="px-6 py-3 text-center">Total Invoices</th>
                      <th className="px-6 py-3 text-right">Total Business Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {salesmanSales.map((rep, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-semibold text-gray-800">{rep.salesmanName}</td>
                        <td className="px-6 py-3 text-center text-gray-600 font-medium">{rep.bills}</td>
                        <td className="px-6 py-3 text-right font-bold text-green-600">₹{rep.sales?.toFixed(2)}</td>
                      </tr>
                    ))}
                    {!salesmanSales.length && (
                      <tr><td colSpan={3} className="text-center py-8 text-gray-400">No salesman sales records found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="font-semibold text-gray-700 mb-4">Volume by Representative</h2>
                {salesmanSales.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={salesmanSales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="salesmanName" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={v => `₹${v.toFixed(2)}`} />
                      <Bar dataKey="sales" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Sales ₹" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-400">No sales chart available</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ITEM SALES REPORT ── */}
        {tab === "items" && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-700">Item-wise Revenue Breakdown</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">Item Name</th>
                  <th className="px-6 py-3 text-center">Billed Quantity</th>
                  <th className="px-6 py-3 text-center">Scheme Quantity</th>
                  <th className="px-6 py-3 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itemSales.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold text-gray-800">{item.name}</td>
                    <td className="px-6 py-3 text-center font-medium text-gray-600">{item.qty} units</td>
                    <td className="px-6 py-3 text-center text-blue-600 font-semibold">🎁 {item.schemeQty} free</td>
                    <td className="px-6 py-3 text-right font-bold text-green-600">₹{item.amount?.toFixed(2)}</td>
                  </tr>
                ))}
                {!itemSales.length && (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400">No item-wise sales records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── GST RETURNS TABS ── */}
        {tab === "gst" && (
          <div className="space-y-6">
            {/* Period selector */}
            <div className="bg-white rounded-2xl shadow p-4 flex gap-4 items-end">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Month</label>
                <select
                  value={gstPeriod.month}
                  onChange={e => setGstPeriod({ ...gstPeriod, month: parseInt(e.target.value) })}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  {Array.from({ length: 12 }, (_, idx) => (
                    <option key={idx+1} value={idx+1}>
                      {new Date(2000, idx).toLocaleString("default", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Year</label>
                <select
                  value={gstPeriod.year}
                  onChange={e => setGstPeriod({ ...gstPeriod, year: parseInt(e.target.value) })}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  {[2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={fetchGstData}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
              >
                Fetch Returns
              </button>
            </div>

            {/* GSTR-3B Summary Card */}
            {gstr3bData && (
              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-gray-800 text-lg flex items-center gap-1.5">
                    🏛️ GSTR-3B Consolidated Return Summary
                  </h2>
                  <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-bold uppercase">
                    Period: {gstr3bData.period}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="border border-green-100 bg-green-50/50 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">1. Outward Tax Liability (GSTR-1)</p>
                    <p className="text-2xl font-black text-green-700 mt-1">₹{gstr3bData.outward?.gst?.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Taxable Value: ₹{gstr3bData.outward?.taxable?.toFixed(2)}</p>
                  </div>
                  <div className="border border-blue-100 bg-blue-50/50 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">2. Eligible ITC (GSTR-2)</p>
                    <p className="text-2xl font-black text-blue-700 mt-1">₹{gstr3bData.inward?.gst?.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Taxable Inward: ₹{gstr3bData.inward?.taxable?.toFixed(2)}</p>
                  </div>
                  <div className="border border-orange-100 bg-orange-50/50 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">3. Net Cash Tax Payable</p>
                    <p className="text-2xl font-black text-orange-700 mt-1">₹{gstr3bData.netPayable?.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Net liability after ITC offset</p>
                  </div>
                </div>
              </div>
            )}

            {/* GSTR-1 & GSTR-2 detail grids */}
            <div className="grid grid-cols-2 gap-6">
              {/* GSTR-1 Table */}
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-700 text-sm">GSTR-1 (Sales / Outward Supplies)</h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold">
                    Total: ₹{gstr1Data?.totalGst?.toFixed(2)}
                  </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 text-gray-500 uppercase sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Bill No</th>
                        <th className="px-4 py-2 text-left">Customer</th>
                        <th className="px-4 py-2 text-right">Taxable</th>
                        <th className="px-4 py-2 text-right">GST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {gstr1Data?.b2c?.map((b, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-blue-600">{b.billNo}</td>
                          <td className="px-4 py-2 font-semibold text-gray-700">{b.customerName}</td>
                          <td className="px-4 py-2 text-right">₹{b.taxableValue?.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-purple-600 font-bold">₹{b.gstAmount?.toFixed(2)}</td>
                        </tr>
                      ))}
                      {!gstr1Data?.b2c?.length && (
                        <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">No GSTR-1 records</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GSTR-2 Table */}
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-700 text-sm">GSTR-2 (Purchases / Inward ITC)</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                    ITC: ₹{gstr2Data?.totalGst?.toFixed(2)}
                  </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 text-gray-500 uppercase sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Ref No</th>
                        <th className="px-4 py-2 text-left">Supplier</th>
                        <th className="px-4 py-2 text-right">Taxable</th>
                        <th className="px-4 py-2 text-right">GST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {gstr2Data?.list?.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-indigo-600">{p.poNumber}</td>
                          <td className="px-4 py-2 font-semibold text-gray-700">{p.supplierName}</td>
                          <td className="px-4 py-2 text-right">₹{p.taxableValue?.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-indigo-600 font-bold">₹{p.gstAmount?.toFixed(2)}</td>
                        </tr>
                      ))}
                      {!gstr2Data?.list?.length && (
                        <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">No GSTR-2 records</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PROFIT & LOSS REPORT ── */}
        {tab === "pnl" && pnlData && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="text-center mb-8 border-b border-gray-100 pb-6">
                <h2 className="text-2xl font-bold text-gray-800">Profit & Loss Statement</h2>
                <p className="text-gray-500 text-sm mt-1">Consolidated Financial Overview</p>
              </div>

              <div className="space-y-6">
                {/* Sales Section */}
                <div className="flex justify-between items-center px-4">
                  <span className="text-gray-600 font-semibold text-lg">Total Sales Revenue</span>
                  <span className="text-gray-800 font-bold text-xl">₹{pnlData.sales.toFixed(2)}</span>
                </div>

                {/* COGS Section */}
                <div className="flex justify-between items-center px-4">
                  <span className="text-gray-600 font-semibold text-lg">Cost of Goods Sold (COGS)</span>
                  <span className="text-rose-600 font-bold text-xl">- ₹{pnlData.cogs.toFixed(2)}</span>
                </div>

                {/* Gross Profit */}
                <div className="bg-blue-50/50 rounded-xl p-4 flex justify-between items-center border border-blue-100">
                  <span className="text-blue-800 font-bold text-xl">Gross Profit</span>
                  <span className="text-blue-700 font-extrabold text-2xl">₹{pnlData.grossProfit.toFixed(2)}</span>
                </div>

                {/* Expenses Section */}
                <div className="flex justify-between items-center px-4 pt-4 border-t border-gray-100">
                  <span className="text-gray-600 font-semibold text-lg">Total Operating Expenses</span>
                  <span className="text-rose-600 font-bold text-xl">- ₹{pnlData.expenses.toFixed(2)}</span>
                </div>

                {/* Net Profit */}
                <div className={`rounded-xl p-6 flex justify-between items-center border shadow-sm ${pnlData.netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <span className={`font-bold text-2xl ${pnlData.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>Net Profit / (Loss)</span>
                  <span className={`font-extrabold text-4xl ${pnlData.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ₹{pnlData.netProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}