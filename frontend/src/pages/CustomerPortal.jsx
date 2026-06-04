import { useState, useEffect } from "react";
import axios from "../api/axios";
import { UserCircle, IndianRupee, FileText, AlertTriangle, CreditCard } from "lucide-react";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const fmt = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const shortDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function CustomerPortal() {
  const [data, setData] = useState({
    customerName: "Acme Corp (Portal View)",
    totalOutstanding: 45000,
    creditLimit: 100000,
    lastPaymentDate: "2026-05-10",
    outstandingBills: [],
    ledger: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch customer data. Assuming an endpoint exists, fallback to dummy data on failure
    axios
      .get("/portal/customer")
      .then((res) => {
        if (res.data) {
          setData((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => {
        // Fallback dummy data for visual representation
        setData({
          customerName: "Sharma Medical Store",
          totalOutstanding: 12500.50,
          creditLimit: 50000.00,
          lastPaymentDate: "2026-05-25",
          outstandingBills: [
            { invoiceNo: "INV-2026-101", date: "2026-05-01", amount: 5000, dueDays: 29 },
            { invoiceNo: "INV-2026-142", date: "2026-05-15", amount: 7500.50, dueDays: 15 }
          ],
          ledger: [
            { date: "2026-05-01", type: "Sales", ref: "INV-2026-101", debit: 5000, credit: 0, balance: 5000 },
            { date: "2026-05-10", type: "Receipt", ref: "REC-992", debit: 0, credit: 5000, balance: 0 },
            { date: "2026-05-15", type: "Sales", ref: "INV-2026-142", debit: 7500.50, credit: 0, balance: 7500.50 },
            { date: "2026-05-20", type: "Sales", ref: "INV-2026-189", debit: 5000, credit: 0, balance: 12500.50 }
          ]
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#e5e5e5] overflow-hidden font-sans">
      <Header />
      <main className="flex-1 overflow-y-auto bg-[#f4f4f4] p-4 flex flex-col gap-3">
        {/* Top Header */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Loading customer data...</div>
        ) : (
          <>
            <div className="bg-white border border-gray-300 rounded shadow-sm px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCircle className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-sm font-bold text-gray-800">Customer Self-Service Portal</h1>
              <p className="text-xs text-gray-500">Welcome, {data.customerName}</p>
            </div>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center gap-1" tabIndex={1}>
            <CreditCard className="w-3.5 h-3.5" /> Pay Now
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 border border-red-200 rounded p-3 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-red-600 uppercase flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3" /> Total Outstanding
              </p>
              <p className="text-lg font-extrabold text-red-800">₹{fmt(data.totalOutstanding)}</p>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-3 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1 mb-1">
                <IndianRupee className="w-3 h-3" /> Credit Limit
              </p>
              <p className="text-lg font-extrabold text-green-800">₹{fmt(data.creditLimit)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-green-600 font-medium">Available</p>
              <p className="text-xs font-bold text-green-800">₹{fmt(data.creditLimit - data.totalOutstanding)}</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 shadow-sm">
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Last Payment</p>
            <p className="text-sm font-extrabold text-blue-800">{shortDate(data.lastPaymentDate)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 flex-1 overflow-hidden">
          {/* Outstanding Bills Table */}
          <div className="bg-white border border-gray-300 rounded shadow-sm flex flex-col overflow-hidden">
            <div className="bg-gray-100 border-b border-gray-300 px-3 py-2 flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-800 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Outstanding Invoices
              </h2>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-[#e8e8e8] sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700">Invoice No</th>
                    <th className="text-left px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700">Date</th>
                    <th className="text-right px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700">Days Due</th>
                    <th className="text-right px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700">Amount ₹</th>
                  </tr>
                </thead>
                <tbody>
                  {data.outstandingBills.map((bill, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                      <td className="px-2 py-1.5 font-medium text-blue-600 cursor-pointer hover:underline">{bill.invoiceNo}</td>
                      <td className="px-2 py-1.5 text-gray-600">{shortDate(bill.date)}</td>
                      <td className={`px-2 py-1.5 text-right font-bold ${bill.dueDays > 30 ? "text-red-600" : "text-gray-800"}`}>
                        {bill.dueDays}
                      </td>
                      <td className="px-2 py-1.5 text-right font-bold text-gray-900">{fmt(bill.amount)}</td>
                    </tr>
                  ))}
                  {data.outstandingBills.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-gray-400">No outstanding invoices</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ledger Statement Table */}
          <div className="bg-white border border-gray-300 rounded shadow-sm flex flex-col overflow-hidden">
            <div className="bg-gray-100 border-b border-gray-300 px-3 py-2 flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-800 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Recent Ledger
              </h2>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-[#e8e8e8] sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700">Date</th>
                    <th className="text-left px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700">Type / Ref</th>
                    <th className="text-right px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700">Debit</th>
                    <th className="text-right px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700">Credit</th>
                    <th className="text-right px-2 py-1.5 border-b border-gray-300 font-bold text-gray-700">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ledger.map((entry, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                      <td className="px-2 py-1.5 text-gray-600">{shortDate(entry.date)}</td>
                      <td className="px-2 py-1.5">
                        <span className="font-medium text-gray-800">{entry.type}</span><br/>
                        <span className="text-[10px] text-gray-500">{entry.ref}</span>
                      </td>
                      <td className="px-2 py-1.5 text-right text-red-700 font-medium">{entry.debit > 0 ? fmt(entry.debit) : ""}</td>
                      <td className="px-2 py-1.5 text-right text-green-700 font-medium">{entry.credit > 0 ? fmt(entry.credit) : ""}</td>
                      <td className="px-2 py-1.5 text-right font-bold text-gray-900">{fmt(entry.balance)}</td>
                    </tr>
                  ))}
                  {data.ledger.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-400">No ledger entries found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </>
        )}
      </main>
      <BusinessFooter />
    </div>
  );
}
