import React, { useState } from 'react';
import Header from '../components/Header';
import BusinessFooter from '../components/BusinessFooter';
import { Activity, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import axios from "../api/axios";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function HealthDashboard() {
  const [healthData, setHealthData] = useState({
    score: 82,
    stockHealth: { score: 90, status: 'Excellent', detail: 'Minimal dead stock, good turnover ratio.' },
    cashFlow: { score: 75, status: 'Fair', detail: 'Receivables delay avg 14 days. Payables on time.' },
    expiryRisk: { score: 60, status: 'Warning', detail: '₹12,500 worth of stock expiring in <30 days.' }
  });

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-gray-800 font-sans text-xs">
      <Header />
      <div className="flex-1 p-2 flex flex-col">
        <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-2">
          <h1 className="text-sm font-bold uppercase flex items-center gap-2">
            <Activity className="w-4 h-4" /> AI Business Health Dashboard
          </h1>
        </div>

        <div className="flex gap-2 flex-1">
          <div className="w-1/3 bg-white border border-gray-300 shadow-sm flex flex-col items-center justify-center p-4">
            <div className="text-gray-500 font-bold uppercase mb-4 text-center">Overall Health Score</div>
            <div className={`text-8xl font-black ${getScoreColor(healthData.score)}`}>
              {healthData.score}
            </div>
            <div className="text-gray-400 mt-2">out of 100</div>
          </div>

          <div className="w-2/3 flex flex-col gap-2">
            {[
              { title: 'Stock Health', data: healthData.stockHealth },
              { title: 'Cash Flow', data: healthData.cashFlow },
              { title: 'Expiry Risk', data: healthData.expiryRisk }
            ].map((metric, idx) => (
              <div key={idx} className="bg-white border border-gray-300 shadow-sm p-3 flex items-center">
                <div className="w-32 flex-shrink-0">
                  <div className="font-bold uppercase text-gray-600">{metric.title}</div>
                  <div className={`text-2xl font-bold ${getScoreColor(metric.data.score)}`}>{metric.data.score}/100</div>
                </div>
                <div className="flex-1 px-4 border-l border-gray-200">
                  <div className="flex items-center gap-1 font-semibold text-gray-700 mb-1">
                    {metric.data.score >= 80 ? <CheckCircle className="w-4 h-4 text-green-500"/> : 
                     metric.data.score >= 60 ? <AlertTriangle className="w-4 h-4 text-yellow-500"/> : 
                     <AlertTriangle className="w-4 h-4 text-red-500"/>}
                    {metric.data.status}
                  </div>
                  <div className="text-gray-500">{metric.data.detail}</div>
                </div>
                <button className="bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-1 flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-blue-500" tabIndex={0}>
                  <Info className="w-3 h-3" /> Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BusinessFooter />
    </div>
  );
}
