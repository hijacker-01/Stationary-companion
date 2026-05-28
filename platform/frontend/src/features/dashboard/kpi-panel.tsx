import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function KpiPanel({ companyId, branchId }: { companyId: string; branchId: string }) {
  const { data } = useQuery({
    queryKey: ["kpis", companyId, branchId],
    queryFn: async () => (await apiClient.get("/analytics/kpis", { params: { company_id: companyId, branch_id: branchId } })).data,
    enabled: Boolean(companyId && branchId),
    refetchInterval: 15000,
  });

  return (
    <div className="grid grid-cols-5 gap-2">
      <div className="border border-slate-800 rounded p-2 bg-slate-900">Sales: {data?.total_sales ?? 0}</div>
      <div className="border border-slate-800 rounded p-2 bg-slate-900">Purchases: {data?.total_purchases ?? 0}</div>
      <div className="border border-slate-800 rounded p-2 bg-slate-900">Margin: {data?.gross_margin ?? 0}</div>
      <div className="border border-slate-800 rounded p-2 bg-slate-900">Low Stock: {data?.low_stock_count ?? 0}</div>
      <div className="border border-slate-800 rounded p-2 bg-slate-900">Near Expiry: {data?.near_expiry_count ?? 0}</div>
    </div>
  );
}
