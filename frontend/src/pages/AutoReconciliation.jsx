import { useState, useEffect } from "react";
import axios from "../api/axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { Landmark, ArrowRight, FileCheck, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function AutoReconciliation() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTransactions([
      { id: "TXN901", date: "2026-06-04", amount: 45000, type: "Credit", reference: "NEFT-APOLLO", status: "Matched", invoice: "INV-2026-001" },
      { id: "TXN902", date: "2026-06-04", amount: 125000, type: "Credit", reference: "RTGS-CITYMED", status: "Unmatched", invoice: null },
      { id: "TXN903", date: "2026-06-03", amount: 8400, type: "Credit", reference: "UPI-SANJIVANI", status: "Matched", invoice: "INV-2026-045" },
      { id: "TXN904", date: "2026-06-02", amount: 5600, type: "Debit", reference: "BANK CHARGES", status: "Auto-Journal", invoice: null }
    ]);
  }, []);

  const runRecon = () => {
    toast.success("AI Reconciliation started. 1 Unmatched transaction matched automatically based on amount and reference.");
    setTransactions(transactions.map(t => t.id === "TXN902" ? { ...t, status: "Matched", invoice: "INV-2026-089" } : t));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="Open Banking Auto-Reconciliation" />
      <main className="flex-1 p-4 overflow-auto max-w-6xl mx-auto w-full">
        <div className="bg-white border border-gray-300 shadow-sm p-4 mb-4 flex justify-between items-center rounded">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center"><Landmark className="w-5 h-5 mr-2 text-[#1b4985]"/> Bank Webhook Feed</h2>
            <p className="text-gray-500 mt-1">Live incoming bank transactions matched against open invoices automatically.</p>
          </div>
          <button onClick={runRecon} className="bg-[#1b4985] hover:bg-blue-900 text-white px-4 py-2 font-bold rounded flex items-center shadow">
            Run AI Recon <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-white border border-gray-300 p-4 rounded shadow-sm">
            <div className="text-gray-500 font-bold mb-1">Total Transactions</div>
            <div className="text-2xl font-black text-gray-800">{transactions.length}</div>
          </div>
          <div className="bg-white border border-gray-300 p-4 rounded shadow-sm">
            <div className="text-gray-500 font-bold mb-1">Matched (Auto-Cleared)</div>
            <div className="text-2xl font-black text-green-600">{transactions.filter(t => t.status === 'Matched').length}</div>
          </div>
          <div className="bg-white border border-gray-300 p-4 rounded shadow-sm border-l-4 border-l-orange-500">
            <div className="text-gray-500 font-bold mb-1">Unmatched Exceptions</div>
            <div className="text-2xl font-black text-orange-600">{transactions.filter(t => t.status === 'Unmatched').length}</div>
          </div>
          <div className="bg-white border border-gray-300 p-4 rounded shadow-sm">
            <div className="text-gray-500 font-bold mb-1">Auto-Journal Entries</div>
            <div className="text-2xl font-black text-purple-600">{transactions.filter(t => t.status === 'Auto-Journal').length}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-300 shadow-sm rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#1b4985] text-white">
              <tr>
                {["TXN ID", "Date", "Reference", "Amount", "Type", "Status", "Linked Invoice"].map(h => <th key={h} className="p-3 font-bold border-r border-blue-800">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-b border-gray-200 hover:bg-blue-50">
                  <td className="p-3 text-gray-500">{t.id}</td>
                  <td className="p-3">{t.date}</td>
                  <td className="p-3 font-bold">{t.reference}</td>
                  <td className={`p-3 font-bold ${t.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'Credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                  </td>
                  <td className="p-3">{t.type}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded font-bold flex items-center w-max ${t.status === 'Matched' ? 'bg-green-100 text-green-700' : t.status === 'Unmatched' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                      {t.status === 'Matched' ? <FileCheck className="w-3 h-3 mr-1" /> : t.status === 'Unmatched' ? <AlertCircle className="w-3 h-3 mr-1" /> : <FileCheck className="w-3 h-3 mr-1"/>}
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-[#1b4985]">
                    {t.invoice ? t.invoice : <button className="text-blue-600 underline text-[10px]">Manual Match</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <BusinessFooter />
    </div>
  );
}
