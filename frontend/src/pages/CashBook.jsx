import { useEffect, useMemo, useState } from "react";
import axios from "../api/axios";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const fmt = (value) => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CashBook() {
  const [filters, setFilters] = useState({ dateFrom: monthStart, dateTo: today });
  const [ledger, setLedger] = useState({ openingBalance: 0, closingBalance: 0, totalReceipts: 0, totalPayments: 0, entries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLedger = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ startDate: filters.dateFrom, endDate: filters.dateTo });
      const response = await axios.get(`/cashbook?${params.toString()}`);
      setLedger({
        openingBalance: response.data?.openingBalance || 0,
        closingBalance: response.data?.closingBalance || 0,
        totalReceipts: response.data?.totalReceipts || 0,
        totalPayments: response.data?.totalPayments || 0,
        entries: Array.isArray(response.data?.entries) ? response.data.entries : [],
      });
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load the cash book.");
      setLedger({ openingBalance: 0, closingBalance: 0, totalReceipts: 0, totalPayments: 0, entries: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLedger(); }, [filters.dateFrom, filters.dateTo]);

  const netMovement = useMemo(() => ledger.totalReceipts - ledger.totalPayments, [ledger.totalReceipts, ledger.totalPayments]);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-xs text-gray-800">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between bg-[#1b4985] px-6 py-3 text-white shadow-md">
            <div>
              <h1 className="text-lg font-bold tracking-wide">CASH & BANK BOOK</h1>
              <p className="text-xs text-blue-100">Single running ledger from the current cashbook service</p>
            </div>
            <button onClick={loadLedger} disabled={loading} className="rounded bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25 disabled:opacity-60">
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-b border-gray-200 bg-white px-6 py-3">
            <label className="flex items-center gap-2 font-medium text-gray-500">From
              <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))} className="rounded border border-gray-300 px-2 py-1 text-xs" />
            </label>
            <label className="flex items-center gap-2 font-medium text-gray-500">To
              <input type="date" value={filters.dateTo} onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))} className="rounded border border-gray-300 px-2 py-1 text-xs" />
            </label>
            <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-gray-400">Per-account tracking is planned as a separate feature</span>
          </div>

          <div className="grid grid-cols-4 gap-3 border-b border-gray-200 bg-gray-100 p-4">
            <div className="rounded border border-gray-200 bg-white p-3"><div className="text-[10px] font-bold uppercase text-gray-500">Opening Balance</div><div className="mt-1 text-lg font-black text-gray-800">₹{fmt(ledger.openingBalance)}</div></div>
            <div className="rounded border border-gray-200 bg-white p-3"><div className="text-[10px] font-bold uppercase text-gray-500">Receipts</div><div className="mt-1 text-lg font-black text-emerald-700">₹{fmt(ledger.totalReceipts)}</div></div>
            <div className="rounded border border-gray-200 bg-white p-3"><div className="text-[10px] font-bold uppercase text-gray-500">Payments</div><div className="mt-1 text-lg font-black text-red-700">₹{fmt(ledger.totalPayments)}</div></div>
            <div className="rounded border border-gray-200 bg-white p-3"><div className="text-[10px] font-bold uppercase text-gray-500">Closing Balance</div><div className="mt-1 text-lg font-black text-[#1b4985]">₹{fmt(ledger.closingBalance)}</div><div className="text-[10px] text-gray-400">Net movement: ₹{fmt(netMovement)}</div></div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto bg-white">
            {error && <div className="m-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {!error && !loading && ledger.entries.length === 0 && <div className="p-8 text-center text-gray-500">No cashbook entries were found for the selected period.</div>}
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 border-b-2 border-gray-200 bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold uppercase text-gray-500">Date</th>
                  <th className="px-4 py-2 text-left font-semibold uppercase text-gray-500">Description</th>
                  <th className="px-4 py-2 text-left font-semibold uppercase text-gray-500">Reference</th>
                  <th className="px-4 py-2 text-right font-semibold uppercase text-gray-500">Receipt</th>
                  <th className="px-4 py-2 text-right font-semibold uppercase text-gray-500">Payment</th>
                  <th className="px-4 py-2 text-right font-semibold uppercase text-gray-500">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.entries.map((entry, index) => (
                  <tr key={`${entry.date}-${entry.reference || index}`} className="border-b border-gray-100 hover:bg-blue-50">
                    <td className="px-4 py-2 text-gray-600">{entry.date ? new Date(entry.date).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="px-4 py-2 font-medium text-gray-800">{entry.description || entry.type || "Cashbook entry"}</td>
                    <td className="px-4 py-2 text-gray-500">{entry.reference || "—"}</td>
                    <td className="px-4 py-2 text-right font-semibold text-emerald-700">{entry.receipt ? `₹${fmt(entry.receipt)}` : "—"}</td>
                    <td className="px-4 py-2 text-right font-semibold text-red-700">{entry.payment ? `₹${fmt(entry.payment)}` : "—"}</td>
                    <td className="px-4 py-2 text-right font-bold text-[#1b4985]">₹{fmt(entry.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

// Future scope: per-bank and per-wallet ledgers require a dedicated account
// schema and API rather than static account data embedded in the page.
void monthStart;
