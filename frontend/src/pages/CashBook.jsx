import { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import Sidebar from "../components/Sidebar";
import { BookOpen, Download, Loader2, Calendar } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const fmt = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const shortDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function CashBook() {
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCashBook = () => {
    setLoading(true);
    axios
      .get(`http://localhost:5000/api/cashbook?startDate=${startDate}&endDate=${endDate}`, { headers: headers() })
      .then((res) => setData(res.data))
      .catch(() => setData({ openingBalance: 0, closingBalance: 0, totalReceipts: 0, totalPayments: 0, entries: [] }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCashBook();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") fetchCashBook();
  };

  const entries = data?.entries || [];

  return (
    <div className="flex flex-col h-screen bg-[#e5e5e5] overflow-hidden font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#f4f4f4] p-3 flex flex-col gap-2">
          {/* Top Bar */}
          <div className="bg-white border border-gray-300 rounded shadow-sm px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-700" />
              <span className="text-sm font-bold text-gray-800">Cash Book</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs font-semibold text-gray-600">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onKeyDown={handleKeyDown}
                tabIndex={1}
                className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-blue-500"
              />
              <label className="text-xs font-semibold text-gray-600">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onKeyDown={handleKeyDown}
                tabIndex={2}
                className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={fetchCashBook}
                tabIndex={3}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1"
              >
                <Calendar className="w-3 h-3" /> Load
              </button>
              <button
                onClick={() => window.print()}
                tabIndex={4}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-semibold cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Print
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-blue-50 border border-blue-200 rounded p-2 shadow-sm">
              <p className="text-[10px] font-bold text-blue-600 uppercase">Opening Balance</p>
              <p className="text-sm font-extrabold text-blue-800">₹{fmt(data?.openingBalance)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-2 shadow-sm">
              <p className="text-[10px] font-bold text-green-600 uppercase">Total Receipts</p>
              <p className="text-sm font-extrabold text-green-800">₹{fmt(data?.totalReceipts)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-2 shadow-sm">
              <p className="text-[10px] font-bold text-red-600 uppercase">Total Payments</p>
              <p className="text-sm font-extrabold text-red-800">₹{fmt(data?.totalPayments)}</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded p-2 shadow-sm">
              <p className="text-[10px] font-bold text-indigo-600 uppercase">Closing Balance</p>
              <p className="text-sm font-extrabold text-indigo-800">₹{fmt(data?.closingBalance)}</p>
            </div>
          </div>

          {/* Cash Book Table */}
          <div className="bg-white border border-gray-300 rounded shadow-sm flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading cash book...
              </div>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead className="bg-[#e8e8e8] sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700 w-24">Date</th>
                    <th className="text-left px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700">Particulars</th>
                    <th className="text-left px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700 w-24">Voucher No</th>
                    <th className="text-left px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700 w-20">Mode</th>
                    <th className="text-right px-2 py-1.5 border-b border-gray-300 font-bold text-green-700 w-28">Receipt (Dr) ₹</th>
                    <th className="text-right px-2 py-1.5 border-b border-gray-300 font-bold text-red-700 w-28">Payment (Cr) ₹</th>
                    <th className="text-right px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700 w-28">Balance ₹</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening Balance Row */}
                  <tr className="bg-blue-50 border-b border-gray-200">
                    <td className="px-2 py-1.5 font-semibold text-gray-600">{shortDate(startDate)}</td>
                    <td className="px-2 py-1.5 font-bold text-blue-800" colSpan={3}>Opening Balance</td>
                    <td className="px-2 py-1.5 text-right"></td>
                    <td className="px-2 py-1.5 text-right"></td>
                    <td className="px-2 py-1.5 text-right font-bold text-blue-800">{fmt(data?.openingBalance)}</td>
                  </tr>

                  {entries.map((entry, idx) => (
                    <tr key={idx} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                      <td className="px-2 py-1.5 text-gray-600 font-mono">{shortDate(entry.date)}</td>
                      <td className="px-2 py-1.5 text-gray-800 font-medium">{entry.particulars}</td>
                      <td className="px-2 py-1.5 text-gray-500 font-mono">{entry.voucherNo || "—"}</td>
                      <td className="px-2 py-1.5 text-gray-500 capitalize">{entry.mode || "—"}</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-green-700">
                        {entry.receipt > 0 ? fmt(entry.receipt) : ""}
                      </td>
                      <td className="px-2 py-1.5 text-right font-semibold text-red-600">
                        {entry.payment > 0 ? fmt(entry.payment) : ""}
                      </td>
                      <td className="px-2 py-1.5 text-right font-bold text-gray-800">{fmt(entry.balance)}</td>
                    </tr>
                  ))}

                  {/* Closing Balance Row */}
                  <tr className="bg-indigo-50 border-t-2 border-indigo-300">
                    <td className="px-2 py-1.5 font-semibold text-gray-600">{shortDate(endDate)}</td>
                    <td className="px-2 py-1.5 font-extrabold text-indigo-900" colSpan={3}>Closing Balance</td>
                    <td className="px-2 py-1.5 text-right font-extrabold text-green-700">{fmt(data?.totalReceipts)}</td>
                    <td className="px-2 py-1.5 text-right font-extrabold text-red-600">{fmt(data?.totalPayments)}</td>
                    <td className="px-2 py-1.5 text-right font-extrabold text-indigo-900">{fmt(data?.closingBalance)}</td>
                  </tr>

                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400 font-medium">
                        No cash book entries found for the selected date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
      <BusinessFooter />
    </div>
  );
}
