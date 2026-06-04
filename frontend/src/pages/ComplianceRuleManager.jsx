import { useState, useEffect } from "react";
import axios from "../api/axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { Settings, ShieldAlert, Check, X, Shield, RefreshCcw } from "lucide-react";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function ComplianceRuleManager() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = () => {
    setLoading(true);
    axios.get("/api/compliance-rules")
      .then(res => setRules(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRules(); }, []);

  const seedRules = async () => {
    try {
      await axios.post("/api/compliance-rules/seed", {});
      fetchRules();
    } catch (e) {
      
    }
  };

  const toggleRule = async (id, currentStatus) => {
    try {
      await axios.put(`/api/compliance-rules/${id}`, { isActive: !currentStatus });
      fetchRules();
    } catch (e) {}
  };

  const severityColor = (s) => ({ CRITICAL: "bg-red-600 text-white", HIGH: "bg-orange-500 text-white", MEDIUM: "bg-yellow-400 text-black", LOW: "bg-blue-400 text-white" }[s] || "bg-gray-200");
  const actionColor = (a) => ({ BLOCK: "text-red-600 border-red-200 bg-red-50", APPROVAL_REQUIRED: "text-orange-600 border-orange-200 bg-orange-50", WARNING: "text-yellow-700 border-yellow-300 bg-yellow-50", ALERT: "text-blue-600 border-blue-200 bg-blue-50" }[a] || "bg-gray-100");

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="Enterprise Compliance Rules Engine" />
      <main className="flex-1 p-2 overflow-auto">
        <div className="bg-white border border-gray-300 shadow-sm flex flex-col h-full">
          <div className="bg-gray-200 p-2 font-bold flex justify-between items-center">
            <span className="flex items-center"><ShieldAlert className="w-4 h-4 mr-2"/> Active Rules Registry</span>
            <div className="flex gap-2">
              <button onClick={seedRules} className="bg-gray-600 text-white px-3 py-1 rounded text-[10px] flex items-center hover:bg-gray-700"><RefreshCcw className="w-3 h-3 mr-1"/> Seed Defaults</button>
              <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">+ Create Rule</button>
            </div>
          </div>
          
          {loading ? <div className="p-4 text-center">Loading Rules...</div> : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-1.5 border-r border-b border-gray-300">Rule Name</th>
                  <th className="p-1.5 border-r border-b border-gray-300">Trigger Type</th>
                  <th className="p-1.5 border-r border-b border-gray-300">Severity</th>
                  <th className="p-1.5 border-r border-b border-gray-300">Action to Take</th>
                  <th className="p-1.5 border-r border-b border-gray-300">Audit</th>
                  <th className="p-1.5 border-r border-b border-gray-300">Active</th>
                  <th className="p-1.5 border-b border-gray-300">Options</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.id} className="border-b border-gray-200 hover:bg-blue-50">
                    <td className="p-1.5 border-r border-gray-300 font-bold">{r.ruleName}</td>
                    <td className="p-1.5 border-r border-gray-300 text-gray-600 font-mono text-[10px]">{r.ruleType}</td>
                    <td className="p-1.5 border-r border-gray-300">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${severityColor(r.severity)}`}>{r.severity}</span>
                    </td>
                    <td className="p-1.5 border-r border-gray-300">
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${actionColor(r.actionToTake)}`}>{r.actionToTake}</span>
                    </td>
                    <td className="p-1.5 border-r border-gray-300 text-center">
                      {r.requiresAudit ? <Shield className="w-3 h-3 text-green-600 inline" /> : <X className="w-3 h-3 text-red-500 inline" />}
                    </td>
                    <td className="p-1.5 border-r border-gray-300">
                      <button onClick={() => toggleRule(r.id, r.isActive)} className={`w-8 h-4 rounded-full relative ${r.isActive ? "bg-green-500" : "bg-gray-300"}`}>
                        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${r.isActive ? "right-0.5" : "left-0.5"}`}></span>
                      </button>
                    </td>
                    <td className="p-1.5">
                      <button className="text-blue-600 hover:underline flex items-center"><Settings className="w-3 h-3 mr-1"/> Config</button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500">No compliance rules configured. Click "Seed Defaults" to populate.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
      <BusinessFooter />
    </div>
  );
}
