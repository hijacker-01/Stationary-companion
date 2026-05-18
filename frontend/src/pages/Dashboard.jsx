import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import axios from "axios";

const StatCard = ({ label, value, icon, color }) => (
  <div className={`rounded-2xl p-6 text-white ${color} shadow-lg`}>
    <div className="flex items-center justify-between mb-4">
      <span className="text-3xl">{icon}</span>
      <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Today</span>
    </div>
    <p className="text-4xl font-bold">{value}</p>
    <p className="text-sm mt-1 opacity-80">{label}</p>
  </div>
);

export default function Dashboard() {
  const [expiryCount, setExpiryCount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get("http://localhost:5000/api/items", { headers })
      .then(res => setItemCount(res.data.length))
      .catch(() => {});

    axios.get("http://localhost:5000/api/expiry?days=30", { headers })
      .then(res => setExpiryCount(res.data.length))
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Good morning, {user.name || "User"} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening in your business today.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard label="Total Items" value={itemCount} icon="📦" color="bg-blue-600" />
          <StatCard label="Expiring in 30 days" value={expiryCount} icon="⏰" color="bg-red-500" />
          <StatCard label="Today's Sales" value="₹0" icon="💰" color="bg-green-500" />
          <StatCard label="Pending Bills" value="0" icon="🧾" color="bg-orange-500" />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Add Item", icon: "➕", link: "/inventory" },
              { label: "Check Expiry", icon: "⏰", link: "/expiry" },
              { label: "New Bill", icon: "🧾", link: "/billing" },
              { label: "View Reports", icon: "📈", link: "/reports" },
            ].map((action) => (
              <a 
                key={action.label}
                href={action.link}
                className="flex flex-col items-center justify-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl py-5 gap-2 transition"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}