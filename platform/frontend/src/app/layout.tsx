import { ReactNode } from "react";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-full grid grid-cols-[220px_1fr_320px] bg-slate-950 text-slate-100">
      <aside className="border-r border-slate-800 p-3">Left ERP Nav</aside>
      <main className="overflow-auto">{children}</main>
      <aside className="border-l border-slate-800 p-3">Quick Actions</aside>
    </div>
  );
}
