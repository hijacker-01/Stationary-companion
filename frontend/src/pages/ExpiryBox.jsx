import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const token = () => localStorage.getItem("token");

const STATUS = {
  expired: { label: "Expired", color: "bg-red-100 text-red-700 border-red-200" },
  critical: { label: "Critical (≤7 days)", color: "bg-orange-100 text-orange-700 border-orange-200" },
  warning: { label: "Warning (≤30 days)", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  safe: { label: "Safe (≤90 days)", color: "bg-green-100 text-green-700 border-green-200" },
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
      .get(`http://localhost:5000/api/expiry?days=${days}`, {
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">⏰ Expiry Box</h1>
          <p className="text-gray-500 text-sm mt-1">Track all items nearing expiry date</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { key: "expired", label: "Expired", icon: "💀", bg: "bg-red-500" },
            { key: "critical", label: "Critical", icon: "🚨", bg: "bg-orange-500" },
            { key: "warning", label: "Warning", icon: "⚠️", bg: "bg-yellow-500" },
            { key: "safe", label: "Safe", icon: "✅", bg: "bg-green-500" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(filter === s.key ? "all" : s.key)}
              className={`${s.bg} text-white rounded-2xl p-5 text-left shadow transition hover:opacity-90 ${filter === s.key ? "ring-4 ring-offset-2 ring-gray-400" : ""}`}
            >
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-3xl font-bold">{counts[s.key]}</div>
              <div className="text-sm opacity-80">{s.label}</div>
            </button>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="🔍 Search item or batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value={7}>Next 7 Days</option>
            <option value={30}>Next 30 Days</option>
            <option value={90}>Next 90 Days</option>
            <option value={180}>Next 180 Days</option>
            <option value={365}>Next 1 Year</option>
          </select>
          <button
            onClick={() => { setFilter("all"); setSearch(""); }}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear Filters
          </button>
          <span className="text-sm text-gray-500 ml-auto">
            Showing <strong>{filtered.length}</strong> items
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading items...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🎉</div>
              <p className="font-medium">No items found for this filter</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-6 py-4 text-left">#</th>
                  <th className="px-6 py-4 text-left">Item Name</th>
                  <th className="px-6 py-4 text-left">Batch</th>
                  <th className="px-6 py-4 text-left">Category</th>
                  <th className="px-6 py-4 text-left">Qty</th>
                  <th className="px-6 py-4 text-left">Location</th>
                  <th className="px-6 py-4 text-left">Expiry Date</th>
                  <th className="px-6 py-4 text-left">Days Left</th>
                  <th className="px-6 py-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item, i) => {
                  const status = getStatus(item.expiry);
                  const s = STATUS[status];
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-400">{i + 1}</td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{item.name}</td>
                      <td className="px-6 py-4 text-gray-500">{item.batch || "—"}</td>
                      <td className="px-6 py-4 text-gray-500">{item.category || "—"}</td>
                      <td className="px-6 py-4 font-medium">
                        {item.stock_qty} <span className="text-gray-400 text-xs">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{item.location || "—"}</td>
                      <td className="px-6 py-4 text-gray-700">
                        {new Date(item.expiry).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs font-medium">
                        {getDaysLeft(item.expiry)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${s.color}`}>
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