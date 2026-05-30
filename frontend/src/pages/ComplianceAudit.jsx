import { useState, useEffect } from "react";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { Search, ShieldAlert, History } from "lucide-react";

export default function ComplianceAudit() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="System Compliance Audit Trail" />
      <main className="flex-1 p-2 overflow-auto flex flex-col gap-2">
        <div className="bg-white border border-gray-300 p-2 shadow-sm flex items-center justify-between">
          <div className="flex gap-2">
            <input type="date" className="border border-gray-300 p-1.5 rounded" />
            <select className="border border-gray-300 p-1.5 rounded">
              <option>All Modules</option>
              <option>Sales</option>
              <option>Inventory</option>
            </select>
            <button className="bg-blue-600 text-white px-3 py-1.5 rounded font-bold flex items-center"><Search className="w-3 h-3 mr-1"/> Filter Logs</button>
          </div>
          <button className="bg-red-600 text-white px-3 py-1.5 rounded font-bold flex items-center"><ShieldAlert className="w-3 h-3 mr-1"/> Run Full Audit</button>
        </div>

        <div className="bg-white border border-gray-300 shadow-sm flex-1 flex items-center justify-center flex-col text-gray-400">
            <History className="w-12 h-12 mb-2 text-gray-300" />
            <p className="text-sm font-bold">Immutable Audit Trail Active</p>
            <p className="text-[10px]">All rule triggers and overrides are permanently recorded.</p>
        </div>
      </main>
      <BusinessFooter />
    </div>
  );
}
