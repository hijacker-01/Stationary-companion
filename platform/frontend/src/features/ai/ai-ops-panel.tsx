import { apiClient } from "@/lib/api-client";

export function AiOpsPanel() {
  const trigger = async (path: string, params: Record<string, string>) => {
    await apiClient.post(path, null, { params });
  };

  return (
    <section className="border border-slate-800 rounded p-3 bg-slate-900 space-y-2">
      <h2 className="text-sm font-semibold">AI Ops</h2>
      <div className="flex gap-2">
        <button className="px-2 py-1 border border-slate-700 rounded" onClick={() => trigger("/ai-ops/ocr/extract", { file_uri: "s3://sample/invoice.pdf" })}>Run OCR</button>
        <button className="px-2 py-1 border border-slate-700 rounded" onClick={() => trigger("/ai-ops/forecast/run", { company_id: "c1", branch_id: "b1", item_id: "i1" })}>Forecast</button>
        <button className="px-2 py-1 border border-slate-700 rounded" onClick={() => trigger("/ai-ops/anomaly/run", { company_id: "c1", branch_id: "b1" })}>Anomaly</button>
        <button className="px-2 py-1 border border-slate-700 rounded" onClick={() => trigger("/ai-ops/recommendation/run", { company_id: "c1", branch_id: "b1" })}>Reorder Reco</button>
      </div>
    </section>
  );
}
