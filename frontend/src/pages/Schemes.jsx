import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { Gift, Percent, Plus, Save, X, Search, CheckSquare, Square } from "lucide-react";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function Schemes() {
  const [schemes, setSchemes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState("buy_get");
  const [buyQty, setBuyQty] = useState("");
  const [freeQty, setFreeQty] = useState("");
  const [discount, setDiscount] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    // Simulated fetch
    const fetchSchemes = async () => {
      try {
        const { data } = await axios.get("/api/schemes");
        setSchemes(data);
      } catch (err) {
        setSchemes([
          { id: 'SCH-001', name: 'Monsoon Bonanza Paracetamol', type: 'buy_get', details: 'Buy 10 Get 2 Free', status: 'Active' },
          { id: 'SCH-002', name: 'Clearance Sale Antibiotics', type: 'discount', details: '15% Flat Off', status: 'Active' },
          { id: 'SCH-003', name: 'Winter Special Cough Syrup', type: 'buy_get', details: 'Buy 5 Get 1 Free', status: 'Inactive' },
        ]);
      }
    };
    fetchSchemes();
  }, []);

  const handleSave = () => {
    // Simulated save
    const newScheme = {
      id: `SCH-00${schemes.length + 1}`,
      name,
      type,
      details: type === 'buy_get' ? `Buy ${buyQty} Get ${freeQty} Free` : `${discount}% Flat Off`,
      status: active ? 'Active' : 'Inactive'
    };
    setSchemes([...schemes, newScheme]);
    setShowForm(false);
    // Reset form
    setName(""); setBuyQty(""); setFreeQty(""); setDiscount(""); setActive(true);
  };

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter') action();
    if (e.key === 'Escape') setShowForm(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="Promotion Schemes & Offers" />
      
      <main className="flex-1 p-2 flex flex-col gap-2 overflow-hidden">
        {/* Actions Bar */}
        <div className="bg-white border border-gray-300 p-1.5 flex items-center shadow-sm">
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-3 py-1 flex items-center shadow hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-800"
            tabIndex={1}
          >
            <Plus className="w-3 h-3 mr-1" /> New Scheme (F2)
          </button>
          <div className="ml-auto flex items-center border border-gray-300 bg-white px-2">
            <Search className="w-3 h-3 text-gray-400 mr-1" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="border-none focus:outline-none py-1 text-xs w-48"
              tabIndex={2}
            />
          </div>
        </div>

        {/* Layout: Form + Table */}
        <div className="flex flex-1 gap-2 overflow-hidden">
          {/* Table Area */}
          <section className={`bg-white border border-gray-300 shadow-sm flex flex-col ${showForm ? 'w-2/3' : 'w-full'}`}>
            <div className="bg-gray-200 border-b border-gray-300 p-2 font-bold flex items-center">
              <Gift className="w-4 h-4 mr-2" /> Active Schemes
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 sticky top-0 border-b border-gray-300">
                  <tr>
                    <th className="p-1.5 border-r border-gray-300 w-24">Scheme ID</th>
                    <th className="p-1.5 border-r border-gray-300">Scheme Name</th>
                    <th className="p-1.5 border-r border-gray-300 w-24 text-center">Type</th>
                    <th className="p-1.5 border-r border-gray-300">Details</th>
                    <th className="p-1.5 border-r border-gray-300 w-20 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schemes.map(s => (
                    <tr key={s.id} className="border-b border-gray-200 hover:bg-yellow-50 cursor-pointer">
                      <td className="p-1.5 border-r border-gray-300 font-mono text-gray-600">{s.id}</td>
                      <td className="p-1.5 border-r border-gray-300 font-bold">{s.name}</td>
                      <td className="p-1.5 border-r border-gray-300 text-center">
                        {s.type === 'buy_get' ? <Gift className="w-3 h-3 inline text-green-600"/> : <Percent className="w-3 h-3 inline text-orange-600"/>}
                      </td>
                      <td className="p-1.5 border-r border-gray-300">{s.details}</td>
                      <td className={`p-1.5 border-r border-gray-300 text-center font-bold ${s.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                        {s.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Form Area */}
          {showForm && (
            <section className="w-1/3 bg-white border border-gray-300 shadow-sm flex flex-col">
              <div className="bg-blue-800 text-white p-2 font-bold flex items-center justify-between">
                <span>Create Scheme</span>
                <button onClick={() => setShowForm(false)} className="hover:text-red-300" tabIndex={-1}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-3 flex flex-col gap-3 flex-1 overflow-auto bg-gray-50">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-gray-700">Scheme Name</label>
                  <input 
                    type="text" 
                    value={name} onChange={e => setName(e.target.value)}
                    className="border border-gray-400 p-1 focus:outline-none focus:border-blue-500 focus:bg-yellow-50"
                    autoFocus
                    tabIndex={3}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-gray-700">Scheme Type</label>
                  <select 
                    value={type} onChange={e => setType(e.target.value)}
                    className="border border-gray-400 p-1 focus:outline-none focus:border-blue-500 focus:bg-yellow-50"
                    tabIndex={4}
                  >
                    <option value="buy_get">Buy X Get Y Free</option>
                    <option value="discount">Flat Discount %</option>
                  </select>
                </div>

                {type === 'buy_get' ? (
                  <div className="flex gap-2">
                    <div className="flex flex-col gap-1 w-1/2">
                      <label className="font-semibold text-gray-700">Buy Qty</label>
                      <input 
                        type="number" value={buyQty} onChange={e => setBuyQty(e.target.value)}
                        className="border border-gray-400 p-1 focus:outline-none focus:border-blue-500 focus:bg-yellow-50"
                        tabIndex={5}
                      />
                    </div>
                    <div className="flex flex-col gap-1 w-1/2">
                      <label className="font-semibold text-gray-700">Free Qty</label>
                      <input 
                        type="number" value={freeQty} onChange={e => setFreeQty(e.target.value)}
                        className="border border-gray-400 p-1 focus:outline-none focus:border-blue-500 focus:bg-yellow-50"
                        tabIndex={6}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-gray-700">Discount %</label>
                    <input 
                      type="number" value={discount} onChange={e => setDiscount(e.target.value)}
                      className="border border-gray-400 p-1 focus:outline-none focus:border-blue-500 focus:bg-yellow-50"
                      tabIndex={5}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2 cursor-pointer" onClick={() => setActive(!active)}>
                  {active ? <CheckSquare className="w-4 h-4 text-blue-600"/> : <Square className="w-4 h-4 text-gray-400"/>}
                  <span className="font-semibold">Is Active</span>
                </div>
              </div>

              <div className="p-2 bg-gray-200 border-t border-gray-300 flex justify-end gap-2">
                <button 
                  onClick={() => setShowForm(false)}
                  className="px-4 py-1 border border-gray-400 bg-white hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  tabIndex={8}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  onKeyDown={e => handleKeyDown(e, handleSave)}
                  className="px-4 py-1 border border-blue-700 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-900 flex items-center"
                  tabIndex={7}
                >
                  <Save className="w-3 h-3 mr-1" /> Save
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      <BusinessFooter />
    </div>
  );
}
