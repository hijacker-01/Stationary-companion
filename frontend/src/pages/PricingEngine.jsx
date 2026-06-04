import { useState, useEffect } from "react";
import axios from "../api/axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { TrendingUp, AlertTriangle, CheckCircle, Percent } from "lucide-react";
import toast from "react-hot-toast";

export default function PricingEngine() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mocking the data for AI Pricing Engine
    setItems([
      { id: 1, name: "Paracetamol 500mg", currentMrp: 50, cost: 30, suggestedPrice: 48, aiReason: "Competitor 'MedPlus' dropped price by 4%. Match to retain volume.", risk: "Low" },
      { id: 2, name: "Cough Syrup DX", currentMrp: 120, cost: 70, suggestedPrice: 125, aiReason: "High winter demand detected. Safe to increase margin by 4%.", risk: "Low" },
      { id: 3, name: "Amlodipine 5mg", currentMrp: 85, cost: 45, suggestedPrice: 85, aiReason: "Price optimal. Do not change.", risk: "None" },
      { id: 4, name: "Whey Protein 1kg", currentMrp: 3500, cost: 2200, suggestedPrice: 3200, aiReason: "Stock velocity dropped 30%. Discount needed to clear inventory.", risk: "High" }
    ]);
  }, []);

  const acceptSuggestion = (id, newPrice) => {
    toast.success(`Price updated to ₹${newPrice} successfully.`);
    setItems(items.map(i => i.id === id ? { ...i, currentMrp: newPrice, suggestedPrice: newPrice, aiReason: "Price optimal. Do not change.", risk: "None" } : i));
  };

  const autoApplyAll = () => {
    toast.success("AI auto-applied all low-risk pricing suggestions.");
    setItems(items.map(i => i.risk === "Low" ? { ...i, currentMrp: i.suggestedPrice, aiReason: "Price optimal. Do not change.", risk: "None" } : i));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="AI Pricing Engine" />
      <main className="flex-1 p-4 overflow-auto max-w-6xl mx-auto w-full">
        <div className="bg-white border border-gray-300 shadow-sm p-4 mb-4 flex justify-between items-center rounded">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-[#1b4985]"/> Dynamic Margin Optimizer</h2>
            <p className="text-gray-500 mt-1">AI analyzes market demand, competitor pricing, and inventory velocity to suggest optimal margins.</p>
          </div>
          <button onClick={autoApplyAll} className="bg-[#1b4985] hover:bg-blue-900 text-white px-4 py-2 font-bold rounded flex items-center shadow">
            <CheckCircle className="w-4 h-4 mr-2" /> Auto-Apply Low Risk
          </button>
        </div>

        <div className="bg-white border border-gray-300 shadow-sm rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#1b4985] text-white">
              <tr>
                {["Item Name", "Cost", "Current MRP", "AI Suggested Price", "Reasoning", "Risk", "Action"].map(h => <th key={h} className="p-3 font-bold border-r border-blue-800">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className="border-b border-gray-200 hover:bg-blue-50">
                  <td className="p-3 font-bold">{i.name}</td>
                  <td className="p-3 text-gray-600">₹{i.cost}</td>
                  <td className="p-3 font-bold text-gray-800">₹{i.currentMrp}</td>
                  <td className={`p-3 font-bold ${i.suggestedPrice > i.currentMrp ? 'text-green-600' : i.suggestedPrice < i.currentMrp ? 'text-red-600' : 'text-gray-500'}`}>
                    ₹{i.suggestedPrice}
                  </td>
                  <td className="p-3 text-gray-500 italic max-w-xs">{i.aiReason}</td>
                  <td className="p-3">
                    {i.risk !== 'None' && (
                      <span className={`px-2 py-1 rounded font-bold flex items-center w-max ${i.risk === 'High' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {i.risk === 'High' && <AlertTriangle className="w-3 h-3 mr-1"/>}
                        {i.risk}
                      </span>
                    )}
                    {i.risk === 'None' && <span className="text-gray-400 font-bold">-</span>}
                  </td>
                  <td className="p-3">
                    {i.suggestedPrice !== i.currentMrp ? (
                      <button onClick={() => acceptSuggestion(i.id, i.suggestedPrice)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-bold flex items-center shadow-sm">
                        Accept
                      </button>
                    ) : (
                      <span className="text-green-600 font-bold flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Optimal</span>
                    )}
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
