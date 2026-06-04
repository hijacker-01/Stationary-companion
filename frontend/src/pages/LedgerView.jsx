import { useState, useEffect, useRef } from "react";
import apiClient from "../utils/apiClient";
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
      setAccounts(res.data);
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
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-8 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Chart of Accounts</h1>
            <button onClick={seedLedgers} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              Seed Default Accounts
            </button>
          </div>
        </div>
          
        <div className="flex-1 px-8 pb-8 overflow-hidden">
          <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 h-full flex flex-col">
            <div className="p-4 border-b border-slate-700 bg-slate-800/80 rounded-t-xl grid grid-cols-5 text-slate-400 font-bold">
              <div>Code</div>
              <div>Name</div>
              <div>Group</div>
              <div className="text-right">Debit</div>
              <div className="text-right">Credit</div>
            </div>
            {loading ? (
              <div className="p-6">Loading...</div>
            ) : (
              <div ref={parentRef} className="flex-1 overflow-auto p-4 relative">
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                  {rowVirtualizer.getVirtualItems().map(virtualRow => {
                    const acc = accounts[virtualRow.index];
                    const totalDebit = (acc.JournalLines || []).reduce((sum, l) => sum + parseFloat(l.debit), 0);
                    const totalCredit = (acc.JournalLines || []).reduce((sum, l) => sum + parseFloat(l.credit), 0);
                    return (
                      <div 
                        key={acc.id} 
                        className="absolute top-0 left-0 w-full grid grid-cols-5 hover:bg-slate-750/50 items-center border-b border-slate-700/50"
                        style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                      >
                        <div className="font-medium text-teal-400">{acc.code}</div>
                        <div>{acc.name}</div>
                        <div className="text-slate-400">{acc.group}</div>
                        <div className="text-right text-emerald-400">₹{totalDebit.toFixed(2)}</div>
                        <div className="text-right text-rose-400">₹{totalCredit.toFixed(2)}</div>
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
  );
}
