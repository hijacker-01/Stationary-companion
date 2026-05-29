import React, { useState, useEffect } from "react";
import axios from "axios";
import { Package, MapPin, Grid, Layers, Archive, ArrowRight, ArrowLeft } from "lucide-react";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function Warehouse() {
  const [hierarchy, setHierarchy] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    // Simulate API fetch
    const fetchWMS = async () => {
      try {
        const { data } = await axios.get("/api/wms/dashboard", { headers: headers() });
        setHierarchy(data.hierarchy);
        setPendingTasks(data.pendingTasks);
      } catch (err) {
        // Fallback dummy data
        setHierarchy([
          {
            id: 'w1', type: 'warehouse', name: 'Main Depot',
            children: [
              {
                id: 'z1', type: 'zone', name: 'Zone A (Cold)',
                children: [
                  {
                    id: 'r1', type: 'rack', name: 'Rack 1',
                    children: [
                      { id: 's1', type: 'shelf', name: 'Shelf 1', children: [{ id: 'b1', type: 'bin', name: 'Bin 101' }] }
                    ]
                  }
                ]
              }
            ]
          }
        ]);
        setPendingTasks([
          { id: 1, type: 'PUT_AWAY', item: 'Paracetamol 500mg', qty: 500, from: 'Receiving Dock', to: 'Zone A - Bin 101', status: 'Pending' },
          { id: 2, type: 'PICKING', item: 'Amoxicillin 250mg', qty: 120, from: 'Zone B - Bin 204', to: 'Packing Station 1', status: 'Pending' }
        ]);
      }
    };
    fetchWMS();
  }, []);

  const renderIcon = (type) => {
    switch(type) {
      case 'warehouse': return <Package className="w-3 h-3 mr-1" />;
      case 'zone': return <MapPin className="w-3 h-3 mr-1" />;
      case 'rack': return <Grid className="w-3 h-3 mr-1" />;
      case 'shelf': return <Layers className="w-3 h-3 mr-1" />;
      case 'bin': return <Archive className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  const renderTree = (nodes) => {
    return (
      <ul className="pl-4 border-l border-gray-300 ml-2 mt-1">
        {nodes.map(node => (
          <li key={node.id} className="mt-1">
            <div 
              className={`flex items-center text-xs p-1 cursor-pointer hover:bg-gray-200 ${selectedNode === node.id ? 'bg-gray-300 font-bold' : ''}`}
              onClick={() => setSelectedNode(node.id)}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setSelectedNode(node.id); }}
            >
              {renderIcon(node.type)}
              {node.name}
            </div>
            {node.children && node.children.length > 0 && renderTree(node.children)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="Warehouse Management" />
      
      <main className="flex-1 p-2 flex gap-2 overflow-hidden">
        {/* Left: Hierarchy Tree */}
        <section className="w-1/3 bg-white border border-gray-300 shadow-sm flex flex-col">
          <div className="bg-gray-200 border-b border-gray-300 p-2 font-bold flex justify-between items-center">
            <span>Location Hierarchy</span>
            <span className="text-[10px] text-gray-500">Warehouse &gt; Zone &gt; Rack &gt; Shelf &gt; Bin</span>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {hierarchy.map(node => (
              <div key={node.id}>
                <div 
                  className={`flex items-center text-xs p-1 cursor-pointer hover:bg-gray-200 ${selectedNode === node.id ? 'bg-gray-300 font-bold' : ''}`}
                  onClick={() => setSelectedNode(node.id)}
                  tabIndex={0}
                >
                  {renderIcon(node.type)} {node.name}
                </div>
                {node.children && renderTree(node.children)}
              </div>
            ))}
          </div>
        </section>

        {/* Right: Tasks */}
        <section className="w-2/3 bg-white border border-gray-300 shadow-sm flex flex-col">
          <div className="bg-gray-200 border-b border-gray-300 p-2 font-bold">
            Pending Tasks (Put Away / Picking)
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 sticky top-0 border-b border-gray-300">
                <tr>
                  <th className="p-1 border-r border-gray-300 w-16">Task ID</th>
                  <th className="p-1 border-r border-gray-300 w-20">Type</th>
                  <th className="p-1 border-r border-gray-300">Item</th>
                  <th className="p-1 border-r border-gray-300 w-16 text-right">Qty</th>
                  <th className="p-1 border-r border-gray-300">Source</th>
                  <th className="p-1 border-r border-gray-300">Destination</th>
                  <th className="p-1 w-20 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingTasks.map(task => (
                  <tr key={task.id} className="border-b border-gray-200 hover:bg-yellow-50">
                    <td className="p-1 border-r border-gray-300">{task.id}</td>
                    <td className="p-1 border-r border-gray-300 font-bold text-blue-700">
                      {task.type === 'PUT_AWAY' ? <span className="flex items-center"><ArrowRight className="w-3 h-3 mr-1 text-green-600"/> PUT</span> : <span className="flex items-center"><ArrowLeft className="w-3 h-3 mr-1 text-orange-600"/> PICK</span>}
                    </td>
                    <td className="p-1 border-r border-gray-300">{task.item}</td>
                    <td className="p-1 border-r border-gray-300 text-right">{task.qty}</td>
                    <td className="p-1 border-r border-gray-300">{task.from}</td>
                    <td className="p-1 border-r border-gray-300">{task.to}</td>
                    <td className="p-1 text-center">
                      <button className="bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-800" tabIndex={0}>
                        Confirm
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingTasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500">No pending tasks</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <BusinessFooter />
    </div>
  );
}
