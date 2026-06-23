// PartyHistoryModal — shown when a customer/supplier is selected during entry
// (mirrors real MARG). Displays the party's outstanding balance, credit limit,
// last bill date and a table of previous transactions. Uses large, readable
// type so it's easy to scan at a glance.
//
// Props:
//   data: { loading, customer, entries, balance, error } | null  (null = hidden)
//   onOk:    Enter/OK → continue into the bill
//   onCancel: Esc/Cancel → step back to the party field
//   label:   "Party" (sales) or "Supplier" (purchase)
const fmt = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const d = (x) => (x ? new Date(x).toLocaleDateString("en-GB") : "—");

export default function PartyHistoryModal({ data, onOk, onCancel, label = "Party" }) {
  if (!data) return null;
  const { loading, customer, entries = [], balance = 0, error } = data;
  const invoices = entries.filter((e) => e.type === "Invoice");
  const lastBill = invoices.length ? invoices[invoices.length - 1].date : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]" role="dialog" aria-modal="true">
      <div className="bg-white border border-slate-300 shadow-2xl w-[700px] max-w-[95vw] max-h-[84vh] flex flex-col rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-brand-600 text-white px-5 py-3 flex items-center justify-between">
          <span className="font-bold text-lg">{label} History — {customer?.name || ""}</span>
          <button onClick={onCancel} tabIndex={-1} className="text-3xl leading-none hover:opacity-80 cursor-pointer">×</button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 px-5 py-4 bg-slate-50 border-b border-slate-200 text-center">
          <div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Outstanding</div>
            <div className={`text-2xl font-extrabold ${balance > 0 ? "text-red-600" : "text-emerald-700"}`}>₹{fmt(balance)}</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Credit Limit</div>
            <div className="text-2xl font-extrabold text-slate-800">₹{fmt(customer?.creditLimit)}</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Last Bill</div>
            <div className="text-xl font-bold text-slate-800">{d(lastBill)}</div>
          </div>
        </div>

        {/* Transactions */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="py-14 text-center text-slate-500 text-lg">Loading history…</div>
          ) : error ? (
            <div className="py-14 text-center text-red-500 text-lg">Couldn't load history.</div>
          ) : entries.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-lg">No previous transactions for this party.</div>
          ) : (
            <table className="w-full text-base">
              <thead className="bg-slate-100 sticky top-0">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold">Ref</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Debit</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Credit</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice().reverse().map((e, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-blue-50">
                    <td className="px-4 py-2 text-slate-700">{d(e.date)}</td>
                    <td className="px-4 py-2 text-slate-700">{e.type}</td>
                    <td className="px-4 py-2 font-mono text-slate-600">{e.ref}</td>
                    <td className="px-4 py-2 text-right text-slate-800">{e.debit ? fmt(e.debit) : ""}</td>
                    <td className="px-4 py-2 text-right text-emerald-700">{e.credit ? fmt(e.credit) : ""}</td>
                    <td className="px-4 py-2 text-right font-bold text-slate-900">{fmt(e.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onCancel} tabIndex={-1} className="px-5 py-2.5 border border-slate-300 rounded-lg text-base font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
            Cancel (Esc)
          </button>
          <button autoFocus onClick={onOk} className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-base font-bold cursor-pointer">
            OK (Enter)
          </button>
        </div>
      </div>
    </div>
  );
}
