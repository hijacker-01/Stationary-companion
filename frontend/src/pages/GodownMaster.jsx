import { useState } from "react";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { Warehouse, Plus, Edit, Trash2 } from "lucide-react";

export default function GodownMaster() {
  const [godowns, setGodowns] = useState([
    { id: 1, name: "Main Shop Floor", address: "Front Store", capacity: 5000, isDefault: true },
    { id: 2, name: "Basement Godown", address: "Building B", capacity: 15000, isDefault: false }
  ]);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="Godown Master" />
      <main className="flex-1 p-4 overflow-auto max-w-5xl mx-auto w-full">
        <div className="bg-white border border-gray-300 shadow-sm">
          <div className="bg-[#1b4985] text-white p-2 font-bold flex justify-between items-center">
            <span className="flex items-center"><Warehouse className="w-4 h-4 mr-2"/> Manage Godowns & Locations</span>
            <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded flex items-center"><Plus className="w-3 h-3 mr-1"/> New Godown</button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                {["Godown Name","Address","Capacity","Status","Actions"].map(h => <th key={h} className="p-2 border-r border-gray-300">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {godowns.map(g => (
                <tr key={g.id} className="border-b border-gray-200 hover:bg-blue-50">
                  <td className="p-2 border-r border-gray-300 font-bold flex items-center">
                    {g.name}
                    {g.isDefault && <span className="ml-2 bg-green-100 text-green-700 px-1 py-0.5 rounded text-[9px]">Default</span>}
                  </td>
                  <td className="p-2 border-r border-gray-300">{g.address}</td>
                  <td className="p-2 border-r border-gray-300">{g.capacity.toLocaleString()} Units</td>
                  <td className="p-2 border-r border-gray-300"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">Active</span></td>
                  <td className="p-2 flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4"/></button>
                    <button className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 shadow-lg w-96">
            <div className="bg-[#1b4985] text-white p-2 font-bold">Add Godown</div>
            <div className="p-4 flex flex-col gap-3">
              <input placeholder="Godown Name" className="border border-gray-300 p-2 rounded outline-none focus:border-blue-500" />
              <input placeholder="Address" className="border border-gray-300 p-2 rounded outline-none focus:border-blue-500" />
              <input type="number" placeholder="Capacity (Units)" className="border border-gray-300 p-2 rounded outline-none focus:border-blue-500" />
              <div className="flex gap-2 justify-end mt-2">
                <button onClick={() => setShowModal(false)} className="bg-gray-300 px-4 py-2 rounded font-bold hover:bg-gray-400">Cancel</button>
                <button onClick={() => setShowModal(false)} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">Save Godown</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <BusinessFooter />
    </div>
  );
}
