import { useState, useEffect } from "react";
import axios from "../api/axios";
import { PackageOpen } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function InventoryValuation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchValuation = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/analytics/valuation");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchValuation(); }, []);

  if (loading || !data) return <div className="p-8 text-center">Loading Valuation...</div>;

  return (
    <div className="flex-1 p-6 bg-[#f4f4f4] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory Valuation</h1>
          <p className="text-sm text-gray-500">Closing Stock Value using Batch/Specific Identification (Pharma FIFO equivalent)</p>
        </div>
        <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-1.5 text-xs font-bold rounded">Print Report</button>
      </div>

      <div className="bg-white p-6 border border-gray-200 rounded shadow-sm mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full">
            <PackageOpen className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase">Total Closing Stock Value</p>
            <p className="text-3xl font-bold text-gray-800">₹{data.totalClosingStockValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 font-bold">Total SKUs in Stock</p>
          <p className="text-xl font-bold text-gray-800">{data.items.length}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded shadow-sm">
        <div className="p-0 max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0 shadow-sm">
              <tr>
                <th className="p-3 border-b">Product Name</th>
                <th className="p-3 border-b">Batch</th>
                <th className="p-3 border-b">Category</th>
                <th className="p-3 border-b text-right">In Stock (Qty)</th>
                <th className="p-3 border-b text-right">Cost Rate ₹</th>
                <th className="p-3 border-b text-right">Stock Value ₹</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-semibold">{item.name}</td>
                  <td className="p-3 text-gray-500">{item.batch || '-'}</td>
                  <td className="p-3 text-gray-500">{item.category}</td>
                  <td className="p-3 text-right font-semibold">{item.qty}</td>
                  <td className="p-3 text-right text-gray-500">{item.rate.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                  <td className="p-3 text-right font-bold text-emerald-700">{item.value.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr><td colSpan="6" className="p-4 text-center text-gray-500">No stock available to value.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
