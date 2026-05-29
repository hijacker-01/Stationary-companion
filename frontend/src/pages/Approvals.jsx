import React, { useState, useEffect } from "react";
import axios from "axios";
import { ShieldAlert, CheckCircle, XCircle, FileText, IndianRupee } from "lucide-react";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function Approvals() {
  const [approvals, setApprovals] = useState([]);

  useEffect(() => {
    // Simulated fetch
    const fetchApprovals = async () => {
      try {
        const { data } = await axios.get("/api/enterprise/approvals", { headers: headers() });
        setApprovals(data.data || data);
      } catch (err) {
        setApprovals([
          { id: 'APP-901', type: 'Purchase Order', reference: 'PO-2023-441', requestedBy: 'Admin', amount: 1500000, reason: 'High Value PO (> ₹10L)', date: '2023-10-25 10:30 AM' },
          { id: 'APP-902', type: 'Sales Invoice', reference: 'INV-8890', requestedBy: 'Sales Rep 1', amount: 45000, reason: 'High Discount (25%)', date: '2023-10-25 11:15 AM' },
          { id: 'APP-903', type: 'Credit Note', reference: 'CN-112', requestedBy: 'Accountant', amount: 12000, reason: 'Expired Goods Return', date: '2023-10-25 01:45 PM' }
        ]);
      }
    };
    fetchApprovals();
  }, []);

  const handleAction = (id, action) => {
    // In real app, axios post
    setApprovals(approvals.filter(a => a.id !== id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="Workflow Approvals" />
      
      <main className="flex-1 p-2 flex flex-col gap-2 overflow-hidden">
        <section className="flex-1 bg-white border border-gray-300 shadow-sm flex flex-col">
          <div className="bg-gray-200 border-b border-gray-300 p-2 font-bold flex items-center justify-between">
            <div className="flex items-center text-red-700">
              <ShieldAlert className="w-4 h-4 mr-2" /> Pending Manager Approvals
            </div>
            <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full border border-red-300">
              {approvals.length} Items Pending
            </span>
          </div>
          
          <div className="flex-1 overflow-auto p-2">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 sticky top-0 border-b border-gray-300 shadow-sm">
                <tr>
                  <th className="p-1 border-r border-gray-300">Req ID</th>
                  <th className="p-1 border-r border-gray-300">Type</th>
                  <th className="p-1 border-r border-gray-300">Reference</th>
                  <th className="p-1 border-r border-gray-300">Requested By</th>
                  <th className="p-1 border-r border-gray-300 text-right">Amount (₹)</th>
                  <th className="p-1 border-r border-gray-300">Reason / Trigger</th>
                  <th className="p-1 border-r border-gray-300">Date/Time</th>
                  <th className="p-1 text-center w-32">Action</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map(app => (
                  <tr key={app.id} className="border-b border-gray-200 hover:bg-red-50 transition-colors">
                    <td className="p-1 border-r border-gray-300 font-mono text-gray-600">{app.id}</td>
                    <td className="p-1 border-r border-gray-300 font-semibold flex items-center">
                      <FileText className="w-3 h-3 mr-1 text-gray-500" /> {app.type}
                    </td>
                    <td className="p-1 border-r border-gray-300 text-blue-700 cursor-pointer hover:underline">{app.reference}</td>
                    <td className="p-1 border-r border-gray-300">{app.requestedBy}</td>
                    <td className="p-1 border-r border-gray-300 text-right font-bold flex justify-end items-center">
                      <IndianRupee className="w-3 h-3 mr-0.5 text-gray-500" /> {app.amount.toLocaleString()}
                    </td>
                    <td className="p-1 border-r border-gray-300 text-red-600 font-semibold">{app.reason}</td>
                    <td className="p-1 border-r border-gray-300 text-gray-500">{app.date}</td>
                    <td className="p-1 text-center flex justify-center gap-1">
                      <button 
                        onClick={() => handleAction(app.id, 'approve')}
                        className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-800 flex items-center shadow-sm"
                        tabIndex={0}
                        title="Approve"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleAction(app.id, 'reject')}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-800 flex items-center shadow-sm"
                        tabIndex={0}
                        title="Reject"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {approvals.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      All caught up! No pending approvals.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <BusinessFooter />
    </div>
  );
}
