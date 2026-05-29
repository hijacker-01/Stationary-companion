import React, { useState } from 'react';
import Header from '../components/Header';
import BusinessFooter from '../components/BusinessFooter';
import { ShieldAlert, Search, PackageX, Users } from 'lucide-react';
import axios from 'axios';

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function DrugRecall() {
  const [batchId, setBatchId] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  
  // Mock data for recall results
  const [recallData, setRecallData] = useState({
    item: 'Azithromycin 500mg Tab',
    manufacturer: 'PharmaCorp Ltd',
    currentStock: [
      { bin: 'A-12-04', qty: 150, expiry: '2025-10-01' },
      { bin: 'B-05-01', qty: 50, expiry: '2025-10-01' }
    ],
    affectedCustomers: [
      { invoice: 'INV-2023-1001', date: '2023-09-15', customer: 'City Hospital', phone: '9876543210', qty: 500 },
      { invoice: 'INV-2023-1045', date: '2023-09-20', customer: 'Dr. Smith Clinic', phone: '9876543211', qty: 100 },
      { invoice: 'INV-2023-1102', date: '2023-09-25', customer: 'Central Pharmacy', phone: '9876543212', qty: 250 }
    ]
  });

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (batchId.trim().length > 0) {
        // Mocking an API call
        setHasSearched(true);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setHasSearched(false);
      setBatchId('');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-gray-800 font-sans text-xs" onKeyDown={handleKeyDown}>
      <Header />
      <div className="flex-1 p-2 flex flex-col">
        <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-2 bg-red-50 p-2 rounded-sm border-l-4 border-l-red-600">
          <h1 className="text-sm font-bold uppercase flex items-center gap-2 text-red-800">
            <ShieldAlert className="w-5 h-5" /> Critical Module: Drug Recall Tracker
          </h1>
        </div>

        <div className="bg-white border border-gray-300 p-3 mb-2 shadow-sm flex items-end gap-3">
          <div className="flex flex-col">
            <label className="font-semibold text-gray-600 mb-1">Recalled Batch ID</label>
            <input 
              type="text" 
              className="border border-gray-300 px-2 py-1 w-64 focus:outline-none focus:border-red-500 uppercase font-mono"
              placeholder="e.g. BATCH-9921"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value.toUpperCase())}
              onKeyDown={handleSearch}
              autoFocus
              tabIndex={0}
            />
          </div>
          <button 
            className="bg-red-600 text-white px-4 py-1 flex items-center gap-1 font-bold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            onClick={handleSearch}
            tabIndex={0}
          >
            <Search className="w-4 h-4" /> TRACE BATCH
          </button>
        </div>

        {hasSearched && (
          <div className="flex gap-2 flex-1 overflow-hidden">
            <div className="w-1/3 flex flex-col gap-2">
              <div className="bg-white border border-gray-300 shadow-sm flex flex-col flex-1">
                <div className="bg-red-100 border-b border-gray-300 px-2 py-1 font-bold text-red-800 flex items-center gap-1">
                  <PackageX className="w-4 h-4" /> Current Stock to Quarantine
                </div>
                <div className="p-2 border-b border-gray-200 bg-gray-50">
                  <div className="font-bold text-sm">{recallData.item}</div>
                  <div className="text-gray-500">Mfr: {recallData.manufacturer}</div>
                </div>
                <div className="flex-1 overflow-auto p-2">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="p-1 font-semibold">Location / Bin</th>
                        <th className="p-1 font-semibold text-right">Qty</th>
                        <th className="p-1 font-semibold">Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recallData.currentStock.map((stock, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="p-1 font-mono text-red-600 font-bold">{stock.bin}</td>
                          <td className="p-1 text-right font-bold">{stock.qty}</td>
                          <td className="p-1">{stock.expiry}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="w-2/3 flex flex-col gap-2">
              <div className="bg-white border border-gray-300 shadow-sm flex flex-col flex-1">
                <div className="bg-red-100 border-b border-gray-300 px-2 py-1 font-bold text-red-800 flex items-center gap-1">
                  <Users className="w-4 h-4" /> Affected Customers (To Notify)
                </div>
                <div className="flex-1 overflow-auto p-2">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-200 border-b border-gray-300">
                        <th className="p-1.5 font-semibold border-r border-gray-300">Invoice No</th>
                        <th className="p-1.5 font-semibold border-r border-gray-300">Date</th>
                        <th className="p-1.5 font-semibold border-r border-gray-300">Customer Name</th>
                        <th className="p-1.5 font-semibold border-r border-gray-300">Contact</th>
                        <th className="p-1.5 font-semibold text-right">Qty Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recallData.affectedCustomers.map((cust, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-yellow-50">
                          <td className="p-1.5 border-r border-gray-200 text-blue-600 underline cursor-pointer">{cust.invoice}</td>
                          <td className="p-1.5 border-r border-gray-200">{cust.date}</td>
                          <td className="p-1.5 border-r border-gray-200 font-bold">{cust.customer}</td>
                          <td className="p-1.5 border-r border-gray-200">{cust.phone}</td>
                          <td className="p-1.5 text-right font-bold text-red-600">{cust.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-2 border-t border-gray-300 bg-gray-50 flex justify-end">
                  <button className="bg-gray-800 text-white px-3 py-1 font-bold hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400" tabIndex={0}>
                    Export List to CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <BusinessFooter />
    </div>
  );
}
