import { useEffect, useState ,Fragment} from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const GST_RATES = [0, 5, 12, 18, 28];

const emptyRow = { searchStr: "", name: "", batch: "", hsn: "", pack: "", expiry: "", qty: 1, schemeQty: 0, unit: "strips", selling_price: "", mrp: "", gst: 12, amount: 0, availableQty: null, availableSchemeQty: null };

export default function Billing() {
  const [bills, setBills] = useState([]);
  const [items, setItems] = useState([]);
  const [view, setView] = useState("list"); // list | create | preview
  const [rows, setRows] = useState([{ ...emptyRow }]);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [activeBill, setActiveBill] = useState(null);
  const [rowSchemes, setRowSchemes] = useState({}); // { rowIndex: [scheme, ...] }
  const [allSchemes, setAllSchemes] = useState([]);
  const [settings, setSettings] = useState({});

  const fetchBills = () => {
    axios.get("http://localhost:5000/api/billing", { headers: headers() })
      .then(res => setBills(res.data));
  };

  const fetchItems = () => {
    axios.get("http://localhost:5000/api/items", { headers: headers() })
      .then(res => setItems(res.data));
  };

  const fetchSchemes = () =>
    axios.get("http://localhost:5000/api/schemes", { headers: headers() })
      .then(res => setAllSchemes(res.data));

  const fetchSettings = () =>
    axios.get("http://localhost:5000/api/settings", { headers: headers() })
      .then(res => setSettings(res.data || {}));

  useEffect(() => { fetchBills(); fetchItems(); fetchSchemes(); fetchSettings(); }, []);

  // Check for applicable schemes for a row
  const checkScheme = async (index, itemName, qty) => {
    if (!itemName) {
      setRowSchemes(prev => { const n = { ...prev }; delete n[index]; return n; });
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/schemes/check`, {
        params: { itemName, qty },
        headers: headers(),
      });
      const schemes = res.data || [];
      setRowSchemes(prev => ({ ...prev, [index]: schemes }));
    } catch {
      setRowSchemes(prev => { const n = { ...prev }; delete n[index]; return n; });
    }
  };

  // Auto fill item details when selected from dropdown
  const handleItemSelect = (index, searchStr) => {
    const updated = [...rows];
    updated[index].searchStr = searchStr;

    // Parse the compound string "Name | Batch: BATCH123"
    const [namePart, batchPart] = searchStr.split(" | Batch: ");
    const name = namePart?.trim();
    const batch = batchPart?.trim();

    const found = items.find(i => i.name === name && (batch ? i.batch === batch : true));
    
    if (found) {
      if (found.expiry && new Date(found.expiry) < new Date()) {
        alert("⚠️ WARNING: This batch is expired and should not be billed!");
      }
      updated[index] = {
        ...updated[index],
        name: found.name,
        batch: found.batch || "",
        hsn: found.hsn || "",
        pack: found.pack || "",
        expiry: found.expiry || "",
        mrp: found.mrp || "",
        selling_price: found.selling_price || found.mrp || "",
        unit: found.unit || "strips",
        availableQty: found.stock_qty,
        availableSchemeQty: found.scheme_qty,
        amount: calculateAmount(found.selling_price || found.mrp, updated[index].qty, updated[index].gst),
      };
      checkScheme(index, found.name, updated[index].qty);
    } else {
      updated[index].name = name || searchStr;
      updated[index].batch = "";
      updated[index].availableQty = null;
      updated[index].availableSchemeQty = null;
      checkScheme(index, name || searchStr, updated[index].qty);
    }
    setRows(updated);
  };

  const calculateAmount = (mrp, qty, gst) => {
    const base = parseFloat(mrp || 0) * parseInt(qty || 1);
    return parseFloat((base + (base * gst) / 100).toFixed(2));
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    updated[index].amount = calculateAmount(
      field === "selling_price" ? value : updated[index].selling_price,
      field === "qty" ? value : updated[index].qty,
      field === "gst" ? value : updated[index].gst
    );
    setRows(updated);
    // Re-check scheme if qty changed
    if (field === "qty") {
      checkScheme(index, updated[index].name, value);
    }
  };

  const addRow = () => setRows([...rows, { ...emptyRow }]);
  const removeRow = (i) => {
    setRows(rows.filter((_, idx) => idx !== i));
    setRowSchemes(prev => { const n = { ...prev }; delete n[i]; return n; });
  };

  const subtotal = rows.reduce((s, r) => s + parseFloat(r.selling_price || r.mrp || 0) * parseInt(r.qty || 1), 0);
  const gstAmount = rows.reduce((s, r) => {
    const base = parseFloat(r.selling_price || r.mrp || 0) * parseInt(r.qty || 1);
    return s + (base * r.gst) / 100;
  }, 0);

  const total = subtotal + gstAmount - parseFloat(discount || 0);

  const handleSaveBill = async () => {
    if (!customer.name) return alert("Customer name is required");
    if (rows.every(r => !r.name)) return alert("Add at least one item");

    // Check stock availability on frontend before submitting
    for (const row of rows.filter(r => r.name)) {
      const totalAvailable = (row.availableQty || 0) + (row.availableSchemeQty || 0);
      const totalRequested = parseInt(row.qty || 0) + parseInt(row.schemeQty || 0);
      if (row.availableQty !== null && totalRequested > totalAvailable) {
        return alert(`Insufficient total stock for "${row.name}". Total Available: ${totalAvailable}, Total Requested: ${totalRequested}`);
      }
    }

    const payload = {
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      items: rows.filter(r => r.name),
      subtotal: parseFloat(subtotal.toFixed(2)),
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      discount: parseFloat(parseFloat(discount || 0).toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      paymentMode,
      status: "paid",
    };

    try {
      const res = await axios.post("http://localhost:5000/api/billing", payload, { headers: headers() });
      setActiveBill(res.data);
      setView("preview");
      fetchBills();
      fetchItems(); // Refresh items to get updated stock
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create bill");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this bill?")) return;
    await axios.delete(`http://localhost:5000/api/billing/${id}`, { headers: headers() });
    fetchBills();
    fetchItems(); // Refresh items since stock is restored on bill deletion
  };

  const resetForm = () => {
    setRows([{ ...emptyRow }]);
    setCustomer({ name: "", phone: "", address: "" });
    setDiscount(0);
    setPaymentMode("cash");
    setActiveBill(null);
    setRowSchemes({});
    setView("list");
  };

  // ── LIST VIEW ──
  if (view === "list") return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🧾 Billing</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage invoices</p>
          </div>
          <button
            onClick={() => setView("create")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow"
          >
            + New Bill
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Bills", value: bills.length, color: "bg-blue-600" },
            { label: "Total Revenue", value: `₹${bills.reduce((s, b) => s + b.total, 0).toFixed(2)}`, color: "bg-green-600" },
            { label: "Unpaid Bills", value: bills.filter(b => b.status === "unpaid").length, color: "bg-red-500" },
          ].map(c => (
            <div key={c.label} className={`${c.color} text-white rounded-2xl p-5 shadow`}>
              <p className="text-3xl font-bold">{c.value}</p>
              <p className="text-sm opacity-80 mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-6 py-4 text-left">Bill No</th>
                <th className="px-6 py-4 text-left">Customer</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Items</th>
                <th className="px-6 py-4 text-left">Total</th>
                <th className="px-6 py-4 text-left">Payment</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bills.map(bill => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-blue-600 font-medium">{bill.billNo}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{bill.customerName}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{bill.items?.length || 0} items</td>
                  <td className="px-6 py-4 font-bold text-green-600">₹{bill.total}</td>
                  <td className="px-6 py-4 capitalize text-gray-600">{bill.paymentMode}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      bill.status === "paid" ? "bg-green-100 text-green-700 border-green-200" :
                      bill.status === "unpaid" ? "bg-red-100 text-red-700 border-red-200" :
                      "bg-yellow-100 text-yellow-700 border-yellow-200"
                    }`}>{bill.status}</span>
                  </td>
                  <td className="px-6 py-4 flex gap-3">
                    <button
                      onClick={() => { setActiveBill(bill); setView("preview"); }}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >View</button>
                    <button
                      onClick={() => handleDelete(bill.id)}
                      className="text-red-500 hover:underline text-xs font-medium"
                    >Delete</button>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No bills yet. Create your first bill!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );

  // ── CREATE VIEW ──
  if (view === "create") return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🧾 New Invoice</h1>
            <p className="text-sm text-gray-500 mt-1">Fill details and add items</p>
          </div>
          <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Bills
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left — Items */}
          <div className="col-span-2 space-y-4">

            {/* Customer Details */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-semibold text-gray-700 mb-4">Customer Details</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: "name", label: "Customer Name *", placeholder: "Enter name" },
                  { key: "phone", label: "Phone", placeholder: "10-digit number" },
                  { key: "address", label: "Address", placeholder: "City / Address" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
                    <input
                      type="text"
                      placeholder={f.placeholder}
                      value={customer[f.key]}
                      onChange={e => setCustomer({ ...customer, [f.key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-semibold text-gray-700 mb-4">Items</h2>
              <table className="w-full text-sm mb-4">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">Item Name</th>
                    <th className="px-3 py-2 text-left">Stock</th>
                    <th className="px-3 py-2 text-left">Qty</th>
                    <th className="px-3 py-2 text-left">Scheme Qty</th>
                    <th className="px-3 py-2 text-left">Unit</th>
                    <th className="px-3 py-2 text-left">Selling Price ₹</th>
                    <th className="px-3 py-2 text-left">GST %</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, i) => (
                    <Fragment key={i}> {/* <-- Add Fragment wrapper here with the key */}
                      <tr> {/* <-- Remove the key from this tr */}
                        <td className="px-2 py-2">
                          <input
                            list={`item-list-${i}`}
                            value={row.searchStr !== undefined ? row.searchStr : row.name}
                            onChange={e => handleItemSelect(i, e.target.value)}
                            placeholder="Type or select..."
                            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          <datalist id={`item-list-${i}`}>
                            {items.map(it => (
                              <option key={it.id} value={`${it.name}${it.batch ? ' | Batch: ' + it.batch : ''}`} />
                            ))}
                          </datalist>
                        </td>
                        <td className="px-2 py-2">
                          {row.availableQty !== null && row.availableQty !== undefined ? (
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold ${
                                (row.availableQty + (row.availableSchemeQty || 0)) <= 0
                                  ? "bg-red-100 text-red-700"
                                  : (row.availableQty + (row.availableSchemeQty || 0)) < 10
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                              }`}>
                                Total: {row.availableQty + (row.availableSchemeQty || 0)} {row.unit}
                              </span>
                              <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                ({row.availableQty} Stock + {row.availableSchemeQty || 0} Scheme)
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" min="1" value={row.qty}
                            onChange={e => handleRowChange(i, "qty", e.target.value)}
                            className={`w-16 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 ${
                              row.availableQty !== null && parseInt(row.qty) > row.availableQty
                                ? "border-red-400 focus:ring-red-400 bg-red-50 text-red-700"
                                : "border-gray-200 focus:ring-blue-400"
                            }`}
                          />
                          {row.availableQty !== null && parseInt(row.qty) > row.availableQty && (
                            <p className="text-red-500 text-[10px] mt-0.5">Exceeds stock!</p>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" min="0" value={row.schemeQty}
                            onChange={e => handleRowChange(i, "schemeQty", e.target.value)}
                            className={`w-16 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 ${
                              row.availableSchemeQty !== null && parseInt(row.schemeQty) > row.availableSchemeQty
                                ? "border-red-400 focus:ring-red-400 bg-red-50 text-red-700"
                                : "border-gray-200 focus:ring-blue-400"
                            }`}
                          />
                          {row.availableSchemeQty !== null && parseInt(row.schemeQty) > row.availableSchemeQty && (
                            <p className="text-red-500 text-[10px] mt-0.5">Exceeds stock!</p>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={row.unit}
                            onChange={e => handleRowChange(i, "unit", e.target.value)}
                            className="w-20 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" value={row.selling_price}
                            onChange={e => handleRowChange(i, "selling_price", e.target.value)}
                            className="w-24 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select value={row.gst}
                            onChange={e => handleRowChange(i, "gst", e.target.value)}
                            className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none"
                          >
                            {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-2 font-semibold text-gray-700">₹{row.amount}</td>
                        <td className="px-2 py-2">
                          {rows.length > 1 && (
                            <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                          )}
                        </td>
                      </tr>
                      {/* Scheme badge row */}
                      {rowSchemes[i] && rowSchemes[i].length > 0 && (
                        <tr className="bg-green-50/70">
                          <td colSpan={9} className="px-3 py-1.5">
                            <div className="flex flex-wrap gap-2">
                              {rowSchemes[i].map((s, si) => (
                                <button key={si} type="button" 
                                  onClick={() => {
                                    if (s.type === "buy_get_free" && s.totalFreeItems > 0) {
                                      handleRowChange(i, "schemeQty", s.totalFreeItems);
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold hover:opacity-80 transition cursor-pointer ${
                                  s.type === "buy_get_free"
                                    ? "bg-green-100 text-green-700 border border-green-200"
                                    : "bg-orange-100 text-orange-700 border border-orange-200"
                                }`}>
                                  🎁 {s.description}
                                  {s.type === "buy_get_free" && s.totalFreeItems > 0 && (
                                    <span className="font-bold">→ {s.totalFreeItems} FREE (Click to apply)</span>
                                  )}
                                  {s.type === "flat_discount" && (
                                    <span className="font-bold">→ Auto-applied</span>
                                  )}
                                  <span className="text-[10px] opacity-70">({s.company})</span>
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment> 
                  ))}
                </tbody>
              </table>
              <button onClick={addRow} className="text-blue-600 text-sm hover:underline font-medium">
                + Add Row
              </button>
            </div>
          </div>

          {/* Right — Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-semibold text-gray-700 mb-4">Payment Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Discount</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    className="w-24 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                <div className="border-t pt-3 flex justify-between font-bold text-lg text-gray-800">
                  <span>Total</span>
                  <span className="text-green-600">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-semibold text-gray-700 mb-4">Payment Mode</h2>
              <div className="grid grid-cols-2 gap-2">
                {["cash", "upi", "card", "credit"].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 rounded-lg text-sm font-medium capitalize border transition ${
                      paymentMode === mode
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {mode === "cash" ? "💵" : mode === "upi" ? "📱" : mode === "card" ? "💳" : "📋"} {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Available Schemes Panel */}
            {allSchemes.filter(s => s.isActive).length > 0 && (
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  🎁 Available Schemes
                  <span className="text-xs font-normal text-gray-400">({allSchemes.filter(s => s.isActive).length} active)</span>
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {allSchemes.filter(s => s.isActive).map(s => (
                    <div key={s.id} className={`rounded-xl p-3 border text-xs ${
                      s.type === "buy_get_free"
                        ? "bg-green-50 border-green-200"
                        : "bg-orange-50 border-orange-200"
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{s.name}</p>
                          <p className="text-purple-600 font-medium mt-0.5">🏭 {s.company}</p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full font-semibold ${
                          s.type === "buy_get_free"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {s.type === "buy_get_free"
                            ? `${s.buyQty}+${s.freeQty} Free`
                            : `${s.discountPercent}% Off`}
                        </span>
                      </div>
                      {s.applicableItems?.length > 0 && (
                        <p className="text-gray-500 mt-1">Items: {s.applicableItems.join(", ")}</p>
                      )}
                      {s.startDate && s.endDate && (
                        <p className="text-gray-400 mt-0.5">
                          📅 {new Date(s.startDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})} — {new Date(s.endDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSaveBill}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold shadow-lg text-sm"
            >
              ✅ Save & Generate Bill
            </button>
          </div>
        </div>
      </main>
    </div>
  );

  // Number to Words converter for Indian Rupees
  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : '';
    return str || "Zero";
  };

  if (view === "preview" && activeBill) {
    const totalGst = activeBill.gstAmount || 0;
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;
    const roundOff = (Math.round(activeBill.total) - activeBill.total).toFixed(2);
    const grandTotal = Math.round(activeBill.total);

    return (
      <div className="flex min-h-screen bg-gray-100 print:bg-white">
        <Sidebar />
        <main className="flex-1 p-8 print:p-0">
          <div className="flex items-center justify-between mb-6 print:hidden">
            <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700">← Back to Bills</button>
            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow"
            >
              🖨️ Print Invoice
            </button>
          </div>

          <div id="invoice" className="bg-white rounded max-w-[210mm] mx-auto p-8 print:shadow-none shadow-lg print:p-4 text-xs font-sans text-gray-800">
            {/* Header */}
            <div className="text-center border-b-2 border-gray-800 pb-3 mb-3">
              <h1 className="text-2xl font-extrabold uppercase tracking-wider">{settings.companyName || "PHARMA DISTRIBUTORS"}</h1>
              <p className="text-sm font-medium">{settings.companyAddress || "123, Wholesale Market, Mumbai, MH"}</p>
              <div className="flex justify-center gap-6 mt-1 font-semibold text-[11px]">
                <p>Phone: {settings.companyPhone || "+91-XXXXXXXXXX"}</p>
                <p>DL No: {settings.dlNumber || "MH-MZ3-123456"}</p>
                <p>GSTIN: {settings.gstNumber || "27AAAAA0000A1Z5"}</p>
              </div>
            </div>

            {/* Meta Data */}
            <div className="flex justify-between border-b border-gray-400 pb-3 mb-3">
              <div className="w-1/2 pr-4 border-r border-gray-400">
                <p className="font-bold mb-1 underline">Billed To:</p>
                <p className="font-bold uppercase text-sm">{activeBill.customerName}</p>
                <p>{activeBill.customerAddress || "Walk-in Customer"}</p>
                <p>Phone: {activeBill.customerPhone || "N/A"}</p>
                <p className="mt-1 font-semibold">DL No: {activeBill.customerDl || "N/A"}</p>
                {activeBill.customerGst && <p className="font-semibold">GSTIN: {activeBill.customerGst}</p>}
              </div>
              <div className="w-1/2 pl-4 space-y-1">
                <div className="flex justify-between"><span className="font-bold">Invoice No:</span> <span className="font-mono">{settings.invoicePrefix || "INV"}-{activeBill.billNo}</span></div>
                <div className="flex justify-between"><span className="font-bold">Invoice Date:</span> <span>{new Date(activeBill.createdAt).toLocaleDateString("en-IN")}</span></div>
                <div className="flex justify-between"><span className="font-bold">Due Date:</span> <span>{activeBill.dueDate ? new Date(activeBill.dueDate).toLocaleDateString("en-IN") : "N/A"}</span></div>
                <div className="flex justify-between"><span className="font-bold">Transport:</span> <span>{activeBill.transportDetails || "Hand Delivery"}</span></div>
                <div className="flex justify-between"><span className="font-bold">Payment Mode:</span> <span className="uppercase">{activeBill.paymentMode}</span></div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-[10px] mb-3 border border-gray-400">
              <thead className="bg-gray-100 border-b border-gray-400">
                <tr>
                  <th className="border-r border-gray-400 p-1 text-center">S.No</th>
                  <th className="border-r border-gray-400 p-1 text-left">Product Name</th>
                  <th className="border-r border-gray-400 p-1 text-center">HSN</th>
                  <th className="border-r border-gray-400 p-1 text-center">Pack</th>
                  <th className="border-r border-gray-400 p-1 text-center">Batch</th>
                  <th className="border-r border-gray-400 p-1 text-center">Exp</th>
                  <th className="border-r border-gray-400 p-1 text-center">Qty</th>
                  <th className="border-r border-gray-400 p-1 text-center">Free</th>
                  <th className="border-r border-gray-400 p-1 text-right">MRP</th>
                  <th className="border-r border-gray-400 p-1 text-right">Rate</th>
                  <th className="border-r border-gray-400 p-1 text-center">GST%</th>
                  <th className="p-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {activeBill.items?.map((item, i) => (
                  <tr key={i} className="border-b border-gray-200 last:border-b-0">
                    <td className="border-r border-gray-400 p-1 text-center">{i + 1}</td>
                    <td className="border-r border-gray-400 p-1 font-bold uppercase">{item.name}</td>
                    <td className="border-r border-gray-400 p-1 text-center">{item.hsn || "—"}</td>
                    <td className="border-r border-gray-400 p-1 text-center">{item.pack || "—"}</td>
                    <td className="border-r border-gray-400 p-1 text-center font-mono">{item.batch || "—"}</td>
                    <td className="border-r border-gray-400 p-1 text-center">
                      {item.expiry ? new Date(item.expiry).toLocaleDateString("en-IN", {month:"short", year:"2-digit"}) : "—"}
                    </td>
                    <td className="border-r border-gray-400 p-1 text-center font-bold">{item.qty}</td>
                    <td className="border-r border-gray-400 p-1 text-center">{item.schemeQty || 0}</td>
                    <td className="border-r border-gray-400 p-1 text-right">{item.mrp}</td>
                    <td className="border-r border-gray-400 p-1 text-right font-semibold">{item.selling_price}</td>
                    <td className="border-r border-gray-400 p-1 text-center">{item.gst}%</td>
                    <td className="p-1 text-right font-bold">{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals & Footer Info */}
            <div className="flex border border-gray-400">
              <div className="w-2/3 p-2 border-r border-gray-400 flex flex-col justify-between">
                <div>
                  <p className="font-bold mb-1">Rupees in Words:</p>
                  <p className="italic font-medium">{numberToWords(grandTotal)}</p>
                </div>
                <div className="mt-4">
                  <p className="font-bold">Bank Details:</p>
                  <p className="whitespace-pre-wrap leading-tight">{settings.bankDetails || "Bank Name: XYZ Bank\nA/C No: 0000000000\nIFSC: XYZ0000000"}</p>
                </div>
                <div className="mt-4 text-[9px] text-gray-600">
                  <p className="font-bold text-gray-800">Terms & Conditions:</p>
                  <p className="whitespace-pre-wrap">{settings.termsConditions || "1. Goods once sold will not be taken back.\n2. Interest @ 24% p.a. will be charged if bill is not paid within due date."}</p>
                </div>
              </div>

              <div className="w-1/3 text-sm">
                <div className="flex justify-between p-1 border-b border-gray-300"><span>Subtotal:</span> <span>{activeBill.subtotal?.toFixed(2)}</span></div>
                <div className="flex justify-between p-1 border-b border-gray-300"><span>Discount:</span> <span>{activeBill.discount?.toFixed(2)}</span></div>
                <div className="flex justify-between p-1 border-b border-gray-300"><span>SGST:</span> <span>{sgst.toFixed(2)}</span></div>
                <div className="flex justify-between p-1 border-b border-gray-300"><span>CGST:</span> <span>{cgst.toFixed(2)}</span></div>
                <div className="flex justify-between p-1 border-b border-gray-300"><span>Round Off:</span> <span>{roundOff}</span></div>
                <div className="flex justify-between p-2 bg-gray-100 font-bold text-lg"><span>GRAND TOTAL:</span> <span>₹ {grandTotal.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-end">
              <p className="text-[10px] text-gray-500 italic">This is a computer generated invoice.</p>
              <div className="text-center w-48 border-t border-gray-800 pt-1 mt-12">
                <p className="font-bold text-[10px]">For {settings.companyName || "PHARMA DISTRIBUTORS"}</p>
                <p className="text-[9px] mt-1 text-gray-500">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
}