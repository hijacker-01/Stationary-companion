import { useState } from "react";
import { AppLayout } from "@/app/layout";
import { KpiPanel } from "./kpi-panel";
import { AiOpsPanel } from "@/features/ai/ai-ops-panel";

export function DashboardPage() {
  const [companyId, setCompanyId] = useState("");
  const [branchId, setBranchId] = useState("");

  return (
    <AppLayout>
      <section className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-1" placeholder="Company ID" />
          <input value={branchId} onChange={(e) => setBranchId(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-1" placeholder="Branch ID" />
        </div>
        <KpiPanel companyId={companyId} branchId={branchId} />
        <AiOpsPanel />
      </section>
    </AppLayout>
  );
}
