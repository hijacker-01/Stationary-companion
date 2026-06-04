import { useState, useEffect } from "react";
import axios from "../api/axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { ShieldCheck, AlertCircle, FileText, CheckCircle, Clock } from "lucide-react";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function GSTDashboard() {
  const [stats, setStats] = useState({ complianceScore: 0, pendingReturns: 0, itcMismatch: 0, nonFilingSuppliers: 0, taxLiability: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/gst/dashboard")
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="GST Health & Returns Dashboard" />
      <main className="flex-1 p-2 overflow-auto flex flex-col gap-2">
        {loading ? <div className="p-4 text-center text-gray-500">Loading GST Data...</div> : (
          <>
            <div className="flex gap-2">
              <div className="flex-1 bg-blue-50 border border-blue-200 p-3 flex flex-col justify-center items-center shadow-sm">
                <ShieldCheck className="w-8 h-8 text-blue-600 mb-1" />
                <div className="text-[10px] uppercase font-bold text-blue-800">Compliance Score</div>
                <div className="text-3xl font-black text-blue-700">{stats.complianceScore}/100</div>
              </div>
              <div className="flex-1 bg-white border border-gray-300 p-3 shadow-sm flex flex-col justify-between">
                <div className="text-[10px] uppercase text-gray-500 font-bold">Tax Liability (Current Month)</div>
                <div className="text-xl font-bold">₹{stats.taxLiability.toLocaleString()}</div>
                <div className="text-[9px] text-gray-400 mt-1">Due by 20th</div>
              </div>
              <div className="flex-1 bg-yellow-50 border border-yellow-300 p-3 shadow-sm flex flex-col justify-between">
                <div className="text-[10px] uppercase text-yellow-700 font-bold flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> Pending Returns</div>
                <div className="text-xl font-bold text-yellow-800">{stats.pendingReturns}</div>
                <button className="bg-yellow-600 text-white px-2 py-1 rounded text-[9px] mt-1 w-max">File Now</button>
              </div>
              <div className="flex-1 bg-red-50 border border-red-200 p-3 shadow-sm flex flex-col justify-between">
                <div className="text-[10px] uppercase text-red-700 font-bold">ITC Mismatch (2A/2B)</div>
                <div className="text-xl font-bold text-red-600">₹{stats.itcMismatch.toLocaleString()}</div>
                <div className="text-[9px] text-red-500 mt-1">{stats.nonFilingSuppliers} Suppliers not filed</div>
              </div>
            </div>

            <div className="flex gap-2 flex-1">
              <div className="flex-1 bg-white border border-gray-300 shadow-sm flex flex-col">
                <div className="bg-gray-200 p-2 font-bold flex items-center"><FileText className="w-4 h-4 mr-2"/> GSTR Filing Status</div>
                <div className="p-3 flex flex-col gap-3">
                  {[
                    { name: "GSTR-1", period: "April 2026", status: "Filed", date: "11 May 2026", color: "text-green-600" },
                    { name: "GSTR-3B", period: "April 2026", status: "Filed", date: "20 May 2026", color: "text-green-600" },
                    { name: "GSTR-1", period: "May 2026", status: "Pending", date: "Due 11 Jun", color: "text-yellow-600" },
                    { name: "GSTR-2B", period: "May 2026", status: "Reconciliation Pending", date: "Available 14 Jun", color: "text-blue-600" }
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
                      <div>
                        <div className="font-bold">{r.name}</div>
                        <div className="text-[9px] text-gray-500">{r.period}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${r.color} flex items-center justify-end`}>
                          {r.status === "Filed" ? <CheckCircle className="w-3 h-3 mr-1"/> : <Clock className="w-3 h-3 mr-1"/>}
                          {r.status}
                        </div>
                        <div className="text-[9px] text-gray-400">{r.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-white border border-gray-300 shadow-sm flex flex-col">
                <div className="bg-gray-200 p-2 font-bold flex items-center"><AlertCircle className="w-4 h-4 mr-2 text-orange-500"/> ITC Reconciliation Issues</div>
                <table className="w-full text-left border-collapse mt-1">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-1.5 border-b border-gray-200 text-[10px]">Supplier GSTIN</th>
                      <th className="p-1.5 border-b border-gray-200 text-[10px]">ERP ITC (₹)</th>
                      <th className="p-1.5 border-b border-gray-200 text-[10px]">2B ITC (₹)</th>
                      <th className="p-1.5 border-b border-gray-200 text-[10px]">Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-red-50">
                      <td className="p-1.5 border-b border-gray-100 font-mono">27AAAAA0000A1Z5</td>
                      <td className="p-1.5 border-b border-gray-100">45,000</td>
                      <td className="p-1.5 border-b border-gray-100 text-red-600 font-bold">0</td>
                      <td className="p-1.5 border-b border-gray-100 font-bold text-red-600">-45,000</td>
                    </tr>
                    <tr className="hover:bg-yellow-50">
                      <td className="p-1.5 border-b border-gray-100 font-mono">29BBBBB1111B2Z2</td>
                      <td className="p-1.5 border-b border-gray-100">12,500</td>
                      <td className="p-1.5 border-b border-gray-100">12,000</td>
                      <td className="p-1.5 border-b border-gray-100 font-bold text-yellow-600">-500</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
      <BusinessFooter />
    </div>
  );
}
