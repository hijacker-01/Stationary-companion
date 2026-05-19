import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const GST_RATES = [0, 5, 12, 18, 28];

const emptyRow = { name: "", qty: 1, unit: "strips", mrp: "", gst: 12, amount: 0, availableQty: null };

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

  const fetchBills = () => {
    axios.get("http://localhost:5000/api/billing", { headers: headers() })
      .then(res => setBills(res.data));
  };

  const fetchItems = () => {
    axios.get("http://localhost:5000/api/items", { headers: headers() })
      .then(res => setItems(res.data));
  };

  useEffect(() => { fetchBills(); fetchItems(); }, []);

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
      setRowSchemes(prev => ({ ...prev, [index]: res.data }));
    } catch {
      setRowSchemes(prev => { const n = { ...prev }; delete n[index]; return n; });
    }
  };

  // Auto fill item details when selected from dropdown
  const handleItemSelect = (index, name) => {
    const found = items.find(i => i.name === name);
    const updated = [...rows];
    if (found) {
      updated[index] = {
        ...updated[index],
        name: found.name,
        mrp: found.mrp || "",
        unit: found.unit || "strips",
        availableQty: found.qty,
        amount: calculateAmount(found.mrp, updated[index].qty, updated[index].gst),
      };
      checkScheme(index, found.name, updated[index].qty);
    } else {
      updated[index].name = name;
      updated[index].availableQty = null;
      checkScheme(index, name, updated[index].qty);
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
      field === "mrp" ? value : updated[index].mrp,
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

  const subtotal = rows.reduce((s, r) => s + parseFloat(r.mrp || 0) * parseInt(r.qty || 1), 0);
  const gstAmount = rows.reduce((s, r) => {
    const base = parseFloat(r.mrp || 0) * parseInt(r.qty || 1);
    return s + (base * r.gst) / 100;
  }, 0);

  // Calculate scheme discount
  const schemeDiscount = rows.reduce((total, row, i) => {
    const schemes = rowSchemes[i] || [];
    let disc = 0;
    for (const s of schemes) {
      if (s.type === "buy_get_free" && s.totalFreeItems > 0) {
        disc += s.totalFreeItems * parseFloat(row.mrp || 0);
      } else if (s.type === "flat_discount") {
        const base = parseFloat(row.mrp || 0) * parseInt(row.qty || 1);
        disc += (base * s.discountPercent) / 100;
      }
    }
    return total + disc;
  }, 0);

  const total = subtotal + gstAmount - parseFloat(discount || 0) - schemeDiscount;

  const handleSaveBill = async () => {
    if (!customer.name) return alert("Customer name is required");
    if (rows.every(r => !r.name)) return alert("Add at least one item");

    // Check stock availability on frontend before submitting
    for (const row of rows.filter(r => r.name)) {
      if (row.availableQty !== null && parseInt(row.qty) > row.availableQty) {
        return alert(`Insufficient stock for "${row.name}". Available: ${row.availableQty}, Requested: ${row.qty}`);
      }
    }

    const payload = {
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      items: rows.filter(r => r.name),
      subtotal: parseFloat(subtotal.toFixed(2)),
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      discount: parseFloat((parseFloat(discount || 0) + schemeDiscount).toFixed(2)),
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
                    <th className="px-3 py-2 text-left">Unit</th>
                    <th className="px-3 py-2 text-left">MRP ₹</th>
                    <th className="px-3 py-2 text-left">GST %</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td className="px-2 py-2">
                        <input
                          list="item-list"
                          value={row.name}
                          onChange={e => handleItemSelect(i, e.target.value)}
                          placeholder="Type or select..."
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                        <datalist id="item-list">
                          {items.map(it => <option key={it.id} value={it.name} />)}
                        </datalist>
                      </td>
                      <td className="px-2 py-2">
                        {row.availableQty !== null && row.availableQty !== undefined ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            row.availableQty <= 0
                              ? "bg-red-100 text-red-700"
                              : row.availableQty < 10
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                          }`}>
                            {row.availableQty} {row.unit}
                          </span>
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
                        <input type="text" value={row.unit}
                          onChange={e => handleRowChange(i, "unit", e.target.value)}
                          className="w-20 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" value={row.mrp}
                          onChange={e => handleRowChange(i, "mrp", e.target.value)}
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
                        <td colSpan={8} className="px-3 py-1.5">
                          <div className="flex flex-wrap gap-2">
                            {rowSchemes[i].map((s, si) => (
                              <span key={si} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                s.type === "buy_get_free"
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : "bg-orange-100 text-orange-700 border border-orange-200"
                              }`}>
                                🎁 {s.description}
                                {s.type === "buy_get_free" && s.totalFreeItems > 0 && (
                                  <span className="font-bold">→ {s.totalFreeItems} FREE (Save ₹{(s.totalFreeItems * parseFloat(row.mrp || 0)).toFixed(2)})</span>
                                )}
                                {s.type === "flat_discount" && (
                                  <span className="font-bold">→ Save ₹{((parseFloat(row.mrp || 0) * parseInt(row.qty || 1) * s.discountPercent) / 100).toFixed(2)}</span>
                                )}
                                <span className="text-[10px] opacity-70">({s.company})</span>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
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
                {schemeDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      🎁 Scheme Savings
                    </span>
                    <span className="font-semibold">-₹{schemeDiscount.toFixed(2)}</span>
                  </div>
                )}
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

  // ── PREVIEW / PRINT VIEW ──
  if (view === "preview" && activeBill) return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700">← Back to Bills</button>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            🖨️ Print Invoice
          </button>
        </div>

        {/* Invoice */}
        <div id="invoice" className="bg-white rounded-2xl shadow max-w-3xl mx-auto p-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Marg ERP</h1>
                  <p className="text-gray-500 text-xs">Business Management Software</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">INVOICE</p>
              <p className="text-gray-500 text-sm mt-1 font-mono">{activeBill.billNo}</p>
              <p className="text-gray-400 text-xs mt-1">
                {new Date(activeBill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Customer */}
          <div className="bg-gray-50 rounded-xl p-5 mb-8">
            <p className="text-xs text-gray-500 uppercase font-medium mb-2">Bill To</p>
            <p className="font-bold text-gray-800 text-lg">{activeBill.customerName}</p>
            {activeBill.customerPhone && <p className="text-gray-500 text-sm">📞 {activeBill.customerPhone}</p>}
            {activeBill.customerAddress && <p className="text-gray-500 text-sm">📍 {activeBill.customerAddress}</p>}
          </div>

          {/* Items */}
          <table className="w-full text-sm mb-8">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="px-4 py-3 text-left rounded-tl-lg">#</th>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">MRP</th>
                <th className="px-4 py-3 text-right">GST</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeBill.items?.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name} <span className="text-gray-400 text-xs">{item.unit}</span></td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.qty}</td>
                  <td className="px-4 py-3 text-right text-gray-600">₹{item.mrp}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{item.gst}%</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">₹{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>₹{activeBill.subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST</span><span>₹{activeBill.gstAmount}</span>
              </div>
              {activeBill.discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount</span><span>-₹{activeBill.discount}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg text-gray-800">
                <span>Total</span>
                <span className="text-green-600">₹{activeBill.total}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-xs capitalize">
                <span>Payment Mode</span><span>{activeBill.paymentMode}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t mt-8 pt-6 text-center text-gray-400 text-xs">
            <p>Thank you for your business! 🙏</p>
            <p className="mt-1">Generated by Marg ERP Clone</p>
          </div>
        </div>
      </main>
    </div>
  );
}