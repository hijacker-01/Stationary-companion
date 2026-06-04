import { useState, useEffect } from "react";
import axios from "../api/axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { BrainCircuit, AlertTriangle, TrendingUp, IndianRupee, Clock, PackageMinus, Users } from "lucide-react";
import toast from "react-hot-toast";

export default function AICockpit() {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/intelligence/briefing")
      .then(r => setBriefing(r.data))
      .catch(() => toast.error("Failed to load AI briefing"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="AI Operational Cockpit" />
      <main className="flex-1 p-4 overflow-auto max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">Loading AI Intelligence...</div>
        ) : briefing ? (
          <div className="flex flex-col gap-4">
            
            {/* AI Greeting Card */}
            <div className="bg-[#1b4985] text-white p-6 rounded-lg shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <BrainCircuit className="w-24 h-24" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{briefing.greeting}.</h2>
              <p className="text-lg opacity-90 max-w-2xl">{briefing.message}</p>
            </div>

            {/* Top Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
                <div className="text-gray-500 font-bold mb-1 flex items-center"><IndianRupee className="w-4 h-4 mr-1"/> Expected Revenue</div>
                <div className="text-2xl font-bold text-gray-800">₹{(briefing.expectedRevenue / 100000).toFixed(2)} L</div>
              </div>
              <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
                <div className="text-gray-500 font-bold mb-1 flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> Stockouts</div>
                <div className="text-2xl font-bold text-gray-800">{briefing.stockouts.length} Items</div>
              </div>
              <div className="bg-white p-4 rounded shadow border-l-4 border-orange-500">
                <div className="text-gray-500 font-bold mb-1 flex items-center"><Clock className="w-4 h-4 mr-1"/> Expiry Risk</div>
                <div className="text-2xl font-bold text-gray-800">{briefing.expiries.length} Batches</div>
              </div>
              <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
                <div className="text-gray-500 font-bold mb-1 flex items-center"><Users className="w-4 h-4 mr-1"/> Expected Payers</div>
                <div className="text-2xl font-bold text-gray-800">{briefing.expectedPayers}</div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded shadow p-4 border border-gray-300">
                <h3 className="font-bold text-lg mb-3 border-b pb-2 flex items-center"><PackageMinus className="w-5 h-5 mr-2 text-red-600"/> High Risk Stockouts</h3>
                <ul className="space-y-2">
                  {briefing.stockouts.map((item, i) => (
                    <li key={i} className="flex justify-between items-center p-2 bg-red-50 rounded text-red-800">
                      <span className="font-bold">{item.name}</span>
                      <span className="bg-red-200 px-2 py-1 rounded-full text-[10px]">Runs out in {item.daysLeft} days</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-white rounded shadow p-4 border border-gray-300">
                <h3 className="font-bold text-lg mb-3 border-b pb-2 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-green-600"/> Auto-Procurement Suggestion</h3>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded border border-green-200">
                  <div>
                    <div className="text-green-800 font-bold mb-1">Recommended Purchase Draft Ready</div>
                    <div className="text-sm text-green-700">Value: ₹{(briefing.recommendedPurchase / 100000).toFixed(2)} Lakh</div>
                  </div>
                  <button className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 font-bold">Review PO</button>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-red-500">Failed to load briefing</div>
        )}
      </main>
      <BusinessFooter />
    </div>
  );
}
