import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, Package, AlertTriangle, AlertCircle, Users, 
  BarChart3, Receipt, Landmark, DollarSign, Wallet, 
  Percent, Calendar, Filter, X, ArrowDownLeft, ArrowUpRight, 
  CheckCircle2, Activity, Gift
} from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const StatCard = ({ label, value, icon: Icon, sub, colorClass, iconColorClass }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-black text-slate-800 mt-1.5">{value}</h3>
      {sub && <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon className={`w-6 h-6 ${iconColorClass}`} />
    </div>
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
    { key: "sales", label: "Sales Analytics", icon: TrendingUp },
    { key: "stock", label: "Stock Valuation", icon: Package },
    { key: "expiry", label: "Expiry Watchlist", icon: AlertTriangle },
    { key: "outstanding", label: "Ledger Balances", icon: Landmark },
    { key: "salesman", label: "Sales Reps", icon: Users },
    { key: "items", label: "Item-wise Sales", icon: BarChart3 },
    { key: "gst", label: "GST Returns", icon: Receipt },
    { key: "pnl", label: "Profit & Loss", icon: Wallet },
  ];

  if (loading) return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-slate-400 font-bold text-lg animate-pulse">Analyzing accounts and generating reports...</div>
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time business insights across revenue, stock status, tax filings, and margins.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-4">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer ${
                  tab === t.key
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── SALES REPORT ── */}
        {tab === "sales" && sales && (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* Date Filter */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-4 items-end shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 w-full">
                <Filter className="w-4 h-4 text-slate-400" />
                Filter Invoices By Date Range
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">From Date</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="form-input py-1.5" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">To Date</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="form-input py-1.5" />
              </div>
              <button onClick={fetchSales}
                className="bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-teal-700 cursor-pointer transition">
                Apply Filter
              </button>
              <button onClick={() => { setDateFrom(""); setDateTo(""); setTimeout(fetchSales, 100); }}
                className="text-sm font-bold text-slate-400 hover:text-slate-600 cursor-pointer py-2.5 transition">
                Reset
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Revenue" value={`₹${sales.totalSales?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} icon={TrendingUp} colorClass="bg-emerald-50" iconColorClass="text-emerald-600" />
              <StatCard label="Total Invoices" value={sales.totalBills} icon={Receipt} colorClass="bg-teal-50" iconColorClass="text-teal-600" />
              <StatCard label="Total GST collected" value={`₹${sales.totalGst?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} icon={Landmark} colorClass="bg-purple-50" iconColorClass="text-purple-600" />
              <StatCard label="Trade Discount" value={`₹${sales.totalDiscount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} icon={Percent} colorClass="bg-rose-50" iconColorClass="text-rose-600" />
            </div>

            {/* Sales Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-slate-800 text-lg mb-4">Daily Revenue & Tax Trends</h2>
              {sales.chart?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sales.chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip formatter={(v) => `₹${v.toFixed(2)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} name="Revenue ₹" />
                    <Line type="monotone" dataKey="gst" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4 }} name="GST Collected ₹" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-slate-400 font-semibold">No transactions recorded for the selected period.</div>
              )}
            </div>

            {/* Bills Table */}
            <div className="data-table-container">
              <div className="px-6 py-4 border-b border-slate-200 bg-white">
                <h2 className="font-bold text-slate-800">Invoiced Billings</h2>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bill No</th>
                    <th>Customer Name</th>
                    <th>Date</th>
                    <th className="text-right">Subtotal</th>
                    <th className="text-right">GST</th>
                    <th className="text-right">Discount</th>
                    <th className="text-right">Total</th>
                    <th>Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.bills?.map(b => (
                    <tr key={b.id}>
                      <td className="font-mono text-teal-600 font-bold text-xs">{b.billNo}</td>
                      <td className="font-semibold text-slate-900">{b.customerName}</td>
                      <td className="text-slate-600 font-medium text-xs">
                        {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="text-right text-slate-600">₹{b.subtotal?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="text-right text-purple-600 font-semibold">₹{b.gstAmount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="text-right text-rose-600 font-semibold">₹{b.discount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="text-right font-extrabold text-emerald-700">₹{b.total?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="capitalize text-slate-600 font-semibold text-xs">{b.paymentMode}</td>
                    </tr>
                  ))}
                  {!sales.bills?.length && (
                    <tr><td colSpan={8} className="text-center py-10 text-slate-400 font-medium">No invoice details match filter range.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── STOCK REPORT ── */}
        {tab === "stock" && stock && (
          <div className="space-y-6 animate-in fade-in duration-200">

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Unique Products" value={stock.totalItems} icon={Package} colorClass="bg-teal-50" iconColorClass="text-teal-600" />
              <StatCard label="Total Stock Valuation" value={`₹${stock.totalValue?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} icon={TrendingUp} colorClass="bg-emerald-50" iconColorClass="text-emerald-600" />
              <StatCard label="Low Stock Products" value={stock.lowStock?.length} icon={AlertTriangle} colorClass="bg-amber-50" iconColorClass="text-amber-600" sub="Stock Quantity <= 10" />
              <StatCard label="Out of Stock Products" value={stock.outOfStock?.length} icon={AlertCircle} colorClass="bg-rose-50" iconColorClass="text-rose-600" sub="Need urgent replenishment" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="font-bold text-slate-800 text-base mb-4">Stock Count by Category</h2>
                {stock.byCategory?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stock.byCategory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Products count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-10 text-slate-400 font-semibold">No stock category distribution.</div>
                )}
              </div>

              {/* Pie Chart */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="font-bold text-slate-800 text-base mb-4">Valuation Distribution by Category</h2>
                {stock.byCategory?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={stock.byCategory} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`}>
                        {stock.byCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => `₹${v.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-10 text-slate-400 font-semibold">No category valuation available.</div>
                )}
              </div>
            </div>

            {/* Low Stock Table */}
            {stock.lowStock?.length > 0 && (
              <div className="data-table-container">
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h2 className="font-bold text-slate-800">Critical Replenishment Watchlist</h2>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Batch Code</th>
                      <th>Current Qty</th>
                      <th>Location / Rack</th>
                      <th className="text-right">Unit Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.lowStock.map(item => (
                      <tr key={item.id}>
                        <td className="font-semibold text-slate-900">{item.name}</td>
                        <td className="text-slate-600 font-semibold text-xs">{item.category || "—"}</td>
                        <td className="text-slate-500 font-mono text-xs">{item.batch || "—"}</td>
                        <td>
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                            item.stock_qty === 0 ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {item.stock_qty} {item.unit}
                          </span>
                        </td>
                        <td className="text-slate-500 font-medium text-xs">{item.location || "—"}</td>
                        <td className="text-right text-emerald-700 font-semibold">₹{parseFloat(item.selling_price || item.mrp || 0).toFixed(2)}</td>
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
          <div className="space-y-6 animate-in fade-in duration-200">

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Already Expired" value={expiry.expired} icon={X} colorClass="bg-rose-50" iconColorClass="text-rose-600" sub="Remove immediately from sale" />
              <StatCard label="Expiring in 7 Days" value={expiry.in7} icon={AlertTriangle} colorClass="bg-orange-50" iconColorClass="text-orange-600" />
              <StatCard label="Expiring in 30 Days" value={expiry.in30} icon={AlertCircle} colorClass="bg-amber-50" iconColorClass="text-amber-600" />
              <StatCard label="Expiring in 90 Days" value={expiry.in90} icon={Calendar} colorClass="bg-teal-50" iconColorClass="text-teal-600" />
            </div>

            {/* Expiry Bar Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-slate-800 text-base mb-4">Expiry Timeline Distribution</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: "Expired", count: expiry.expired },
                  { name: "≤ 7 Days", count: expiry.in7 },
                  { name: "≤ 30 Days", count: expiry.in30 },
                  { name: "≤ 90 Days", count: expiry.in90 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Products">
                    {[
                      { fill: "#ef4444" }, { fill: "#f97316" },
                      { fill: "#f59e0b" }, { fill: "#3b82f6" }
                    ].map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Expired Items Table */}
            {expiry.expiredItems?.length > 0 && (
              <div className="data-table-container border-red-200">
                <div className="px-6 py-4 border-b border-red-200 bg-red-50 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-600" />
                  <h2 className="font-bold text-red-700">Expired Inventory (Immediate Recall Required)</h2>
                </div>
                <table className="data-table">
                  <thead>
                    <tr className="bg-red-50/50">
                      <th>Product Name</th>
                      <th>Batch Code</th>
                      <th>Category</th>
                      <th>Qty Left</th>
                      <th>Expired On</th>
                      <th>Location / Rack</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiry.expiredItems.map(item => (
                      <tr key={item.id} className="hover:bg-red-50/20">
                        <td className="font-semibold text-slate-900">{item.name}</td>
                        <td className="font-mono text-xs text-slate-500">{item.batch || "—"}</td>
                        <td className="text-slate-600 font-semibold text-xs">{item.category || "—"}</td>
                        <td className="font-extrabold text-red-600">{item.stock_qty} {item.unit}</td>
                        <td className="text-red-600 font-bold text-xs">
                          {new Date(item.expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="text-slate-500 font-medium text-xs">{item.location || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Critical Items */}
            {expiry.criticalItems?.length > 0 && (
              <div className="data-table-container border-orange-200">
                <div className="px-6 py-4 border-b border-orange-200 bg-orange-50 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h2 className="font-bold text-orange-700">Critical Expiry Warning (Within 7 Days)</h2>
                </div>
                <table className="data-table">
                  <thead>
                    <tr className="bg-orange-50/50">
                      <th>Product Name</th>
                      <th>Batch Code</th>
                      <th>Qty</th>
                      <th>Expiry Date</th>
                      <th>Status Timeline</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiry.criticalItems.map(item => {
                      const days = Math.ceil((new Date(item.expiry) - new Date()) / 86400000);
                      return (
                        <tr key={item.id} className="hover:bg-orange-50/20">
                          <td className="font-semibold text-slate-900">{item.name}</td>
                          <td className="font-mono text-xs text-slate-500">{item.batch || "—"}</td>
                          <td className="font-extrabold text-orange-600">{item.stock_qty} {item.unit}</td>
                          <td className="text-slate-600 font-bold text-xs">
                            {new Date(item.expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td>
                            <span className="bg-orange-100 border border-orange-200 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold">
                              Expiring in {days} days
                            </span>
                          </td>
                          <td className="text-slate-500 font-medium text-xs">{item.location || "—"}</td>
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
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard label="Total Receivables (Customers)" value={`₹${outstanding.totalCustomerOutstanding?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} icon={ArrowDownLeft} colorClass="bg-teal-50" iconColorClass="text-teal-600" />
              <StatCard label="Total Payables (Suppliers)" value={`₹${outstanding.totalSupplierOutstanding?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} icon={ArrowUpRight} colorClass="bg-indigo-50" iconColorClass="text-indigo-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Outstanding */}
              <div className="data-table-container">
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center">
                  <h2 className="font-bold text-slate-800">Customer Balance Outstanding Aging</h2>
                  <span className="text-xs bg-teal-50 border border-teal-100 text-teal-700 px-2.5 py-0.5 rounded-full font-bold uppercase">Receivables</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer / Ledger Account</th>
                        <th className="text-right">Unpaid Balance</th>
                        <th className="text-center">Days Aging</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstanding.customers?.map(c => (
                        <tr key={c.id}>
                          <td>
                            <span className="font-semibold text-slate-900">{c.name}</span>
                            {c.phone && <p className="text-[10px] font-mono text-slate-400 mt-0.5">{c.phone}</p>}
                          </td>
                          <td className="text-right font-extrabold text-rose-600">₹{c.balance?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td className="text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              c.days > 90 ? "bg-red-50 text-red-700 border-red-200" :
                              c.days > 60 ? "bg-orange-50 text-orange-700 border-orange-200" :
                              c.days > 30 ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {c.days} days
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!outstanding.customers?.length && (
                        <tr><td colSpan={3} className="text-center py-8 text-slate-400 font-medium">No pending receivables from customer accounts.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Supplier Outstanding */}
              <div className="data-table-container">
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center">
                  <h2 className="font-bold text-slate-800">Supplier Outstanding Payables</h2>
                  <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold uppercase">Payables</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Supplier / Vendor Ledger</th>
                        <th className="text-right">Outstanding Payable</th>
                        <th className="text-center">Days Aging</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstanding.suppliers?.map(s => (
                        <tr key={s.id}>
                          <td>
                            <span className="font-semibold text-slate-900">{s.name}</span>
                            {s.phone && <p className="text-[10px] font-mono text-slate-400 mt-0.5">{s.phone}</p>}
                          </td>
                          <td className="text-right font-extrabold text-indigo-600">₹{s.outstanding?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td className="text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              s.days > 90 ? "bg-red-50 text-red-700 border-red-200" :
                              s.days > 60 ? "bg-orange-50 text-orange-700 border-orange-200" :
                              s.days > 30 ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {s.days} days
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!outstanding.suppliers?.length && (
                        <tr><td colSpan={3} className="text-center py-8 text-slate-400 font-medium">No pending payables to supplier accounts.</td></tr>
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
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Salesman Table */}
              <div className="lg:col-span-2 data-table-container">
                <div className="px-6 py-4 border-b border-slate-200 bg-white">
                  <h2 className="font-bold text-slate-800">Representative-wise Performance</h2>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sales Representative Name</th>
                      <th className="text-center">Total Invoices Created</th>
                      <th className="text-right">Total Business Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesmanSales.map((rep, idx) => (
                      <tr key={idx}>
                        <td className="font-bold text-slate-900">{rep.salesmanName}</td>
                        <td className="text-center text-slate-600 font-semibold">{rep.bills} bills</td>
                        <td className="text-right font-extrabold text-emerald-700">₹{rep.sales?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {!salesmanSales.length && (
                      <tr><td colSpan={3} className="text-center py-8 text-slate-400 font-medium">No performance records for representatives.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Chart */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="font-bold text-slate-800 text-base mb-4">Volume by Representative</h2>
                {salesmanSales.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={salesmanSales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="salesmanName" tick={{ fontSize: 10, fill: "#64748b" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                      <Tooltip formatter={v => `₹${v.toFixed(2)}`} />
                      <Bar dataKey="sales" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Sales ₹" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-400 font-semibold">No performance volume available.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ITEM SALES REPORT ── */}
        {tab === "items" && (
          <div className="data-table-container animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-white">
              <h2 className="font-bold text-slate-800">Product-wise Sales Revenue Analysis</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th className="text-center">Billed Quantity</th>
                  <th className="text-center">Trade Offer Quantity Given</th>
                  <th className="text-right">Total Net Revenue</th>
                </tr>
              </thead>
              <tbody>
                {itemSales.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold text-slate-900">{item.name}</td>
                    <td className="text-center font-bold text-slate-700">{item.qty} units</td>
                    <td className="text-center text-teal-600 font-bold">
                      <span className="inline-flex items-center gap-1 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded text-[10px]">
                        <Gift className="w-3 h-3 text-teal-500" />
                        {item.schemeQty} Free Units
                      </span>
                    </td>
                    <td className="text-right font-extrabold text-emerald-700">₹{item.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {!itemSales.length && (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-400 font-medium">No product-wise sales revenue found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── GST RETURNS TABS ── */}
        {tab === "gst" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Period selector */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-4 items-end shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 w-full">
                <Calendar className="w-4 h-4 text-slate-400" />
                Select Return Filing Period
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Month</label>
                <select
                  value={gstPeriod.month}
                  onChange={e => setGstPeriod({ ...gstPeriod, month: parseInt(e.target.value) })}
                  className="form-input py-1.5 bg-white w-40"
                >
                  {Array.from({ length: 12 }, (_, idx) => (
                    <option key={idx+1} value={idx+1}>
                      {new Date(2000, idx).toLocaleString("default", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Year</label>
                <select
                  value={gstPeriod.year}
                  onChange={e => setGstPeriod({ ...gstPeriod, year: parseInt(e.target.value) })}
                  className="form-input py-1.5 bg-white w-32"
                >
                  {[2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={fetchGstData}
                className="bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-teal-700 cursor-pointer transition shadow-sm"
              >
                Fetch Returns
              </button>
            </div>

            {/* GSTR-3B Summary Card */}
            {gstr3bData && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                    <Receipt className="w-5.5 h-5.5 text-teal-600" />
                    GSTR-3B Consolidated Return Summary
                  </h2>
                  <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    Filing Period: {gstr3bData.period}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                  <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-5">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">1. Outward Tax Liability (GSTR-1)</p>
                    <p className="text-3xl font-black text-emerald-800 mt-2">₹{gstr3bData.outward?.gst?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">Taxable Sales: ₹{gstr3bData.outward?.taxable?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="border border-teal-100 bg-teal-50/30 rounded-xl p-5">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">2. Eligible ITC (GSTR-2)</p>
                    <p className="text-3xl font-black text-teal-800 mt-2">₹{gstr3bData.inward?.gst?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">Taxable Purchases: ₹{gstr3bData.inward?.taxable?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="border border-rose-100 bg-rose-50/30 rounded-xl p-5">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">3. Net Cash Tax Payable</p>
                    <p className="text-3xl font-black text-rose-800 mt-2">₹{gstr3bData.netPayable?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">Net Liability (Offset from ITC)</p>
                  </div>
                </div>
              </div>
            )}

            {/* GSTR-1 & GSTR-2 detail grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GSTR-1 Table */}
              <div className="data-table-container">
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-sm">GSTR-1 Detail List (Sales / Outwards)</h3>
                  <span className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded font-bold">
                    Tax Liability: ₹{gstr1Data?.totalGst?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bill No</th>
                        <th>Customer / GSTIN</th>
                        <th className="text-right">Taxable Amount</th>
                        <th className="text-right">GST Liability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr1Data?.b2c?.map((b, idx) => (
                        <tr key={idx}>
                          <td className="font-mono text-teal-600 font-bold text-xs">{b.billNo}</td>
                          <td>
                            <span className="font-bold text-slate-900">{b.customerName}</span>
                          </td>
                          <td className="text-right text-slate-600">₹{b.taxableValue?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td className="text-right text-purple-600 font-extrabold">₹{b.gstAmount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                      {!gstr1Data?.b2c?.length && (
                        <tr><td colSpan={4} className="text-center py-8 text-slate-400 font-medium">No GSTR-1 outward records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GSTR-2 Table */}
              <div className="data-table-container">
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-sm">GSTR-2 Detail List (Purchases / Inward ITC)</h3>
                  <span className="text-xs bg-teal-50 border border-teal-100 text-teal-700 px-2.5 py-0.5 rounded font-bold">
                    ITC Claimed: ₹{gstr2Data?.totalGst?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ref Invoice</th>
                        <th>Supplier / Vendor</th>
                        <th className="text-right">Taxable Base</th>
                        <th className="text-right">ITC Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr2Data?.list?.map((p, idx) => (
                        <tr key={idx}>
                          <td className="font-mono text-indigo-600 font-bold text-xs">{p.poNumber}</td>
                          <td>
                            <span className="font-bold text-slate-900">{p.supplierName}</span>
                          </td>
                          <td className="text-right text-slate-600">₹{p.taxableValue?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td className="text-right text-indigo-600 font-extrabold">₹{p.gstAmount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                      {!gstr2Data?.list?.length && (
                        <tr><td colSpan={4} className="text-center py-8 text-slate-400 font-medium">No GSTR-2 inward records found.</td></tr>
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
          <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <div className="text-center mb-8 border-b border-slate-100 pb-6">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide">Profit & Loss Statement</h2>
                <p className="text-slate-400 text-sm mt-1 font-medium">Accrual Basis Accounting Summary</p>
              </div>

              <div className="space-y-6">
                {/* Sales Section */}
                <div className="flex justify-between items-center px-4">
                  <span className="text-slate-600 font-bold text-base flex items-center gap-2">
                    <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                    Gross Sales Revenue
                  </span>
                  <span className="text-slate-800 font-black text-xl">₹{pnlData.sales?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                {/* COGS Section */}
                <div className="flex justify-between items-center px-4">
                  <span className="text-slate-600 font-bold text-base flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-rose-500" />
                    Cost of Goods Sold (COGS)
                  </span>
                  <span className="text-rose-600 font-black text-xl">- ₹{pnlData.cogs?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Gross Profit */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 flex justify-between items-center shadow-inner">
                  <span className="text-slate-800 font-extrabold text-lg">Gross Margin Profit</span>
                  <span className="text-teal-700 font-black text-2xl">₹{pnlData.grossProfit?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Expenses Section */}
                <div className="flex justify-between items-center px-4 pt-4 border-t border-slate-100">
                  <span className="text-slate-600 font-bold text-base flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    Total Operating Expenses
                  </span>
                  <span className="text-rose-600 font-black text-xl">- ₹{pnlData.expenses?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Net Profit */}
                <div className={`rounded-xl p-6 flex justify-between items-center border shadow-sm ${pnlData.netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <span className={`font-black text-xl flex items-center gap-2 ${pnlData.netProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                    {pnlData.netProfit >= 0 ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <AlertCircle className="w-6 h-6 text-rose-600" />}
                    Net Profit / (Loss)
                  </span>
                  <span className={`font-black text-3xl ${pnlData.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    ₹{pnlData.netProfit?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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