import { useState, useEffect } from "react";
import axios from "axios";
import { TrendingUp, Users, Package, FileText } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function ProfitAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("product"); // product, customer, invoice

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await axios.get("http://localhost:5000/api/analytics/profit", { headers: headers(), params });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  if (loading || !data) return <div className="p-8 text-center">Loading Analytics...</div>;

  return (
    <div className="flex-1 p-6 bg-[#f4f4f4] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Costing & Profit Analytics</h1>
          <p className="text-sm text-gray-500">Invoice-wise, Product-wise, and Customer-wise profit margins</p>
        </div>
        <div className="flex gap-2">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs p-1.5 border border-gray-300 rounded" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs p-1.5 border border-gray-300 rounded" />
          <button onClick={fetchAnalytics} className="bg-[#1b4985] text-white px-3 py-1.5 text-xs font-bold rounded">Load</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 border border-gray-200 rounded shadow-sm">
          <p className="text-xs text-gray-500 font-bold uppercase">Total Revenue</p>
          <p className="text-xl font-bold text-gray-800">₹{data.summary.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded shadow-sm">
          <p className="text-xs text-gray-500 font-bold uppercase">Total Cost</p>
          <p className="text-xl font-bold text-gray-800">₹{data.summary.totalCost.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded shadow-sm">
          <p className="text-xs text-gray-500 font-bold uppercase">Net Profit</p>
          <p className="text-xl font-bold text-emerald-600">₹{data.summary.totalProfit.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded shadow-sm">
          <p className="text-xs text-gray-500 font-bold uppercase">Overall Margin</p>
          <p className="text-xl font-bold text-blue-600">{data.summary.overallMargin.toFixed(2)}%</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded shadow-sm">
        <div className="flex border-b border-gray-200">
          <button onClick={() => setActiveTab("product")} className={`flex-1 py-2 text-sm font-bold flex justify-center items-center gap-2 ${activeTab === 'product' ? 'border-b-2 border-[#1b4985] text-[#1b4985]' : 'text-gray-500'}`}><Package className="w-4 h-4"/> Product-Wise</button>
          <button onClick={() => setActiveTab("customer")} className={`flex-1 py-2 text-sm font-bold flex justify-center items-center gap-2 ${activeTab === 'customer' ? 'border-b-2 border-[#1b4985] text-[#1b4985]' : 'text-gray-500'}`}><Users className="w-4 h-4"/> Customer-Wise</button>
          <button onClick={() => setActiveTab("invoice")} className={`flex-1 py-2 text-sm font-bold flex justify-center items-center gap-2 ${activeTab === 'invoice' ? 'border-b-2 border-[#1b4985] text-[#1b4985]' : 'text-gray-500'}`}><FileText className="w-4 h-4"/> Invoice-Wise</button>
        </div>
        
        <div className="p-0 max-h-[500px] overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0">
              <tr>
                <th className="p-2 border-b">Name / ID</th>
                {activeTab === 'product' && <th className="p-2 border-b">Qty Sold</th>}
                <th className="p-2 border-b">Revenue ₹</th>
                <th className="p-2 border-b">Cost ₹</th>
                <th className="p-2 border-b">Profit ₹</th>
                <th className="p-2 border-b">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'product' ? data.productWise : activeTab === 'customer' ? data.customerWise : data.invoiceWise).map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-2 font-semibold">{row.name || row.customerName || row.billNo}</td>
                  {activeTab === 'product' && <td className="p-2">{row.qty}</td>}
                  <td className="p-2">{row.revenue.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                  <td className="p-2">{row.cost.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                  <td className="p-2 font-bold text-emerald-600">{row.profit.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                  <td className="p-2 font-bold">{row.marginPct.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
