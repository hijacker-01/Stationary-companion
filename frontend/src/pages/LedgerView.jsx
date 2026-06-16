import { useState, useEffect, useRef } from "react";
import apiClient from "../utils/apiClient";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useVirtualizer } from "@tanstack/react-virtual";

export default function LedgerView() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const parentRef = useRef(null);

  useEffect(() => {
    fetchLedgers();
  }, []);

  const fetchLedgers = async () => {
    try {
      const res = await apiClient.get("/ledger/trial-balance");
      setAccounts(res.data?.rows || res.data?.items || res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const seedLedgers = async () => {
    try {
      await apiClient.post("/ledger/seed");
      fetchLedgers();
    } catch (err) {

    }
  };

  const rowVirtualizer = useVirtualizer({
    count: accounts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // estimated height of each row in px
    overscan: 5,
  });

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 pt-6 flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Chart of Accounts</h1>
                <p className="mt-1 text-sm text-slate-500">Trial balance across all ledger accounts</p>
              </div>
              <button onClick={seedLedgers} className="px-4 py-2 bg-[#1b4985] text-white rounded-lg hover:bg-[#163a6b] text-sm font-semibold shadow-sm">
                Seed Default Accounts
              </button>
            </div>
          </div>

          <div className="flex-1 px-8 pb-8 overflow-hidden">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
              <div className="px-4 py-3 bg-[#1b4985] text-white grid grid-cols-5 font-semibold text-sm rounded-t-xl">
                <div>Code</div>
                <div>Name</div>
                <div>Group</div>
                <div className="text-right">Debit</div>
                <div className="text-right">Credit</div>
              </div>
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24">
                  <span className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-[#1b4985]/20 border-t-[#1b4985]" />
                  <p className="text-sm text-slate-500">Loading…</p>
                </div>
              ) : (
                <div ref={parentRef} className="flex-1 overflow-auto relative">
                  <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                    {rowVirtualizer.getVirtualItems().map(virtualRow => {
                      const acc = accounts[virtualRow.index];
                      const totalDebit = (acc.JournalLines || []).reduce((sum, l) => sum + parseFloat(l.debit), 0);
                      const totalCredit = (acc.JournalLines || []).reduce((sum, l) => sum + parseFloat(l.credit), 0);
                      return (
                        <div
                          key={acc.id}
                          className="absolute top-0 left-0 w-full grid grid-cols-5 hover:bg-blue-50 items-center border-b border-slate-100 px-4 text-sm"
                          style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                        >
                          <div className="font-semibold text-[#1b4985]">{acc.code}</div>
                          <div className="text-slate-800">{acc.name}</div>
                          <div className="text-slate-500">{acc.group}</div>
                          <div className="text-right font-semibold text-emerald-600">₹{totalDebit.toFixed(2)}</div>
                          <div className="text-right font-semibold text-rose-600">₹{totalCredit.toFixed(2)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
