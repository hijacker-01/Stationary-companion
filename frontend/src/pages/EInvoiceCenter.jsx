import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { QrCode, FileText, CheckCircle, Truck, XCircle } from "lucide-react";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function EInvoiceCenter() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("einvoice");

  useEffect(() => {
    axios.get("/api/gst/einvoice/logs", { headers: headers() })
      .then(res => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="E-Invoice & E-Way Bill Center" />
      <main className="flex-1 p-2 overflow-auto flex flex-col gap-2">
        <div className="flex gap-1 bg-white border border-gray-300 p-1 w-max">
          <button onClick={() => setActiveTab("einvoice")} className={`px-4 py-1.5 font-bold rounded ${activeTab === "einvoice" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}><QrCode className="w-3 h-3 inline mr-1"/> E-Invoices (IRN)</button>
          <button onClick={() => setActiveTab("ewaybill")} className={`px-4 py-1.5 font-bold rounded ${activeTab === "ewaybill" ? "bg-green-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}><Truck className="w-3 h-3 inline mr-1"/> E-Way Bills</button>
        </div>

        {activeTab === "einvoice" && (
          <div className="bg-white border border-gray-300 shadow-sm flex-1">
            <div className="bg-gray-200 p-2 font-bold flex justify-between items-center">
              <span>E-Invoice Generation Logs (NIC Portal)</span>
              <span className="bg-yellow-300 text-yellow-800 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Sandbox Mode</span>
            </div>
            {loading ? <div className="p-4 text-center">Loading Logs...</div> : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-1.5 border-r border-b border-gray-300">Time</th>
                    <th className="p-1.5 border-r border-b border-gray-300">Bill ID</th>
                    <th className="p-1.5 border-r border-b border-gray-300">Environment</th>
                    <th className="p-1.5 border-r border-b border-gray-300">IRN</th>
                    <th className="p-1.5 border-r border-b border-gray-300">Ack No</th>
                    <th className="p-1.5 border-r border-b border-gray-300">Status</th>
                    <th className="p-1.5 border-b border-gray-300">JSON Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-gray-200 hover:bg-blue-50">
                      <td className="p-1.5 border-r border-gray-300 text-[10px] text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-1.5 border-r border-gray-300 font-bold">#{log.billId}</td>
                      <td className="p-1.5 border-r border-gray-300">
                        <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${log.environment === 'production' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{log.environment}</span>
                      </td>
                      <td className="p-1.5 border-r border-gray-300 font-mono text-[9px] text-blue-600">{log.irn ? `${log.irn.substring(0, 15)}...` : "-"}</td>
                      <td className="p-1.5 border-r border-gray-300 font-mono text-[10px]">{log.ackNo || "-"}</td>
                      <td className="p-1.5 border-r border-gray-300">
                        {log.status === "generated" ? <span className="text-green-600 font-bold flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Generated</span> : <span className="text-red-600 font-bold flex items-center"><XCircle className="w-3 h-3 mr-1"/> Failed</span>}
                      </td>
                      <td className="p-1.5">
                        <button className="text-blue-600 hover:underline flex items-center text-[10px]"><FileText className="w-3 h-3 mr-1"/> View JSON</button>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={7} className="p-4 text-center text-gray-500">No E-Invoices generated yet. Go to Billing and create a bill to generate one.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "ewaybill" && (
          <div className="bg-white border border-gray-300 shadow-sm flex-1 flex items-center justify-center text-gray-400 flex-col">
            <Truck className="w-12 h-12 mb-2 text-gray-300" />
            <p>E-Way Bill module ready.</p>
            <p className="text-[10px]">Will activate once transporter details are linked.</p>
          </div>
        )}

      </main>
      <BusinessFooter />
    </div>
  );
}
