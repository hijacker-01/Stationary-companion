// Full-screen branded loader shown while a lazy-loaded route module is fetched.
export default function LoadingScreen({ label = "Loading…" }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white shadow-lg shadow-brand-600/30">
          M
        </div>
        <span className="text-xl font-bold tracking-wide text-gray-700">Marg ERP</span>
      </div>
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-brand-600/20 border-t-brand-600" />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
