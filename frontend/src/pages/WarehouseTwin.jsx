import { useState, useEffect } from "react";
import axios from "../api/axios";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";
import { Grid3X3, Thermometer, Eye, Zap } from "lucide-react";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function WarehouseTwin() {
  const [bins, setBins] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [view, setView] = useState("capacity");
  const [zoneFilter, setZoneFilter] = useState("all");

  useEffect(() => {
    axios.get("/api/warehouse-twin/layout").then(r => setBins(r.data)).catch(() => {});
    axios.get("/api/warehouse-twin/picking").then(r => setTasks(r.data)).catch(() => {});
    axios.get("/api/warehouse-twin/optimize").then(r => setSuggestions(r.data?.suggestions || [])).catch(() => {});
  }, []);

  const filtered = zoneFilter === "all" ? bins : bins.filter(b => b.zone === zoneFilter);
  const zones = [...new Set(bins.map(b => b.zone))];
  const binColor = (b) => {
    if (view === "capacity") { const c = b.capacityUsed || 0; return c > 90 ? "bg-red-500 text-white" : c > 70 ? "bg-orange-400 text-white" : c > 30 ? "bg-yellow-300 text-black" : "bg-green-400 text-white"; }
    if (view === "heatmap") { const a = b.accessCount || 0; const max = Math.max(...bins.map(x => x.accessCount || 1)); const intensity = Math.round((a / max) * 255); return `text-white`; }
    return "bg-gray-200";
  };
  const heatmapStyle = (b) => {
    if (view !== "heatmap") return {};
    const a = b.accessCount || 0; const max = Math.max(...bins.map(x => x.accessCount || 1)); const ratio = a / max;
    return { backgroundColor: `rgb(${Math.round(ratio * 220)}, ${Math.round(50 + ratio * 50)}, ${Math.round(255 - ratio * 200)})` };
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="Digital Twin Warehouse" />
      <main className="flex-1 p-2 overflow-auto flex gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <div className="bg-white border border-gray-300 p-2 flex items-center gap-2 shadow-sm">
            <Grid3X3 className="w-4 h-4 text-blue-600"/>
            <span className="font-bold">Zone:</span><select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} className="border border-gray-300 p-1 rounded text-xs"><option value="all">All Zones</option>{zones.map(z => <option key={z} value={z}>{z}</option>)}</select>
            <span className="font-bold ml-2">View:</span>
            <button onClick={() => setView("capacity")} className={`px-2 py-0.5 rounded text-[10px] ${view === "capacity" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Capacity</button>
            <button onClick={() => setView("heatmap")} className={`px-2 py-0.5 rounded text-[10px] ${view === "heatmap" ? "bg-purple-600 text-white" : "bg-gray-200"}`}>Heatmap</button>
            <div className="ml-auto flex gap-2 text-[9px]"><span className="flex items-center"><span className="w-2 h-2 bg-green-400 rounded mr-0.5"></span>&lt;30%</span><span className="flex items-center"><span className="w-2 h-2 bg-yellow-300 rounded mr-0.5"></span>30-70%</span><span className="flex items-center"><span className="w-2 h-2 bg-orange-400 rounded mr-0.5"></span>70-90%</span><span className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded mr-0.5"></span>&gt;90%</span></div>
          </div>
          <div className="bg-white border border-gray-300 p-3 shadow-sm">
            <div className="grid grid-cols-6 gap-1">{filtered.map(b => (
              <div key={b.id} onClick={() => setSelected(b)} className={`cursor-pointer border border-gray-400 rounded p-1.5 text-center font-bold hover:ring-2 hover:ring-blue-400 transition-all ${selected?.id === b.id ? "ring-2 ring-blue-600" : ""} ${view === "heatmap" ? "text-white" : binColor(b)}`} style={heatmapStyle(b)}>
                <div className="text-[10px]">{b.bin_code}</div>
                <div className="text-[8px] opacity-80">{b.itemCount || 0} items</div>
                {view === "capacity" && <div className="text-[8px]">{b.capacityUsed}%</div>}
              </div>
            ))}</div>
          </div>
          <div className="bg-white border border-gray-300 shadow-sm"><div className="bg-gray-200 p-2 font-bold">Picking Tasks</div><table className="w-full text-left border-collapse"><thead className="bg-gray-100"><tr>{["Task#","Bill#","Customer","Items","Status","Assigned","Priority"].map(h => <th key={h} className="p-1.5 border-r border-gray-300">{h}</th>)}</tr></thead><tbody>{tasks.map(t => <tr key={t.id} className="border-b border-gray-200"><td className="p-1.5 border-r border-gray-300 font-bold">{t.taskNo}</td><td className="p-1.5 border-r border-gray-300">{t.billNo || "Not Entered"}</td><td className="p-1.5 border-r border-gray-300">{t.customerName || "Not Entered"}</td><td className="p-1.5 border-r border-gray-300">{t.itemCount}</td><td className="p-1.5 border-r border-gray-300"><span className="bg-yellow-100 text-yellow-700 px-1 rounded text-[9px] font-bold">{t.status}</span></td><td className="p-1.5 border-r border-gray-300">{t.assignedTo || "Not Entered"}</td><td className="p-1.5"><span className={`px-1 rounded text-[9px] font-bold ${t.priority === "urgent" ? "bg-red-600 text-white" : "bg-gray-200"}`}>{t.priority}</span></td></tr>)}{tasks.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-gray-400">No active picking tasks</td></tr>}</tbody></table></div>
        </div>
        <div className="w-56 flex flex-col gap-2">
          {selected ? <div className="bg-white border border-gray-300 shadow-sm p-3"><div className="font-bold text-blue-700 text-sm mb-2">{selected.bin_code}</div><div className="flex flex-col gap-1"><div className="flex justify-between"><span className="text-gray-500">Zone</span><span className="font-bold">{selected.zone}</span></div><div className="flex justify-between"><span className="text-gray-500">Rack</span><span className="font-bold">{selected.rack}</span></div><div className="flex justify-between"><span className="text-gray-500">Shelf</span><span className="font-bold">{selected.shelf}</span></div><div className="flex justify-between"><span className="text-gray-500">Capacity</span><span className="font-bold">{selected.capacityUsed}%</span></div><div className="flex justify-between"><span className="text-gray-500">Items</span><span className="font-bold">{selected.itemCount}</span></div><div className="flex justify-between items-center"><span className="text-gray-500"><Thermometer className="w-3 h-3 inline"/> Temp</span><span className="font-bold">{selected.temperature}°C</span></div><div className="flex justify-between"><span className="text-gray-500">Humidity</span><span className="font-bold">{selected.humidity}%</span></div><div className="flex justify-between"><span className="text-gray-500"><Eye className="w-3 h-3 inline"/> Accesses</span><span className="font-bold">{selected.accessCount}</span></div></div></div> : <div className="bg-white border border-gray-300 shadow-sm p-3 text-center text-gray-400"><Grid3X3 className="w-8 h-8 mx-auto mb-2 text-gray-300"/>Click a bin to inspect</div>}
          {suggestions.length > 0 && <div className="bg-purple-50 border border-purple-200 shadow-sm p-2"><div className="font-bold text-purple-700 mb-1 flex items-center"><Zap className="w-3 h-3 mr-1"/> AI Suggestions</div>{suggestions.map((s, i) => <div key={i} className="py-1 border-b border-purple-100 text-[10px] last:border-0"><div className="font-bold">{s.binCode}</div><div>{s.action}</div><div className="text-purple-500">{s.estimatedSaving}</div></div>)}</div>}
        </div>
      </main>
      <BusinessFooter />
    </div>
  );
}
