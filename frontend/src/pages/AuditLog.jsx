import { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import PageLayout from "../components/PageLayout";
import DataState from "../components/DataState";

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await apiClient.get("/audit");
        setLogs(res.data?.rows || res.data?.items || res.data?.data || res.data || []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load audit log");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <PageLayout title="System Audit Log" subtitle="Chronological record of create, update, and delete actions">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <DataState
          loading={loading}
          error={error}
          empty={!logs.length}
          emptyProps={{ icon: "ClipboardList", title: "No audit entries", description: "System actions will appear here as they happen." }}
        >
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#1b4985] text-white">
                <th className="px-4 py-2.5 font-semibold">Time</th>
                <th className="px-4 py-2.5 font-semibold">User ID</th>
                <th className="px-4 py-2.5 font-semibold">Action</th>
                <th className="px-4 py-2.5 font-semibold">Entity</th>
                <th className="px-4 py-2.5 font-semibold">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-blue-50">
                  <td className="px-4 py-2.5 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-slate-700">{log.userId || "System"}</td>
                  <td className={`px-4 py-2.5 font-semibold ${log.action === 'create' ? 'text-emerald-600' : log.action === 'delete' ? 'text-rose-600' : 'text-amber-600'}`}>
                    {log.action.toUpperCase()}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">{log.entityType}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-600">{log.entityId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataState>
      </div>
    </PageLayout>
  );
}
