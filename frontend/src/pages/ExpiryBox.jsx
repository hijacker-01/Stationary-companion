import { useEffect, useState } from "react";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import {
  XCircle, AlertOctagon, AlertTriangle, CheckCircle2, Search, Clock, Package
} from "lucide-react";

const token = () => localStorage.getItem("token");

const STATUS = {
  expired: { label: "Expired", color: "bg-red-50 text-red-700 border-red-200" },
  critical: { label: "Critical (≤7 days)", color: "bg-orange-50 text-orange-700 border-orange-200" },
  warning: { label: "Warning (≤30 days)", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  safe: { label: "Safe (≤90 days)", color: "bg-green-50 text-green-700 border-green-200" },
};

function getStatus(expiry) {
  const today = new Date();
  const exp = new Date(expiry);
  const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "expired";
  if (diff <= 7) return "critical";
  if (diff <= 30) return "warning";
  return "safe";
}

function getDaysLeft(expiry) {
  const diff = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Expired ${Math.abs(diff)} days ago`;
  if (diff === 0) return "Expires today!";
  return `${diff} days left`;
}

export default function ExpiryBox() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);

  const fetchExpiry = () => {
    setLoading(true);
    axios
      .get(`/expiry?days=${days}`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchExpiry(); }, [days]);

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.batch?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || getStatus(item.expiry) === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    expired: items.filter(i => getStatus(i.expiry) === "expired").length,
    critical: items.filter(i => getStatus(i.expiry) === "critical").length,
    warning: items.filter(i => getStatus(i.expiry) === "warning").length,
    safe: items.filter(i => getStatus(i.expiry) === "safe").length,
  };

  const summaryCards = [
    { key: "expired", label: "Expired", icon: XCircle, borderColor: "border-l-red-500", color: "bg-red-50 text-red-600" },
    { key: "critical", label: "Critical", icon: AlertOctagon, borderColor: "border-l-orange-500", color: "bg-orange-50 text-orange-600" },
    { key: "warning", label: "Warning", icon: AlertTriangle, borderColor: "border-l-amber-500", color: "bg-amber-50 text-amber-600" },
    { key: "safe", label: "Safe", icon: CheckCircle2, borderColor: "border-l-emerald-500", color: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Expiry Box</h1>
            <p className="text-sm text-slate-500 mt-1">Track all items nearing expiry date</p>
          </div>
          <div className="flex gap-4 text-xs font-medium text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div>Expired</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div>≤ 7 Days (Critical)</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div>≤ 30 Days (Warning)</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>&gt; 30 Days (Safe)</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                onClick={() => setFilter(filter === c.key ? "all" : c.key)}
                className={`bg-white border-l-4 ${c.borderColor} border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between text-left cursor-pointer transition-all duration-150 ${
                  filter === c.key ? "ring-2 ring-teal-400 ring-offset-1" : "hover:shadow-md"
                }`}
              >
                <div>
                  <p className="text-2xl font-bold text-slate-900">{counts[c.key]}</p>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-1">{c.label}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${c.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-3 flex-1 min-w-48">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search item or batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="form-input bg-white w-auto"
          >
            <option value={7}>Next 7 Days</option>
            <option value={30}>Next 30 Days</option>
            <option value={90}>Next 90 Days</option>
            <option value={180}>Next 180 Days</option>
            <option value={365}>Next 1 Year</option>
          </select>
          <button
            onClick={() => { setFilter("all"); setSearch(""); }}
            className="text-sm text-teal-600 hover:underline font-semibold cursor-pointer"
          >
            Clear Filters
          </button>
          <span className="text-sm text-slate-500 ml-auto">
            Showing <strong>{filtered.length}</strong> items
          </span>
        </div>

        {/* Table */}
        <div className="data-table-container">
          {loading ? (
            <div className="text-center py-16 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-3 text-slate-300 animate-spin" />
              Loading items...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No items found for this filter</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  <th>Batch</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Location</th>
                  <th>Expiry Date</th>
                  <th>Days Left</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const status = getStatus(item.expiry);
                  const s = STATUS[status];
                  return (
                    <tr key={item.id}>
                      <td className="text-slate-400">{i + 1}</td>
                      <td className="font-semibold text-slate-900">{item.name}</td>
                      <td className="text-slate-500">{item.batch || "—"}</td>
                      <td className="text-slate-500">{item.category || "—"}</td>
                      <td className="font-medium">
                        {item.stock_qty} <span className="text-slate-400 text-xs">{item.unit}</span>
                      </td>
                      <td className="text-slate-500">{item.location || "—"}</td>
                      <td className="text-slate-700">
                        {new Date(item.expiry).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                      </td>
                      <td className="text-slate-600 text-xs font-medium">
                        {getDaysLeft(item.expiry)}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${s.color}`}>
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}