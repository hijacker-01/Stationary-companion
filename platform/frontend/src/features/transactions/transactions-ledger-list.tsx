import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function TransactionsLedgerList({ companyId, branchId }: { companyId: string; branchId: string }) {
  const purchase = useQuery({
    queryKey: ["purchase-invoices", companyId, branchId],
    queryFn: async () => (await apiClient.get("/queries/purchase-invoices", { params: { company_id: companyId, branch_id: branchId } })).data,
    enabled: Boolean(companyId && branchId),
  });

  const sales = useQuery({
    queryKey: ["sales-invoices", companyId, branchId],
    queryFn: async () => (await apiClient.get("/queries/sales-invoices", { params: { company_id: companyId, branch_id: branchId } })).data,
    enabled: Boolean(companyId && branchId),
  });

  return (
    <div className="grid grid-cols-2 gap-3">
      <section className="border border-slate-800 rounded p-2 bg-slate-900">
        <h3 className="text-xs font-semibold mb-2">Latest Purchase Invoices</h3>
        <div className="space-y-1 text-xs">
          {(purchase.data?.items || []).map((x: any) => <div key={x.id}>{x.invoice_no} - {x.total_amount}</div>)}
        </div>
      </section>
      <section className="border border-slate-800 rounded p-2 bg-slate-900">
        <h3 className="text-xs font-semibold mb-2">Latest Sales Invoices</h3>
        <div className="space-y-1 text-xs">
          {(sales.data?.items || []).map((x: any) => <div key={x.id}>{x.invoice_no} - {x.total_amount}</div>)}
        </div>
      </section>
    </div>
  );
}
