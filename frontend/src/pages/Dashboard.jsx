import { useEffect, useRef, useState } from "react";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import DataState from "../components/DataState";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { Link, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { ArrowUpRight, TrendingUp, AlertCircle, IndianRupee, AlertTriangle, ShieldAlert, Send, CheckCircle2, Circle } from "lucide-react";
import { toast } from "react-hot-toast";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });
const COLORS = ["#1b4985", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function Dashboard() {
  useKeyboardShortcuts();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const billsBtnRef           = useRef(null);

  // Default the keyboard selection to the Bills action on load.
  useEffect(() => { billsBtnRef.current?.focus(); }, []);

  useEffect(() => {
    axios.get("/dashboard")
      .then(r => setData(r.data))
      .catch((err) => { console.error('Dashboard fetch failed:', err); })
      .finally(() => setLoading(false));
  }, []);

  const d = data || {};

  const handleSendReminders = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/dashboard/reminders/send");
      toast.success(res.data.message || `Sent ${res.data.count} reminders.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reminders");
    } finally {
      setLoading(false);
    }
  };

  const rightActions = [
    { label: "CASH/CREDIT Bill", to: "/billing", ai: false },
    { label: "Purchase Challan", to: "/purchase-challan", ai: false },
    { label: "Sales DM (Challan)", to: "/sales-challan", ai: false },
    { label: "Purchase Bill", to: "/purchase-bills", ai: false },
    { label: "AI Smart Ledger / Scan", to: "/ai-ledger", ai: true },
    { label: "Receipt Voucher", to: "/receipt-voucher", ai: false },
    { label: "Payment Voucher", to: "/payment-voucher", ai: false },
    { label: "Cash & Bank Book", to: "/cashbook", ai: false },
    { label: "Ledger A/c", to: "/ledger", ai: false },
    { label: "Debtors (Receivable)", to: "/debtors", ai: false },
    { label: "Creditors (Payable)", to: "/creditors", ai: false },
    { label: "Stock Status", to: "/inventory", ai: false },
    { label: "Inventory Valuation", to: "/inventory-valuation", ai: false },
    { label: "AI Re-Order Agent", to: "/reorder-center", ai: true },
    { label: "AI Expiry Guard", to: "/expiry-guard", ai: true },
    { label: "Bill Tagging", to: "/outstanding-bills/tagging", ai: false },
    { label: "Dispatch Summary", to: "/dispatch-summary", ai: false },
    { label: "Sales & Purchase Reports", to: "/reports", ai: false },
    { label: "Profit Analytics", to: "/profit-analytics", ai: false },
    { label: "Todays Gross Profit", to: "/reports", ai: false },
    { label: "Exit", to: "/", action: () => { localStorage.clear(); navigate("/"); } },
  ];
  return (
    <div className="flex flex-col h-screen bg-[#e5e5e5] overflow-hidden font-sans">
      <Header />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        
        {/* Center Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#ffffff] p-6 shadow-[inset_0_0_10px_rgba(0,0,0,0.05)] relative flex flex-col">
          
          {/* Faded Background Logo Simulation */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
            <span className="font-extrabold text-[20rem]">M</span>
          </div>

          <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col gap-6">
            <DataState loading={loading} loadingLabel="Loading dashboard…">
              <>
                {/* KPI Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Today's Sales", value: `₹${(d.todaySales||0).toLocaleString("en-IN")}`, icon: ArrowUpRight, color: "text-[#1b4985]" },
                    { label: "Total Revenue", value: `₹${(d.totalRevenue||0).toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-emerald-600" },
                    { label: "Outstanding Dues", value: `₹${(d.totalOutstanding||0).toLocaleString("en-IN")}`, icon: AlertCircle, color: "text-rose-600" },
                    { label: "Today's Cash", value: `₹${(d.todayCash||0).toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-amber-600" },
                  ].map((c, i) => {
                    const Icon = c.icon;
                    return (
                      <div key={i} className="bg-white border border-gray-300 rounded shadow-sm p-4 flex flex-col hover:border-gray-400 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[11px] font-bold text-gray-500 uppercase">{c.label}</span>
                          <Icon className={`w-4 h-4 ${c.color}`} />
                        </div>
                        <span className="text-xl font-extrabold text-gray-800">{c.value}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Getting Started Checklist */}
                {(!d.totalRevenue || d.totalRevenue === 0) && (
                  <div className="bg-white border border-[#1b4985]/20 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-[#1b4985]/5 px-4 py-3 border-b border-[#1b4985]/10">
                      <h3 className="font-bold text-[#1b4985] text-sm">Getting Started Checklist</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Complete these steps to fully configure your ERP.</p>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: "Create your first Supplier", path: "/suppliers", done: d.totalRevenue > 0 },
                        { label: "Add Inventory Items", path: "/inventory", done: d.totalRevenue > 0 },
                        { label: "Create a Customer", path: "/customers", done: d.totalRevenue > 0 },
                        { label: "Generate your first Invoice", path: "/billing", done: d.totalRevenue > 0 }
                      ].map((task, idx) => (
                        <Link key={idx} to={task.path} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-colors group cursor-pointer">
                          {task.done ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-300 group-hover:text-[#1b4985]" />}
                          <span className={`text-sm font-semibold ${task.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Send Reminders Action */}
                {d.outstanding?.length > 0 && (
                  <div className="bg-white border border-rose-200 rounded shadow-sm p-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Payment Reminders</h3>
                      <p className="text-xs text-slate-500">You have {d.outstanding.length} customers with outstanding balances.</p>
                    </div>
                    <button 
                      onClick={handleSendReminders}
                      className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded text-sm font-semibold transition"
                    >
                      <Send className="w-4 h-4" /> Send Automated Reminders
                    </button>
                  </div>
                )}

                {/* Alerts */}
                {(d.lowStockCount > 0 || d.nearExpiryCount > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {d.lowStockCount > 0 && (
                      <div className="bg-[#fff8e1] border border-[#ffe082] rounded p-3 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#f57f17]" />
                        <div>
                          <p className="text-[13px] font-bold text-[#e65100]">{d.lowStockCount} Low Stock Items</p>
                          <Link to="/inventory" className="text-[11px] text-[#e65100] hover:underline">View Inventory</Link>
                        </div>
                      </div>
                    )}
                    {d.nearExpiryCount > 0 && (
                      <div className="bg-[#ffebee] border border-[#ef9a9a] rounded p-3 flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-[#c62828]" />
                        <div>
                          <p className="text-[13px] font-bold text-[#b71c1c]">{d.nearExpiryCount} Near Expiry Items</p>
                          <Link to="/expiry" className="text-[11px] text-[#b71c1c] hover:underline">View Expiry Box</Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-300 rounded shadow-sm p-4">
                    <h3 className="text-[13px] font-bold text-[#1b4985] mb-4 border-b border-gray-200 pb-2">Monthly Sales Trend</h3>
                    {(d.monthlySales || []).length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={d.monthlySales}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#757575' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#757575' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                          <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Sales"]} />
                          <Line type="monotone" dataKey="total" stroke="#1b4985" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">No data available</div>
                    )}
                  </div>
                  
                  <div className="bg-white border border-gray-300 rounded shadow-sm p-4">
                    <h3 className="text-[13px] font-bold text-[#1b4985] mb-4 border-b border-gray-200 pb-2">Top Items by Revenue</h3>
                    {(d.topItems || []).length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={d.topItems} dataKey="sales" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name }) => name.slice(0, 10)}>
                            {(d.topItems || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={v => `₹${v.toLocaleString("en-IN")}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">No data available</div>
                    )}
                  </div>
                </div>

                {/* Data Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-10">
                  <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden flex flex-col">
                    <h3 className="text-[13px] font-bold text-[#1b4985] p-3 border-b border-gray-200 bg-slate-50">Top Customers (Outstanding)</h3>
                    <div className="overflow-auto flex-1">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-600 border-b border-gray-200">
                          <tr>
                            <th className="p-2 font-semibold">Customer</th>
                            <th className="p-2 font-semibold">Contact</th>
                            <th className="p-2 text-right font-semibold">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.outstanding?.slice(0, 5).map(c => (
                            <tr key={c.id} className="border-b border-gray-100 hover:bg-slate-50">
                              <td className="p-2 font-bold text-slate-800">{c.name}</td>
                              <td className="p-2 text-slate-500">{c.phone || '-'}</td>
                              <td className="p-2 text-right font-bold text-rose-600">₹{c.balance.toLocaleString("en-IN")}</td>
                            </tr>
                          ))}
                          {!d.outstanding?.length && <tr><td colSpan="3" className="p-4 text-center text-slate-400">No outstanding dues</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden flex flex-col">
                    <h3 className="text-[13px] font-bold text-[#1b4985] p-3 border-b border-gray-200 bg-slate-50">Critical Low Stock</h3>
                    <div className="overflow-auto flex-1">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-600 border-b border-gray-200">
                          <tr>
                            <th className="p-2 font-semibold">Item Name</th>
                            <th className="p-2 text-center font-semibold">Qty</th>
                            <th className="p-2 text-right font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.lowStock?.slice(0, 5).map(item => (
                            <tr key={item.id} className="border-b border-gray-100 hover:bg-slate-50">
                              <td className="p-2 font-bold text-slate-800">{item.name}</td>
                              <td className="p-2 text-center font-bold text-amber-600">{item.stock_qty}</td>
                              <td className="p-2 text-right">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.stock_qty === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {item.stock_qty === 0 ? 'Out of Stock' : 'Low Stock'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {!d.lowStock?.length && <tr><td colSpan="3" className="p-4 text-center text-slate-400">All items sufficiently stocked</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            </DataState>
          </div>
        </main>

        {/* Right Action Panel */}
        <aside 
          className="w-56 h-full bg-[#e4e4e4] border-l border-gray-300 flex flex-col shrink-0 overflow-y-auto shadow-[-2px_0_4px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-inset focus:ring-2 focus:ring-[#1b4985]"
          tabIndex={0}
          data-section="right-sidebar"
          onKeyDown={(e) => {
            const buttons = Array.from(e.currentTarget.querySelectorAll('button'));
            if (buttons.length === 0) return;
            
            const activeBtn = document.activeElement;
            let idx = buttons.indexOf(activeBtn);
            
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              idx = (idx < buttons.length - 1) ? idx + 1 : 0;
              buttons[idx].focus();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              idx = (idx > 0) ? idx - 1 : buttons.length - 1;
              buttons[idx].focus();
            } else if (e.key === 'ArrowLeft') {
              // Usually left arrow goes back to main content
              e.preventDefault();
              document.querySelector('main')?.focus();
            }
          }}
        >
          <div className="flex flex-col w-full">
            {rightActions.map((action, i) => (
              <button
                key={i}
                ref={i === 0 ? billsBtnRef : null}
                onClick={action.action ? action.action : () => navigate(action.to)}
                className={`w-full py-2 px-3 text-center border-b border-gray-300 transition-colors shadow-sm focus:outline-none focus:bg-[#1b4985] focus:text-white
                  ${action.ai ? 'bg-[#f3e5f5] text-[#4a148c] font-extrabold hover:bg-[#e1bee7]' : 'bg-[#f4f4f4] text-gray-800 font-medium hover:bg-white'}
                  text-[12px]
                `}
              >
                {action.label}
              </button>
            ))}
          </div>
          <div className="text-center py-1 mt-auto bg-[#d6d6d6] border-t border-gray-300 font-bold text-[11px] text-gray-700">
            Update Dashboard
          </div>
        </aside>
      </div>

      <BusinessFooter />
    </div>
  );
}