import { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import Sidebar from "../components/Sidebar";

export default function LedgerView() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

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
      alert("Failed to seed ledgers");
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Chart of Accounts</h1>
            <button onClick={seedLedgers} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              Seed Default Accounts
            </button>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="pb-3">Code</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Group</th>
                    <th className="pb-3 text-right">Debit</th>
                    <th className="pb-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {accounts.map(acc => {
                    const totalDebit = (acc.JournalLines || []).reduce((sum, l) => sum + parseFloat(l.debit), 0);
                    const totalCredit = (acc.JournalLines || []).reduce((sum, l) => sum + parseFloat(l.credit), 0);
                    return (
                      <tr key={acc.id} className="hover:bg-slate-750/50">
                        <td className="py-3 font-medium text-teal-400">{acc.code}</td>
                        <td className="py-3">{acc.name}</td>
                        <td className="py-3 text-slate-400">{acc.group}</td>
                        <td className="py-3 text-right text-emerald-400">₹{totalDebit.toFixed(2)}</td>
                        <td className="py-3 text-right text-rose-400">₹{totalCredit.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
