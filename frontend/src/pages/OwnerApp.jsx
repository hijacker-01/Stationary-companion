import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import BusinessFooter from '../components/BusinessFooter';
import { TrendingUp, DollarSign, Package, PieChart, Bell, RefreshCw } from 'lucide-react';
import axios from 'axios';

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function OwnerApp() {
  const [kpis, setKpis] = useState({
    sales: 452000,
    cash: 125000,
    stockValue: 980000,
    profit: 85000
  });

  const [notifications, setNotifications] = useState([
    { id: 1, time: '10:45 AM', message: 'Large invoice INV-0092 generated for Apollo Hospitals (₹45,000)' },
    { id: 2, time: '10:30 AM', message: 'Low stock alert: Paracetamol 500mg' },
    { id: 3, time: '09:15 AM', message: 'Bank reconciliation completed successfully' },
    { id: 4, time: '08:00 AM', message: 'System backup completed' }
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-gray-800 font-sans text-xs">
      <Header />
      <div className="flex-1 p-2">
        <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-2">
          <h1 className="text-sm font-bold uppercase flex items-center gap-2">
            <PieChart className="w-4 h-4" /> Owner Dashboard
          </h1>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 bg-white border border-gray-300 px-2 py-1 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" tabIndex={0}>
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-white border border-gray-300 p-3 flex flex-col shadow-sm">
            <div className="flex justify-between items-center text-gray-500 mb-1">
              <span className="font-semibold uppercase tracking-wider">Today's Sales</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">₹{kpis.sales.toLocaleString()}</span>
          </div>
          <div className="bg-white border border-gray-300 p-3 flex flex-col shadow-sm">
            <div className="flex justify-between items-center text-gray-500 mb-1">
              <span className="font-semibold uppercase tracking-wider">Cash in Hand</span>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">₹{kpis.cash.toLocaleString()}</span>
          </div>
          <div className="bg-white border border-gray-300 p-3 flex flex-col shadow-sm">
            <div className="flex justify-between items-center text-gray-500 mb-1">
              <span className="font-semibold uppercase tracking-wider">Stock Value</span>
              <Package className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">₹{kpis.stockValue.toLocaleString()}</span>
          </div>
          <div className="bg-white border border-gray-300 p-3 flex flex-col shadow-sm">
            <div className="flex justify-between items-center text-gray-500 mb-1">
              <span className="font-semibold uppercase tracking-wider">Est. Profit</span>
              <PieChart className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">₹{kpis.profit.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-300 shadow-sm flex flex-col h-64">
          <div className="bg-gray-200 border-b border-gray-300 px-2 py-1 font-semibold flex items-center gap-1">
            <Bell className="w-3 h-3 text-red-500" /> Push Notifications & Alerts
          </div>
          <div className="flex-1 overflow-auto p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="p-1 w-24 font-semibold text-gray-600">Time</th>
                  <th className="p-1 font-semibold text-gray-600">Message</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notif) => (
                  <tr key={notif.id} className="border-b border-gray-100 hover:bg-yellow-50 cursor-pointer">
                    <td className="p-1 text-gray-500 align-top">{notif.time}</td>
                    <td className="p-1 text-gray-800">{notif.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <BusinessFooter />
    </div>
  );
}
