import { useState } from "react";
import { AppLayout } from "@/app/layout";
import { PurchaseEntry } from "@/features/purchase/purchase-entry";
import { SalesPOS } from "@/features/sales/sales-pos";
import { TransactionsLedgerList } from "./transactions-ledger-list";

export function TransactionsWorkspace() {
  const [companyId, setCompanyId] = useState("");
  const [branchId, setBranchId] = useState("");

  return (
    <AppLayout>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-1" placeholder="Context Company ID" />
          <input value={branchId} onChange={(e) => setBranchId(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-1" placeholder="Context Branch ID" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <PurchaseEntry />
          <SalesPOS />
        </div>
        <TransactionsLedgerList companyId={companyId} branchId={branchId} />
      </div>
    </AppLayout>
  );
}
