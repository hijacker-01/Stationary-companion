import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import Sidebar from "../components/Sidebar";
import { Users, Search, AlertTriangle, Receipt, MessageCircle } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const fmt = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const shortDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function DebtorsBoard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/debtors", { headers: headers() })
      .then((res) => setData(res.data))
      .catch(() => setData({ totalReceivable: 0, totalOverdue: 0, debtors: [] }))
      .finally(() => setLoading(false));
  }, []);

  const debtors = (data?.debtors || []).filter(
    (d) => d.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-[#e5e5e5] overflow-hidden font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#f4f4f4] p-3 flex flex-col gap-2">
          {/* Top Bar */}
          <div className="bg-white border border-gray-300 rounded shadow-sm px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-bold text-gray-800">Debtors Board — Receivables Aging</span>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search customer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                tabIndex={1}
                className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-blue-500 w-56"
              />
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-orange-50 border border-orange-200 rounded p-2 shadow-sm">
              <p className="text-[10px] font-bold text-orange-600 uppercase">Total Receivable</p>
              <p className="text-sm font-extrabold text-orange-800">₹{fmt(data?.totalReceivable)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-2 shadow-sm">
              <p className="text-[10px] font-bold text-red-600 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Total Overdue
              </p>
              <p className="text-sm font-extrabold text-red-800">₹{fmt(data?.totalOverdue)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-2 shadow-sm">
              <p className="text-[10px] font-bold text-blue-600 uppercase">Number of Debtors</p>
              <p className="text-sm font-extrabold text-blue-800">{debtors.length}</p>
            </div>
          </div>

          {/* Debtors Table */}
          <div className="bg-white border border-gray-300 rounded shadow-sm flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-xs">Loading debtors...</div>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead className="bg-[#e8e8e8] sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700">Customer Name</th>
                    <th className="text-left px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700 w-24">Phone</th>
                    <th className="text-right px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700 w-28">Outstanding ₹</th>
                    <th className="text-right px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700 w-20">0-30 Days</th>
                    <th className="text-right px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700 w-20">31-60 Days</th>
                    <th className="text-right px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700 w-20">61-90 Days</th>
                    <th className="text-right px-2 py-1.5 border-b border-gray-300 font-bold text-red-700 w-20">90+ Days</th>
                    <th className="text-left px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700 w-24">Last Payment</th>
                    <th className="text-center px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {debtors.map((d, idx) => {
                    const aging = d.aging || {};
                    const over90 = Number(aging["90+"] || 0);
                    return (
                      <tr key={d.id || idx} className={`border-b border-gray-100 hover:bg-yellow-50 ${idx % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                        <td className="px-2 py-1.5 font-semibold text-gray-800">{d.name}</td>
                        <td className="px-2 py-1.5 text-gray-500 font-mono">{d.phone || "—"}</td>
                        <td className="px-2 py-1.5 text-right font-bold text-gray-900">{fmt(d.totalOutstanding)}</td>
                        <td className="px-2 py-1.5 text-right text-gray-600">{fmt(aging["0-30"])}</td>
                        <td className="px-2 py-1.5 text-right text-gray-600">{fmt(aging["31-60"])}</td>
                        <td className="px-2 py-1.5 text-right text-orange-600 font-medium">{fmt(aging["61-90"])}</td>
                        <td className={`px-2 py-1.5 text-right ${over90 > 0 ? "text-red-700 font-extrabold" : "text-gray-600"}`}>
                          {fmt(over90)}
                        </td>
                        <td className="px-2 py-1.5 text-gray-500">{shortDate(d.lastPaymentDate)}</td>
                        <td className="px-2 py-1.5 text-center flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate("/receipt-voucher")}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer inline-flex items-center gap-0.5"
                          >
                            <Receipt className="w-3 h-3" /> Receipt
                          </button>
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(`Hello ${d.name}, your payment of ${fmt(d.totalOutstanding)} is due.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer inline-flex items-center gap-0.5"
                          >
                            <MessageCircle className="w-3 h-3" /> WhatsApp
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                  {debtors.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-400 font-medium">
                        No debtors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer totals bar */}
          {debtors.length > 0 && (
            <div className="bg-white border border-gray-300 rounded shadow-sm px-3 py-1.5 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Showing {debtors.length} debtor(s)</span>
              <span className="font-bold text-gray-800">Total Outstanding: ₹{fmt(data?.totalReceivable)}</span>
            </div>
          )}
        </main>
      </div>
      <BusinessFooter />
    </div>
  );
}
