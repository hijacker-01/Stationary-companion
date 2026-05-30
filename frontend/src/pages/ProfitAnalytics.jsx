import { useState, useEffect } from "react";
import axios from "axios";
import { 
  TrendingUp, TrendingDown, Users, Package, FileText, 
  AlertCircle, DollarSign, Activity, BarChart2, ShieldAlert,
  Search, Filter
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function ProfitAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("this_month"); // today, this_month, this_year, all
  const [activeTab, setActiveTab] = useState("executive"); // executive, products, customers, suppliers, batches
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/analytics/profit?filter=${filter}`, { headers: headers() });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [filter]);

  const askCopilot = async () => {
    if (!aiQuery) return;
    try {
      const res = await axios.post("http://localhost:5000/api/analytics/copilot", { query: aiQuery }, { headers: headers() });
      setAiResponse(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !data) return <div className="p-8 text-center font-bold">Loading Enterprise Profit Engine...</div>;

  const sum = data.summary;
  const isLoss = sum.netMargin < 0;

  // Custom Waterfall Renderer
  const renderWaterfall = () => {
    const { revenue, productCost, freight, warehouse, salesman, bankCharges, packaging, netProfit } = sum.waterfall;
    const max = revenue || 1; // avoid /0
    const w = (val) => `${(val / max) * 100}%`;
    
    return (
      <div className="bg-white p-4 border border-gray-200 rounded shadow-sm">
        <h3 className="font-bold text-sm text-gray-700 mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-600"/> Profit Waterfall (True Costing)
        </h3>
        <div className="space-y-3">
          <div className="flex items-center text-xs">
            <div className="w-32 font-bold text-gray-700">Gross Revenue</div>
            <div className="flex-1 bg-gray-100 h-6 relative rounded">
              <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded" style={{width: w(revenue)}}></div>
            </div>
            <div className="w-24 text-right font-bold">₹{revenue.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-32 text-gray-600">- Product COGS</div>
            <div className="flex-1 bg-gray-100 h-4 relative rounded">
              <div className="absolute top-0 right-0 h-full bg-red-400 rounded" style={{width: w(productCost)}}></div>
            </div>
            <div className="w-24 text-right text-red-600">- ₹{productCost.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-32 text-gray-600">- Freight (2%)</div>
            <div className="flex-1 bg-gray-100 h-4 relative rounded">
              <div className="absolute top-0 right-0 h-full bg-orange-400 rounded" style={{width: w(freight)}}></div>
            </div>
            <div className="w-24 text-right text-red-600">- ₹{freight.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-32 text-gray-600">- Warehouse (1.5%)</div>
            <div className="flex-1 bg-gray-100 h-4 relative rounded">
              <div className="absolute top-0 right-0 h-full bg-orange-400 rounded" style={{width: w(warehouse)}}></div>
            </div>
            <div className="w-24 text-right text-red-600">- ₹{warehouse.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-32 font-bold text-gray-800">True Net Profit</div>
            <div className="flex-1 bg-gray-100 h-6 relative rounded">
              <div className="absolute top-0 left-0 h-full bg-blue-600 rounded" style={{width: w(Math.max(netProfit, 0))}}></div>
            </div>
            <div className="w-24 text-right font-bold text-blue-700">₹{netProfit.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Activity className="text-blue-700"/> Enterprise Profit Intelligence Center
              </h1>
              <p className="text-xs text-gray-500">True Net Margin & Financial Health Diagnostics</p>
            </div>
            <div className="flex gap-2">
              <select value={filter} onChange={e => setFilter(e.target.value)} className="text-xs p-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500">
                <option value="today">Today</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
                <option value="all">All Time</option>
              </select>
              <button onClick={fetchAnalytics} className="bg-[#1b4985] text-white px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1 hover:bg-blue-800">
                <Filter className="w-3 h-3"/> Refresh
              </button>
            </div>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-6 gap-3 mb-4">
            <div className="bg-white p-3 border-l-4 border-emerald-500 rounded shadow-sm">
              <p className="text-[10px] text-gray-500 font-bold uppercase">Gross Revenue</p>
              <p className="text-lg font-black text-gray-800">₹{sum.totalRevenue.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
            </div>
            <div className="bg-white p-3 border-l-4 border-blue-500 rounded shadow-sm">
              <p className="text-[10px] text-gray-500 font-bold uppercase">True Net Profit</p>
              <p className={`text-lg font-black ${isLoss ? 'text-red-600' : 'text-blue-700'}`}>₹{sum.totalNetProfit.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
            </div>
            <div className={`bg-white p-3 border-l-4 ${sum.grossMargin > 15 ? 'border-emerald-500' : 'border-yellow-500'} rounded shadow-sm`}>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Gross Margin %</p>
              <p className="text-lg font-black">{sum.grossMargin.toFixed(1)}%</p>
            </div>
            <div className={`bg-white p-3 border-l-4 ${sum.netMargin > 10 ? 'border-emerald-500' : sum.netMargin < 0 ? 'border-red-500' : 'border-yellow-500'} rounded shadow-sm`}>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Net Margin %</p>
              <p className="text-lg font-black flex items-center gap-1">
                {sum.netMargin.toFixed(1)}% {sum.netMargin < 0 ? <TrendingDown className="w-4 h-4 text-red-500"/> : <TrendingUp className="w-4 h-4 text-emerald-500"/>}
              </p>
            </div>
            <div className="bg-white p-3 border-l-4 border-purple-500 rounded shadow-sm">
              <p className="text-[10px] text-gray-500 font-bold uppercase">Profit / Invoice</p>
              <p className="text-lg font-black text-purple-700">₹{sum.profitPerInvoice.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
            </div>
            <div className="bg-white p-3 border-l-4 border-indigo-500 rounded shadow-sm">
              <p className="text-[10px] text-gray-500 font-bold uppercase">Forecast 30 Days</p>
              <p className="text-lg font-black text-indigo-700">₹{data.insights.forecast.days30.profit.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
            </div>
          </div>

          {/* AI COPILOT SECTION */}
          <div className="bg-gradient-to-r from-slate-800 to-indigo-900 rounded shadow-sm p-4 mb-4 text-white flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-300"/> Phase 11: AI Profit Copilot</h3>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ask AI: 'Which customers reduced profitability?' or 'Why did profit fall?'" 
                value={aiQuery} 
                onChange={e=>setAiQuery(e.target.value)}
                className="flex-1 text-xs p-2 rounded text-gray-800 focus:outline-none"
              />
              <button onClick={askCopilot} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold rounded flex items-center gap-1">
                <Search className="w-3 h-3"/> Analyze
              </button>
            </div>
            {aiResponse && (
              <div className="bg-indigo-950/50 p-3 rounded mt-2 text-xs border border-indigo-700/50">
                <p className="mb-2"><span className="font-bold text-indigo-300">Analysis:</span> {aiResponse.answer}</p>
                <p><span className="font-bold text-emerald-400">Recommended Action:</span> {aiResponse.action}</p>
              </div>
            )}
          </div>

          {/* TABS */}
          <div className="bg-white border border-gray-200 rounded shadow-sm flex flex-col h-[500px]">
            <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
              {['executive', 'products', 'customers', 'suppliers', 'batches', 'alerts'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)} 
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${activeTab === tab ? 'bg-white border-t-2 border-t-blue-600 text-blue-700 border-x border-x-gray-200 -mb-px' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              
              {/* TAB: EXECUTIVE */}
              {activeTab === 'executive' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-4">
                    {renderWaterfall()}
                    <div className="bg-red-50 p-4 border border-red-200 rounded">
                      <h3 className="font-bold text-sm text-red-800 mb-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Expiry Risk Engine</h3>
                      <p className="text-xs text-red-600 mb-1">Potential Financial Loss (Expired/Expiring &lt; 90 Days): <strong>₹{data.insights.expiryLossPotential.toLocaleString()}</strong></p>
                      <ul className="text-xs list-disc pl-4 text-red-700 mt-2">
                        {data.nearExpiry.map((n, i) => (
                          <li key={i}>{n.name} (Batch {n.batch}) - Expires in {n.daysLeft} days. Risk: ₹{n.riskValue}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="bg-white border border-gray-200 rounded p-4">
                      <h3 className="font-bold text-sm text-gray-700 mb-2">Fast Movers (High Vol & Margin)</h3>
                      <div className="flex flex-wrap gap-2">
                        {data.insights.fastMovers.length > 0 ? data.insights.fastMovers.map(m => (
                          <span key={m} className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded border border-emerald-200">{m}</span>
                        )) : <span className="text-xs text-gray-400">No fast movers detected.</span>}
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-4">
                      <h3 className="font-bold text-sm text-gray-700 mb-2">Dead Stock (Low Vol & High Stock)</h3>
                      <div className="flex flex-wrap gap-2">
                        {data.insights.deadStock.length > 0 ? data.insights.deadStock.map(m => (
                          <span key={m} className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-1 rounded border border-red-200">{m}</span>
                        )) : <span className="text-xs text-gray-400">No dead stock detected.</span>}
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-4">
                      <h3 className="font-bold text-sm text-gray-700 mb-2">Top 5 Invoices by Profit</h3>
                      <table className="w-full text-xs text-left">
                        <thead><tr className="border-b text-gray-500"><th className="pb-1">Bill No</th><th className="pb-1">Customer</th><th className="text-right pb-1">Net Profit</th></tr></thead>
                        <tbody>
                          {data.invoiceWise.slice(0,5).map((inv, i) => (
                            <tr key={i} className="border-b border-gray-50">
                              <td className="py-1">{inv.billNo}</td>
                              <td className="py-1 truncate max-w-[100px]" title={inv.customerName}>{inv.customerName}</td>
                              <td className="py-1 text-right font-bold text-emerald-600">₹{inv.netProfit.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PRODUCTS */}
              {activeTab === 'products' && (
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0">
                    <tr><th className="p-2 border-b">Product Name</th><th className="p-2 border-b">Qty Sold</th><th className="p-2 border-b">Revenue ₹</th><th className="p-2 border-b">True Net Profit ₹</th><th className="p-2 border-b">Net Margin %</th><th className="p-2 border-b">Inventory ROI %</th></tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 font-bold text-blue-700">{p.name}</td>
                        <td className="p-2">{p.qty}</td>
                        <td className="p-2">{p.revenue.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className={`p-2 font-black ${p.netProfit < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{p.netProfit.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className="p-2 font-bold">{p.marginPct.toFixed(1)}%</td>
                        <td className="p-2">{p.roi.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* TAB: CUSTOMERS */}
              {activeTab === 'customers' && (
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0">
                    <tr><th className="p-2 border-b">AI Class</th><th className="p-2 border-b">Customer Name</th><th className="p-2 border-b">Revenue ₹</th><th className="p-2 border-b">Gross Profit ₹</th><th className="p-2 border-b">True Net Profit ₹</th><th className="p-2 border-b">Net Margin %</th><th className="p-2 border-b">Outstanding Risk</th></tr>
                  </thead>
                  <tbody>
                    {data.customerWise.map((c, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                        <td className="p-2"><span className={`px-2 py-0.5 rounded font-black text-white text-[10px] ${c.aiClass === 'A' ? 'bg-emerald-500' : c.aiClass === 'B' ? 'bg-blue-500' : 'bg-red-500'}`}>{c.aiClass}</span></td>
                        <td className="p-2 font-bold">{c.name}</td>
                        <td className="p-2">{c.revenue.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className="p-2">{c.grossProfit.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className={`p-2 font-black ${c.netProfit < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{c.netProfit.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className="p-2 font-bold">{c.marginPct.toFixed(1)}%</td>
                        <td className="p-2 text-red-600 font-bold">{c.outstanding > 0 ? `₹${c.outstanding.toLocaleString()}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* TAB: SUPPLIERS */}
              {activeTab === 'suppliers' && (
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0">
                    <tr><th className="p-2 border-b">Supplier (Company)</th><th className="p-2 border-b">Total Purchase Value ₹</th><th className="p-2 border-b">Revenue Generated ₹</th><th className="p-2 border-b">Gross Value Generated ₹</th></tr>
                  </thead>
                  <tbody>
                    {data.supplierWise.map((s, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 font-bold">{s.name}</td>
                        <td className="p-2 text-red-600 font-bold">{s.purchaseValue.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className="p-2 text-emerald-600 font-bold">{s.revenue.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className="p-2 font-black">{s.profit.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* TAB: BATCHES */}
              {activeTab === 'batches' && (
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0">
                    <tr><th className="p-2 border-b">Item Name</th><th className="p-2 border-b">Batch Number</th><th className="p-2 border-b">Batch Revenue ₹</th><th className="p-2 border-b">Batch Profit ₹</th></tr>
                  </thead>
                  <tbody>
                    {data.batchWise.map((b, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 font-bold">{b.item}</td>
                        <td className="p-2"><span className="bg-gray-200 px-1 rounded text-gray-700">{b.batch}</span></td>
                        <td className="p-2 text-blue-600">{b.revenue.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className="p-2 font-black text-emerald-600">{b.profit.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              
              {/* TAB: ALERTS */}
              {activeTab === 'alerts' && (
                <div className="flex flex-col gap-3">
                  {data.bottomProducts.filter(p => p.netProfit < 0).map(p => (
                    <div key={p.name} className="bg-red-50 border border-red-200 text-red-800 p-3 rounded flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0"/>
                      <div className="text-sm">
                        <span className="font-bold">Loss Making Product:</span> {p.name} is operating at a Net Margin of {p.marginPct.toFixed(1)}%. True Loss: ₹{Math.abs(p.netProfit).toLocaleString(undefined, {maximumFractionDigits:0})}.
                      </div>
                    </div>
                  ))}
                  {data.customerWise.filter(c => c.netProfit < 0 || c.marginPct < 2).map(c => (
                    <div key={c.name} className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0"/>
                      <div className="text-sm">
                        <span className="font-bold">Customer Warning:</span> {c.name} is dragging down profitability. Margin: {c.marginPct.toFixed(1)}%. Outstanding: ₹{c.outstanding.toLocaleString()}. Consider reviewing trade discounts.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
