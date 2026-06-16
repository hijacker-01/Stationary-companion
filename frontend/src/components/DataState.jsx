import EmptyState from "./EmptyState";

// Uniform loading / error / empty handling for data-driven sections.
// Usage:
//   <DataState loading={loading} error={error} empty={!rows.length}
//     emptyProps={{ icon: "Inbox", title: "No items", description: "..." }}>
//     {/* loaded content */}
//   </DataState>
export default function DataState({ loading, error, empty, children, emptyProps = {}, onRetry, loadingLabel = "Loading…" }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-brand-600/20 border-t-brand-600" />
        <p className="text-sm text-slate-500">{loadingLabel}</p>
      </div>
    );
  }
  if (error) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Couldn't load data"
        description={typeof error === "string" ? error : "Something went wrong. Please try again."}
        actionLabel={onRetry ? "Retry" : undefined}
        onAction={onRetry}
      />
    );
  }
  if (empty) {
    return <EmptyState icon={emptyProps.icon || "Inbox"} title={emptyProps.title || "Nothing here yet"} description={emptyProps.description || ""} actionLabel={emptyProps.actionLabel} onAction={emptyProps.onAction} />;
  }
  return children;
}
