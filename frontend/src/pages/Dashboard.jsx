import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { 
  TrendingUp, AlertTriangle, AlertCircle, Award, Zap, 
  ChevronRight, Users, ClipboardList, IndianRupee, 
  ArrowUpRight, ArrowDownLeft, ShieldAlert, Search
} from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });
const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

// Centralized navigation dictionary for pages, actions, and features
const SEARCHABLE_FEATURES = [
  { name: "Create New Invoice", href: "/billing", category: "Actions", keywords: ["billing", "invoice", "sale", "new bill", "sell", "gst"] },
  { name: "Log Purchase Billing", href: "/purchase-bills", category: "Actions", keywords: ["purchase", "vendor", "buy", "stock in", "bill entry"] },
  { name: "Log Sales Return", href: "/sales-return", category: "Actions", keywords: ["return", "refund", "credit note", "sales return"] },
  { name: "Update Inventory Stock", href: "/inventory", category: "Management", keywords: ["inventory", "stock", "items", "medicines", "drugs", "products", "quantity"] },
  { name: "Outstanding Ledger", href: "/customers", category: "Management", keywords: ["customers", "ledger", "outstanding", "dues", "balance", "credit", "money"] },
  { name: "Inspect Expiring Items", href: "/expiry", category: "Management", keywords: ["expiry", "expiring", "drugs", "medicines", "date", "box check"] },
  { name: "Generate Tax Reports", href: "/reports", category: "Analytics", keywords: ["reports", "tax", "gst", "analytics", "financials", "sales summary"] },
  { name: "Main Dashboard Overview", href: "/dashboard", category: "Navigation", keywords: ["home", "dashboard", "overview", "analytics", "main"] },
  // ── AI Pages ──
  { name: "AI Smart Ledger", href: "/ai-ledger", category: "AI Tools", keywords: ["ai", "scan", "photo", "invoice", "ocr", "smart", "ledger", "camera", "upload", "langchain"] },
  { name: "AI Reorder Center", href: "/reorder-center", category: "AI Tools", keywords: ["reorder", "ai", "purchase order", "low stock", "auto", "predict", "agent", "langchain"] },
  { name: "AI Expiry Guard", href: "/expiry-guard", category: "AI Tools", keywords: ["expiry", "ai", "guard", "protect", "discount", "risk", "fefo", "expire", "agent"] },
];

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Search Bar States
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchContainerRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    axios.get("http://localhost:5000/api/dashboard", { headers: headers() })
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Closes the auto-suggest window if you click completely outside the search layout
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) return (
    <div className="flex min-h-screen bg-slate-50"><Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-slate-400 text-center">
          <div className="mb-4 animate-spin text-teal-600">
            <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="font-medium text-slate-600">Loading dashboard...</p>
        </div>
      </main>
    </div>
  );

  const d = data || {};

  // Auto-suggest logic filtering names & tag keywords
  const filteredSuggestions = SEARCHABLE_FEATURES.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return false;
    return (
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">

        {/* Header Container with Integrated Autosuggest Search */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{greeting}, {user.name || "User"}</h1>
            <p className="text-slate-500 text-sm mt-1">Here is a quick overview of your business performance today.</p>
          </div>

          {/* Dynamic Omnibox Search Bar */}
          <div ref={searchContainerRef} className="relative w-full md:w-80 lg:w-96 z-50">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Search actions, reports, or pages (e.g., 'gst')..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-150 shadow-sm"
              />
            </div>

            {/* Suggestions Menu */}
            {isOpen && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-50 animate-in fade-in duration-100">
                {filteredSuggestions.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors duration-150"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Route: {item.href}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                  </a>
                ))}
              </div>
            )}

            {/* Suggestions Empty State */}
            {isOpen && searchQuery.trim() !== "" && filteredSuggestions.length === 0 && (
              <div className="absolute left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-center">
                <p className="text-sm text-slate-400 font-medium">No system features matched your search.</p>
              </div>
            )}
          </div>

          <div className="text-right text-xs text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm font-medium self-start md:self-center">
            📅 {new Date().toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Today's Sales", value: `₹${(d.todaySales||0).toLocaleString("en-IN")}`, icon: ArrowUpRight, sub: `${d.todayBillCount||0} invoices`, borderColor: "border-emerald-500", iconColor: "text-emerald-600 bg-emerald-50" },
            { label: "Total Revenue", value: `₹${(d.totalRevenue||0).toLocaleString("en-IN")}`, icon: TrendingUp, sub: "All time records", borderColor: "border-teal-500", iconColor: "text-teal-600 bg-teal-50" },
            { label: "Outstanding Dues", value: `₹${(d.totalOutstanding||0).toLocaleString("en-IN")}`, icon: AlertCircle, sub: `${d.unpaidBillCount||0} unpaid bills`, borderColor: "border-rose-500", iconColor: "text-rose-600 bg-rose-50" },
            { label: "Today's Cash", value: `₹${(d.todayCash||0).toLocaleString("en-IN")}`, icon: IndianRupee, sub: `Credit: ₹${(d.todayCredit||0).toLocaleString("en-IN")}`, borderColor: "border-violet-500", iconColor: "text-violet-600 bg-violet-50" },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className={`bg-white border-l-4 ${c.borderColor} border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-150 flex items-start justify-between`}>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{c.label}</p>
                  <p className="text-2xl font-bold text-slate-900 leading-tight">{c.value}</p>
                  <p className="text-xs text-slate-400 font-medium">{c.sub}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${c.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Alert Row */}
        {(d.lowStockCount > 0 || d.nearExpiryCount > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {d.lowStockCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-900 text-sm">{d.lowStockCount} Low Stock Items</p>
                  <p className="text-xs text-amber-700 mt-0.5">Some items are running below reorder limit.</p>
                </div>
                <a href="/inventory" className="text-xs font-bold text-amber-900 hover:underline bg-white border border-amber-200 px-3 py-1.5 rounded-lg shadow-sm shrink-0">
                  Manage Stock
                </a>
              </div>
            )}
            {d.nearExpiryCount > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-4">
                <div className="p-2 bg-rose-100 text-rose-800 rounded-lg">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-rose-900 text-sm">{d.nearExpiryCount} Near-Expiry Items</p>
                  <p className="text-xs text-rose-700 mt-0.5">Products expiring within the next 60 days.</p>
                </div>
                <a href="/expiry" className="text-xs font-bold text-rose-900 hover:underline bg-white border border-rose-200 px-3 py-1.5 rounded-lg shadow-sm shrink-0">
                  Inspect Box
                </a>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly Sales Chart */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <h2 className="font-bold text-slate-800 text-base">Monthly Sales Trend</h2>
            </div>
            {(d.monthlySales || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={d.monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Sales"]} 
                  />
                  <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm font-medium">No sales transactions found</div>
            )}
          </div>

          {/* Top Items Pie */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-teal-600" />
              <h2 className="font-bold text-slate-800 text-base">Top Items by Revenue</h2>
            </div>
            {(d.topItems || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={d.topItems} dataKey="sales" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name }) => name.slice(0, 8)}>
                    {(d.topItems || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => `₹${v.toLocaleString("en-IN")}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm font-medium">No revenue statistics</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Top Items Bar */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <ClipboardList className="w-5 h-5 text-teal-600" />
              <h2 className="font-bold text-slate-800 text-base">Product Sales Breakdown</h2>
            </div>
            {(d.topItems || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.topItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={90} />
                  <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Sales"]} />
                  <Bar dataKey="sales" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm font-medium">Sales records will appear here</div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-teal-600" />
              <h2 className="font-bold text-slate-800 text-base">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "Create New Invoice", href: "/billing", color: "text-teal-700 bg-teal-50 hover:bg-teal-100 border-teal-100" },
                { label: "Log Purchase Billing", href: "/purchase-bills", color: "text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-100" },
                { label: "Log Sales Return", href: "/sales-return", color: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-100" },
                { label: "Update Inventory Stock", href: "/inventory", color: "text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-100" },
                { label: "Outstanding Ledger", href: "/customers", color: "text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-100" },
                { label: "Inspect Expiring Drugs", href: "/expiry", color: "text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-100" },
                { label: "Generate Tax Reports", href: "/reports", color: "text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200" },
              ].map(a => (
                <a key={a.label} href={a.href}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 border ${a.color}`}>
                  <span>{a.label}</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              ))}

              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 px-1">AI Tools</p>
                {[
                  { label: "AI Smart Ledger", href: "/ai-ledger", color: "text-violet-700 bg-violet-50 hover:bg-violet-100 border-violet-100", icon: "📷" },
                  { label: "AI Reorder Center", href: "/reorder-center", color: "text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-100", icon: "🔄" },
                  { label: "AI Expiry Guard", href: "/expiry-guard", color: "text-red-700 bg-red-50 hover:bg-red-100 border-red-100", icon: "🛡️" },
                ].map(a => (
                  <a key={a.label} href={a.href}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 border mb-1.5 ${a.color}`}>
                    <span>{a.icon} {a.label}</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Outstanding Customers */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-teal-600" />
              <h2 className="font-bold text-slate-800 text-base">Top Outstanding Dues</h2>
            </div>
            {(d.outstanding || []).length > 0 ? (
              <div className="divide-y divide-slate-100">
                {(d.outstanding || []).map(c => (
                  <div key={c.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.phone || "No phone logged"}</p>
                    </div>
                    <span className="font-bold text-rose-600 text-sm">₹{parseFloat(c.balance).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-8 font-medium">All customer balances are clear</p>
            )}
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-teal-600" />
              <h2 className="font-bold text-slate-800 text-base">Low Stock Inventory</h2>
            </div>
            {(d.lowStock || []).length > 0 ? (
              <div className="divide-y divide-slate-100">
                {(d.lowStock || []).map(item => (
                  <div key={item.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Batch: {item.batch || "—"}</p>
                    </div>
                    <span className={`font-semibold text-xs px-2.5 py-1 rounded-full border ${
                      item.stock_qty === 0 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {item.stock_qty === 0 ? "Out of Stock" : `${item.stock_qty} left`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-8 font-medium">All items adequately stocked</p>
            )}
          </div>
        </div>

        {/* ── AI Tools Section ─────────────────────────────────── */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 bg-gradient-to-b from-violet-500 to-indigo-600 rounded-full" />
            <h2 className="font-extrabold text-slate-800 text-lg">AI-Powered Tools</h2>
            <span className="text-[10px] uppercase tracking-widest font-bold bg-violet-100 text-violet-600 px-2.5 py-1 rounded-full border border-violet-200">Beta</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* AI Smart Ledger */}
            <a href="/ai-ledger" className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-violet-300 transition-all duration-200 block">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-md">📷</div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-600 border border-violet-200 px-2 py-0.5 rounded-full">AI Tools</span>
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1.5 group-hover:text-violet-700 transition-colors">AI Smart Ledger</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">Snap a photo of any purchase invoice. AI reads, extracts, and saves it directly to your ERP — no manual typing.</p>
              <div className="flex flex-wrap gap-1.5">
                {["OCR", "LLM", "RAG", "Auto-Entry"].map(t => (
                  <span key={t} className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">{t}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center text-violet-600 text-sm font-bold group-hover:gap-2 gap-1 transition-all">
                Open <ChevronRight className="w-4 h-4" />
              </div>
            </a>

            {/* AI Reorder Center */}
            <a href="/reorder-center" className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-orange-300 transition-all duration-200 block">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-2xl shadow-md">🔄</div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">AI Tools</span>
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1.5 group-hover:text-orange-700 transition-colors">AI Reorder Center</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">AI agent monitors stock levels, learns from 90-day purchase velocity, and auto-drafts purchase orders before you run out.</p>
              <div className="flex flex-wrap gap-1.5">
                {["LangChain", "ReAct Agent", "Auto-PO", "Predictive"].map(t => (
                  <span key={t} className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">{t}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center text-orange-600 text-sm font-bold group-hover:gap-2 gap-1 transition-all">
                Open <ChevronRight className="w-4 h-4" />
              </div>
            </a>

            {/* AI Expiry Guard */}
            <a href="/expiry-guard" className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-red-300 transition-all duration-200 block">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-2xl shadow-md">🛡️</div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">AI Tools</span>
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1.5 group-hover:text-red-700 transition-colors">AI Expiry Guard</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">Tracks every item's expiry. AI scores risk levels and suggests smart actions — discount, return to supplier, or FIFO reallocation.</p>
              <div className="flex flex-wrap gap-1.5">
                {["Risk Score", "FIFO", "LLM Actions", "Alerts"].map(t => (
                  <span key={t} className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">{t}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center text-red-600 text-sm font-bold group-hover:gap-2 gap-1 transition-all">
                Open <ChevronRight className="w-4 h-4" />
              </div>
            </a>

          </div>
        </div>

      </main>
    </div>
  );
}