import { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import Sidebar from "../components/Sidebar";

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await apiClient.get("/audit");
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8">System Audit Log</h1>
          
          <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="pb-3">Time</th>
                    <th className="pb-3">User ID</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Entity</th>
                    <th className="pb-3">Entity ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-750/50">
                      <td className="py-3 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-3">{log.userId || "System"}</td>
                      <td className={`py-3 font-medium ${log.action === 'create' ? 'text-emerald-400' : log.action === 'delete' ? 'text-rose-400' : 'text-amber-400'}`}>
                        {log.action.toUpperCase()}
                      </td>
                      <td className="py-3">{log.entityType}</td>
                      <td className="py-3 font-mono">{log.entityId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
