import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AlertTriangle, 
  TrendingDown, 
  Package, 
  RefreshCcw, 
  Zap,
  Activity,
  Search,
  Filter,
  MessageSquare
} from 'lucide-react';
import Header from '../components/Header';
import BusinessFooter from '../components/BusinessFooter';

function ExpiryCommandCenter() {
  const [dashboard, setDashboard] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // all, critical, returnable
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [dashRes, actRes] = await Promise.all([
        axios.get('/api/expiry/dashboard', { headers }),
        axios.get('/api/expiry/actions', { headers })
      ]);
      
      setDashboard(dashRes.data);
      setActions(actRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAskAI = async () => {
    if (!aiQuery) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/expiry/ask', { question: aiQuery }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiResponse(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !dashboard) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="animate-spin text-blue-500"><RefreshCcw size={48} /></div>
    </div>
  );

  const getFilteredActions = () => {
    if (filterMode === 'critical') return actions.filter(a => a.daysRemaining <= 30);
    if (filterMode === 'returnable') return actions.filter(a => a.recommendedAction === 'RETURN TO SUPPLIER');
    return actions;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-20">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              <Zap className="text-yellow-400" size={36} />
              Expiry Intelligence Center
            </h1>
            <p className="text-slate-400 mt-2">Autonomous Inventory Loss Prevention System</p>
          </div>
          <div className={`px-6 py-3 rounded-xl border-2 flex items-center gap-3 ${
            dashboard.healthStatus === 'Excellent' ? 'border-green-500 bg-green-500/10' :
            dashboard.healthStatus === 'Good' ? 'border-blue-500 bg-blue-500/10' :
            dashboard.healthStatus === 'Critical' ? 'border-red-500 bg-red-500/10 animate-pulse' :
            'border-orange-500 bg-orange-500/10'
          }`}>
            <Activity className={dashboard.healthStatus === 'Critical' ? 'text-red-500' : 'text-slate-200'} />
            <div>
              <div className="text-sm font-semibold uppercase tracking-wider text-slate-400">Health Score</div>
              <div className="text-2xl font-bold text-white">{dashboard.healthScore} / 100</div>
            </div>
          </div>
        </div>

        {/* Phase 1: Expiry Command Center Buckets */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "> 180 Days", color: "border-green-500", bg: "bg-green-500/10", data: dashboard.buckets.greaterThan180 },
            { label: "90 - 180 Days", color: "border-yellow-500", bg: "bg-yellow-500/10", data: dashboard.buckets.between90And180 },
            { label: "30 - 90 Days", color: "border-orange-500", bg: "bg-orange-500/10", data: dashboard.buckets.between30And90 },
            { label: "< 30 Days", color: "border-red-500", bg: "bg-red-500/20 animate-pulse", data: dashboard.buckets.lessThan30 },
            { label: "EXPIRED", color: "border-red-800", bg: "bg-red-900/50", data: dashboard.buckets.expired }
          ].map((bucket, i) => (
            <div key={i} className={`p-4 rounded-xl border-l-4 ${bucket.color} ${bucket.bg} backdrop-blur-sm`}>
              <div className="text-sm font-semibold text-slate-300">{bucket.label}</div>
              <div className="text-2xl font-bold text-white mt-2">₹{bucket.data.value.toLocaleString()}</div>
              <div className="text-xs text-slate-400 mt-1">{bucket.data.count} batches</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Phase 19: Executive Copilot */}
          <div className="lg:col-span-1 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <MessageSquare className="text-blue-400" /> Executive AI Copilot
            </h2>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={aiQuery} 
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                placeholder="Ask about expiry risk..." 
                className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-700 focus:outline-none focus:border-blue-500"
              />
              <button onClick={handleAskAI} className="bg-blue-600 hover:bg-blue-500 px-4 rounded-lg font-bold transition">Ask</button>
            </div>
            
            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span onClick={() => setAiQuery("Which products are at highest expiry risk?")} className="text-xs bg-slate-700 hover:bg-slate-600 cursor-pointer px-2 py-1 rounded">Highest Risk?</span>
              <span onClick={() => setAiQuery("How much stock may expire in 60 days?")} className="text-xs bg-slate-700 hover:bg-slate-600 cursor-pointer px-2 py-1 rounded">60 Day Loss?</span>
            </div>

            {aiResponse && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                <p className="font-semibold text-blue-100">{aiResponse.answer}</p>
                <p className="text-sm text-blue-300 mt-2">{aiResponse.reasoning}</p>
              </div>
            )}
            
            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <span className="text-slate-400">Total Potential Loss</span>
                <span className="font-bold text-red-400">₹{(dashboard.buckets.lessThan30.value + dashboard.expiredValue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <span className="text-slate-400">Recoverable Value</span>
                <span className="font-bold text-green-400">₹{dashboard.recoverableValue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Phase 5 & 17: Action Center */}
          <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-orange-400" /> Action Center
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setFilterMode('all')} className={`px-3 py-1 rounded-lg text-sm ${filterMode === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>All</button>
                <button onClick={() => setFilterMode('critical')} className={`px-3 py-1 rounded-lg text-sm ${filterMode === 'critical' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Critical &lt;30d</button>
                <button onClick={() => setFilterMode('returnable')} className={`px-3 py-1 rounded-lg text-sm ${filterMode === 'returnable' ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Returns</button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 sticky top-0">
                  <tr>
                    <th className="p-3 text-slate-400 font-semibold text-sm">Product</th>
                    <th className="p-3 text-slate-400 font-semibold text-sm">Batch</th>
                    <th className="p-3 text-slate-400 font-semibold text-sm">Days Left</th>
                    <th className="p-3 text-slate-400 font-semibold text-sm">Value (₹)</th>
                    <th className="p-3 text-slate-400 font-semibold text-sm">Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredActions().map((action, idx) => (
                    <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition cursor-pointer">
                      <td className="p-3 font-medium text-white">{action.itemName}</td>
                      <td className="p-3 text-slate-300">{action.batchNo}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          action.daysRemaining < 0 ? 'bg-red-900 text-red-100' :
                          action.daysRemaining <= 30 ? 'bg-red-500 text-white' :
                          action.daysRemaining <= 90 ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                        }`}>
                          {action.daysRemaining}d
                        </span>
                      </td>
                      <td className="p-3 text-slate-200">₹{action.value.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${
                          action.recommendedAction === 'DISPOSE' ? 'border-red-500 text-red-400' :
                          action.recommendedAction === 'RETURN TO SUPPLIER' ? 'border-yellow-500 text-yellow-400' :
                          action.recommendedAction === 'DISCOUNT' ? 'border-orange-500 text-orange-400 bg-orange-500/10' :
                          'border-blue-500 text-blue-400'
                        }`}>
                          {action.recommendedAction} {action.suggestedDiscountPct ? `(${action.suggestedDiscountPct}%)` : ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {getFilteredActions().length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">No action required for this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Phase 3: Warehouse Heatmap */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <Package className="text-purple-400" /> Warehouse Expiry Heatmap
          </h2>
          <div className="flex flex-wrap gap-4">
            {Object.keys(dashboard.heatmap).length > 0 ? (
              Object.entries(dashboard.heatmap).map(([rack, data]) => {
                const intensity = Math.min(100, Math.max(20, (data.riskScore / data.count) * 2));
                return (
                  <div key={rack} 
                    className="p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center w-32 h-32 transition hover:scale-105 cursor-pointer"
                    style={{ backgroundColor: `rgba(239, 68, 68, ${intensity / 100})` }}
                  >
                    <div className="text-lg font-bold text-white mb-1">{rack}</div>
                    <div className="text-xs text-white/80 font-medium">{data.count} Batches</div>
                    <div className="text-xs text-white/90 font-bold mt-2">₹{data.value.toLocaleString()}</div>
                  </div>
                )
              })
            ) : (
              <div className="text-slate-400 w-full text-center py-8">No location data (rackCode) recorded for current batches.</div>
            )}
          </div>
        </div>

      </div>
      <BusinessFooter />
    </div>
  );
}

export default ExpiryCommandCenter;
