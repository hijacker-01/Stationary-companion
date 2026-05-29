import { useEffect, useState, Fragment } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import {
  Plus,
  Printer,
  ArrowLeft,
  FileText,
  IndianRupee,
  AlertCircle,
  PlusCircle,
  Check,
  Tag,
  Wallet,
  CreditCard,
  Landmark,
  ClipboardList,
  Users,
} from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const GST_RATES = [0, 5, 12, 18, 28];

const emptyRow = {
  searchStr: "",
  name: "",
  batch: "",
  hsn: "",
  pack: "",
  expiry: "",
  qty: 1,
  schemeQty: 0,
  unit: "strips",
  selling_price: "",
  mrp: "",
  gst: 12,
  amount: 0,
  availableQty: null,
  availableSchemeQty: null,
};

export default function Billing() {
  const [bills, setBills] = useState([]);
  const [items, setItems] = useState([]);
  const [view, setView] = useState("list"); // list | create | preview
  const [rows, setRows] = useState([{ ...emptyRow }]);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    dlNumber: "",
    gstNumber: "",
    transportDetails: "Hand Delivery",
    dueDate: "",
  });
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [activeBill, setActiveBill] = useState(null);
  const [rowSchemes, setRowSchemes] = useState({}); // { rowIndex: [scheme, ...] }
  const [allSchemes, setAllSchemes] = useState([]);
  const [settings, setSettings] = useState({});
  const [customers, setCustomers] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [selectedSalesman, setSelectedSalesman] = useState({
    id: "",
    name: "",
  });

  const fetchBills = () => {
    axios
      .get("http://localhost:5000/api/billing", { headers: headers() })
      .then((res) => setBills(res.data));
  };

  const fetchItems = () => {
    axios
      .get("http://localhost:5000/api/items", { headers: headers() })
      .then((res) => setItems(res.data));
  };

  const fetchSchemes = () =>
    axios
      .get("http://localhost:5000/api/schemes", { headers: headers() })
      .then((res) => setAllSchemes(res.data));

  const fetchCustomers = () =>
    axios
      .get("http://localhost:5000/api/customers", { headers: headers() })
      .then((res) => setCustomers(res.data || []));

  const fetchSalesmen = () =>
    axios
      .get("http://localhost:5000/api/salesman", { headers: headers() })
      .then((res) => setSalesmen(res.data || []));

  const handleCustomerSelect = (name) => {
    const found = customers.find(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
    if (found) {
      const days = found.creditDays || 30;
      const due = new Date();
      due.setDate(due.getDate() + days);
      const formattedDueDate = due.toISOString().split("T")[0];

      setCustomer({
        name: found.name,
        phone: found.phone || "",
        address: found.address || "",
        dlNumber: found.dlNumber || "",
        gstNumber: found.gstNumber || "",
        dueDate: formattedDueDate,
        transportDetails: customer.transportDetails || "Hand Delivery",
      });
    } else {
      setCustomer((prev) => ({
        ...prev,
        name,
      }));
    }
  };

  const fetchSettings = () =>
    axios
      .get("http://localhost:5000/api/settings", { headers: headers() })
      .then((res) => setSettings(res.data || {}));

  useEffect(() => {
    fetchBills();
    fetchItems();
    fetchSchemes();
    fetchSettings();
    fetchCustomers();
    fetchSalesmen();
  }, []);

  // Check for applicable schemes for a row
  const checkScheme = async (index, itemName, qty) => {
    if (!itemName) {
      setRowSchemes((prev) => {
        const n = { ...prev };
        delete n[index];
        return n;
      });
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/schemes/check`, {
        params: { itemName, qty },
        headers: headers(),
      });
      const schemes = res.data || [];
      setRowSchemes((prev) => ({ ...prev, [index]: schemes }));
    } catch {
      setRowSchemes((prev) => {
        const n = { ...prev };
        delete n[index];
        return n;
      });
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

    const found = items.find(
      (i) => i.name === name && (batch ? i.batch === batch : true),
    );

    if (found) {
      if (found.expiry && new Date(found.expiry) < new Date()) {
        alert("⚠️ WARNING: This batch is expired and should not be billed!");
      }

      // Drug schedule warning enforcement
      if (found.schedule && found.schedule !== "None") {
        alert(
          `🚨 DRUG COMPLIANCE WARNING:\n\nThis item is classified under ${found.schedule}.\nA registered medical practitioner's prescription is MANDATORY before dispensing this drug.`,
        );
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
        amount: calculateAmount(
          found.selling_price || found.mrp,
          updated[index].qty,
          updated[index].gst,
        ),
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
      field === "gst" ? value : updated[index].gst,
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
    setRowSchemes((prev) => {
      const n = { ...prev };
      delete n[i];
      return n;
    });
  };

  const subtotal = rows.reduce(
    (s, r) =>
      s + parseFloat(r.selling_price || r.mrp || 0) * parseInt(r.qty || 1),
    0,
  );
  const gstAmount = rows.reduce((s, r) => {
    const base =
      parseFloat(r.selling_price || r.mrp || 0) * parseInt(r.qty || 1);
    return s + (base * r.gst) / 100;
  }, 0);

  const total = subtotal + gstAmount - parseFloat(discount || 0);

  const handleSaveBill = async () => {
    if (!customer.name) return alert("Customer name is required");
    if (rows.every((r) => !r.name)) return alert("Add at least one item");

    // Check stock availability on frontend before submitting
    for (const row of rows.filter((r) => r.name)) {
      const totalAvailable =
        (row.availableQty || 0) + (row.availableSchemeQty || 0);
      const totalRequested =
        parseInt(row.qty || 0) + parseInt(row.schemeQty || 0);
      if (row.availableQty !== null && totalRequested > totalAvailable) {
        return alert(
          `Insufficient total stock for "${row.name}". Total Available: ${totalAvailable}, Total Requested: ${totalRequested}`,
        );
      }
    }

    const payload = {
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerDl: customer.dlNumber,
      customerGst: customer.gstNumber,
      dueDate: customer.dueDate || null,
      transportDetails: customer.transportDetails,
      salesmanId: selectedSalesman.id || null,
      salesmanName: selectedSalesman.name || "",
      items: rows.filter((r) => r.name),
      subtotal: parseFloat(subtotal.toFixed(2)),
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      discount: parseFloat(parseFloat(discount || 0).toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      paymentMode,
      status: "paid",
    };

    try {
      const res = await axios.post(
        "http://localhost:5000/api/billing",
        payload,
        { headers: headers() },
      );
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
    await axios.delete(`http://localhost:5000/api/billing/${id}`, {
      headers: headers(),
    });
    fetchBills();
    fetchItems(); // Refresh items since stock is restored on bill deletion
  };

  const resetForm = () => {
    setRows([{ ...emptyRow }]);
    setCustomer({
      name: "",
      phone: "",
      address: "",
      dlNumber: "",
      gstNumber: "",
      transportDetails: "Hand Delivery",
      dueDate: "",
    });
    setDiscount(0);
    setPaymentMode("cash");
    setSelectedSalesman({ id: "", name: "" });
    setActiveBill(null);
    setRowSchemes({});
    setView("list");
  };

  // ── LIST VIEW ──
  if (view === "list")
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto max-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Billing & Invoices
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Generate new retail/wholesale bills, track outstanding customer
                payments, and manage invoices.
              </p>
            </div>
            <button
              onClick={() => setView("create")}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" />
              New Invoice
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {[
              {
                label: "Total Invoices",
                value: bills.length,
                icon: FileText,
                borderColor: "border-teal-500",
                color: "text-teal-600 bg-teal-50",
              },
              {
                label: "Gross Billing Revenue",
                value: `₹${bills.reduce((s, b) => s + b.total, 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                icon: IndianRupee,
                borderColor: "border-emerald-500",
                color: "text-emerald-600 bg-emerald-50",
              },
              {
                label: "Unpaid / Credit Bills",
                value: bills.filter((b) => b.status === "unpaid").length,
                icon: AlertCircle,
                borderColor: "border-rose-500",
                color: "text-rose-600 bg-rose-50",
              },
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={i}
                  className={`bg-white border-l-4 ${c.borderColor} border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between`}
                >
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {c.value}
                    </p>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-1">
                      {c.label}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${c.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Smart Chips (Phase 21) */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase mr-2 tracking-wider">Quick Filters:</span>
            <button className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors shadow-sm focus:outline-none">Today</button>
            <button className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors shadow-sm focus:outline-none">Yesterday</button>
            <button className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors shadow-sm focus:outline-none flex items-center gap-1"><Tag className="w-3 h-3" /> High Profit</button>
            <button className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors shadow-sm focus:outline-none">Unpaid</button>
          </div>

          {/* Bills Table */}
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment Mode</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="font-mono text-teal-600 font-bold">
                      {bill.billNo}
                    </td>
                    <td className="font-semibold text-slate-900">
                      {bill.customerName}
                    </td>
                    <td className="text-slate-600 font-medium">
                      {new Date(bill.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="text-slate-500">
                      {bill.items?.length || 0} items
                    </td>
                    <td className="font-bold text-slate-900">
                      ₹
                      {bill.total.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="text-slate-600">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {bill.paymentMode}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${
                          bill.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : bill.status === "unpaid"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => {
                            setActiveBill(bill);
                            setView("preview");
                          }}
                          className="text-teal-600 hover:text-teal-800 text-xs font-semibold cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(bill.id)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-12 text-slate-400 font-medium"
                    >
                      No billing transactions recorded yet. Create a new
                      invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    );

  // ── CREATE VIEW ──
  if (view === "create")
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto max-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Create Invoice
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Configure customer profiles, adjust logistics, and generate
                bills.
              </p>
            </div>
            <button
              onClick={resetForm}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Invoices
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Columns - Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Details */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  Customer Profiles & Logistics
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      list="billing-customer-list"
                      placeholder="Search or enter customer"
                      value={customer.name}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="form-input"
                    />
                    <datalist id="billing-customer-list">
                      {customers.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="Phone number"
                      value={customer.phone}
                      onChange={(e) =>
                        setCustomer({ ...customer, phone: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      Address Details
                    </label>
                    <input
                      type="text"
                      placeholder="Billing Address"
                      value={customer.address}
                      onChange={(e) =>
                        setCustomer({ ...customer, address: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-slate-100">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      DL Number
                    </label>
                    <input
                      type="text"
                      placeholder="Drug License"
                      value={customer.dlNumber}
                      onChange={(e) =>
                        setCustomer({ ...customer, dlNumber: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      placeholder="GST Identification"
                      value={customer.gstNumber}
                      onChange={(e) =>
                        setCustomer({ ...customer, gstNumber: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={customer.dueDate}
                      onChange={(e) =>
                        setCustomer({ ...customer, dueDate: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      Transport
                    </label>
                    <input
                      type="text"
                      placeholder="Transport details"
                      value={customer.transportDetails}
                      onChange={(e) =>
                        setCustomer({
                          ...customer,
                          transportDetails: e.target.value,
                        })
                      }
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      Salesman
                    </label>
                    <select
                      value={selectedSalesman.id}
                      onChange={(e) => {
                        const found = salesmen.find(
                          (s) => s.id === parseInt(e.target.value),
                        );
                        setSelectedSalesman(
                          found
                            ? { id: found.id, name: found.name }
                            : { id: "", name: "" },
                        );
                      }}
                      className="form-input bg-white"
                    >
                      <option value="">No Salesman</option>
                      {salesmen.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-teal-600" />
                  Line Items
                </h2>
                <table className="w-full text-sm mb-4">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-2 py-3 text-left w-1/3">
                        Item Details
                      </th>
                      <th className="px-2 py-3 text-left">Stock State</th>
                      <th className="px-2 py-3 text-left w-16">Qty</th>
                      <th className="px-2 py-3 text-left w-16">Free</th>
                      <th className="px-2 py-3 text-left w-20">Unit</th>
                      <th className="px-2 py-3 text-left w-24">Price ₹</th>
                      <th className="px-2 py-3 text-left">GST</th>
                      <th className="px-2 py-3 text-left">Amount</th>
                      <th className="px-2 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, i) => (
                      <Fragment key={i}>
                        <tr>
                          <td className="px-1.5 py-3">
                            <input
                              list={`item-list-${i}`}
                              value={
                                row.searchStr !== undefined
                                  ? row.searchStr
                                  : row.name
                              }
                              onChange={(e) =>
                                handleItemSelect(i, e.target.value)
                              }
                              placeholder="Search product name..."
                              className="form-input"
                            />
                            <datalist id={`item-list-${i}`}>
                              {items.map((it) => (
                                <option
                                  key={it.id}
                                  value={`${it.name}${it.batch ? " | Batch: " + it.batch : ""}`}
                                />
                              ))}
                            </datalist>
                          </td>
                          <td className="px-1.5 py-3">
                            {row.availableQty !== null &&
                            row.availableQty !== undefined ? (
                              <div className="flex flex-col gap-0.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    row.availableQty +
                                      (row.availableSchemeQty || 0) <=
                                    0
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : row.availableQty +
                                            (row.availableSchemeQty || 0) <
                                          10
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  }`}
                                >
                                  Total:{" "}
                                  {row.availableQty +
                                    (row.availableSchemeQty || 0)}{" "}
                                  {row.unit}
                                </span>
                                <span className="text-[9px] text-slate-400 font-medium">
                                  ({row.availableQty} S +{" "}
                                  {row.availableSchemeQty || 0} F)
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-1.5 py-3">
                            <input
                              type="number"
                              min="1"
                              value={row.qty}
                              onChange={(e) =>
                                handleRowChange(i, "qty", e.target.value)
                              }
                              className={`form-input text-center ${
                                row.availableQty !== null &&
                                parseInt(row.qty) > row.availableQty
                                  ? "border-rose-400 focus:ring-rose-400 bg-rose-50 text-rose-700 font-bold"
                                  : ""
                              }`}
                            />
                            {row.availableQty !== null &&
                              parseInt(row.qty) > row.availableQty && (
                                <p className="text-rose-600 text-[9px] font-bold mt-1 leading-none">
                                  Limit!
                                </p>
                              )}
                          </td>
                          <td className="px-1.5 py-3">
                            <input
                              type="number"
                              min="0"
                              value={row.schemeQty}
                              onChange={(e) =>
                                handleRowChange(i, "schemeQty", e.target.value)
                              }
                              className={`form-input text-center ${
                                row.availableSchemeQty !== null &&
                                parseInt(row.schemeQty) > row.availableSchemeQty
                                  ? "border-rose-400 focus:ring-rose-400 bg-rose-50 text-rose-700 font-bold"
                                  : ""
                              }`}
                            />
                            {row.availableSchemeQty !== null &&
                              parseInt(row.schemeQty) >
                                row.availableSchemeQty && (
                                <p className="text-rose-600 text-[9px] font-bold mt-1 leading-none">
                                  Limit!
                                </p>
                              )}
                          </td>
                          <td className="px-1.5 py-3">
                            <input
                              type="text"
                              value={row.unit}
                              onChange={(e) =>
                                handleRowChange(i, "unit", e.target.value)
                              }
                              className="form-input"
                            />
                          </td>
                          <td className="px-1.5 py-3">
                            <input
                              type="number"
                              value={row.selling_price}
                              onChange={(e) =>
                                handleRowChange(
                                  i,
                                  "selling_price",
                                  e.target.value,
                                )
                              }
                              className="form-input font-bold"
                            />
                          </td>
                          <td className="px-1.5 py-3">
                            <select
                              value={row.gst}
                              onChange={(e) =>
                                handleRowChange(i, "gst", e.target.value)
                              }
                              className="form-input bg-white"
                            >
                              {GST_RATES.map((r) => (
                                <option key={r} value={r}>
                                  {r}%
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-1.5 py-3 font-bold text-slate-800">
                            ₹{row.amount}
                          </td>
                          <td className="px-1.5 py-3">
                            {rows.length > 1 && (
                              <button
                                onClick={() => removeRow(i)}
                                className="text-rose-400 hover:text-rose-600 text-lg font-bold cursor-pointer"
                              >
                                ×
                              </button>
                            )}
                          </td>
                        </tr>
                        {/* Scheme Badge Row */}
                        {rowSchemes[i] && rowSchemes[i].length > 0 && (
                          <tr className="bg-slate-50">
                            <td
                              colSpan={9}
                              className="px-3 py-2 border-b border-slate-100"
                            >
                              <div className="flex flex-wrap gap-2">
                                {rowSchemes[i].map((s, si) => (
                                  <button
                                    key={si}
                                    type="button"
                                    onClick={() => {
                                      if (
                                        s.type === "buy_get_free" &&
                                        s.totalFreeItems > 0
                                      ) {
                                        handleRowChange(
                                          i,
                                          "schemeQty",
                                          s.totalFreeItems,
                                        );
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold hover:opacity-80 transition cursor-pointer border ${
                                      s.type === "buy_get_free"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}
                                  >
                                    <span>🎁</span>
                                    {s.description}
                                    {s.type === "buy_get_free" &&
                                      s.totalFreeItems > 0 && (
                                        <span className="font-bold text-[10px] underline ml-1">
                                          Apply {s.totalFreeItems} Free
                                        </span>
                                      )}
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
                <button
                  onClick={addRow}
                  className="flex items-center gap-1 text-teal-600 hover:text-teal-800 text-sm font-semibold transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Product Line
                </button>
              </div>
            </div>

            {/* Right Columns - Details Summary */}
            <div className="space-y-6">
              {/* Total Balance */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2">
                  Invoice Breakdown
                </h2>
                <div className="space-y-3.5 text-sm">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Gross Subtotal</span>
                    <span>
                      ₹
                      {subtotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>GST Amount</span>
                    <span>
                      ₹
                      {gstAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 font-medium">
                    <span>Flat Discount (₹)</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-24 form-input text-right font-bold"
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-lg text-slate-900">
                    <span>Grand Total</span>
                    <span className="text-emerald-600">
                      ₹
                      {total.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2">
                  Settlement Type
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      mode: "cash",
                      label: "Cash Payment",
                      icon: Wallet,
                      style:
                        "bg-emerald-50 text-emerald-700 border-emerald-200",
                    },
                    {
                      mode: "upi",
                      label: "UPI/QR Code",
                      icon: Landmark,
                      style: "bg-teal-50 text-teal-700 border-teal-200",
                    },
                    {
                      mode: "card",
                      label: "POS Card",
                      icon: CreditCard,
                      style: "bg-violet-50 text-violet-700 border-violet-200",
                    },
                    {
                      mode: "credit",
                      label: "Book Credit",
                      icon: ClipboardList,
                      style: "bg-rose-50 text-rose-700 border-rose-200",
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.mode}
                        onClick={() => setPaymentMode(item.mode)}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-xs font-bold transition-all duration-150 cursor-pointer ${
                          paymentMode === item.mode
                            ? `${item.style} border-2`
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1.5" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Schemes Panel */}
              {allSchemes.filter((s) => s.isActive).length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h2 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-teal-600" />
                    Active Trade Offers
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {allSchemes.filter((s) => s.isActive).length}
                    </span>
                  </h2>
                  <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                    {allSchemes
                      .filter((s) => s.isActive)
                      .map((s) => (
                        <div
                          key={s.id}
                          className={`rounded-lg p-3 border text-xs ${
                            s.type === "buy_get_free"
                              ? "bg-emerald-50/50 border-emerald-100"
                              : "bg-amber-50/50 border-amber-100"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-800 text-sm leading-snug">
                                {s.name}
                              </p>
                              <p className="text-slate-400 text-[10px] font-semibold mt-1">
                                Manufacturer: {s.company}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 px-2.5 py-0.5 rounded-full font-bold border text-[10px] uppercase ${
                                s.type === "buy_get_free"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-amber-100 text-amber-800 border-amber-200"
                              }`}
                            >
                              {s.type === "buy_get_free"
                                ? `${s.buyQty}+${s.freeQty} Free`
                                : `${s.discountPercent}% Off`}
                            </span>
                          </div>
                          {s.applicableItems?.length > 0 && (
                            <p className="text-slate-500 font-semibold mt-1.5">
                              Applies to: {s.applicableItems.join(", ")}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveBill}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-lg font-bold shadow-md hover:shadow-lg transition cursor-pointer text-sm"
              >
                <Check className="w-5 h-5" />
                Save & Generate Invoice
              </button>
            </div>
          </div>
        </main>
      </div>
    );

  // Number to Words converter for Indian Rupees
  const numberToWords = (num) => {
    const a = [
      "",
      "One ",
      "Two ",
      "Three ",
      "Four ",
      "Five ",
      "Six ",
      "Seven ",
      "Eight ",
      "Nine ",
      "Ten ",
      "Eleven ",
      "Twelve ",
      "Thirteen ",
      "Fourteen ",
      "Fifteen ",
      "Sixteen ",
      "Seventeen ",
      "Eighteen ",
      "Nineteen ",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    if ((num = num.toString()).length > 9) return "overflow";
    let n = ("000000000" + num)
      .substr(-9)
      .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = "";
    str +=
      n[1] != 0
        ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Crore "
        : "";
    str +=
      n[2] != 0
        ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Lakh "
        : "";
    str +=
      n[3] != 0
        ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Thousand "
        : "";
    str +=
      n[4] != 0
        ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "Hundred "
        : "";
    str +=
      n[5] != 0
        ? (str != "" ? "and " : "") +
          (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) +
          "Only"
        : "";
    return str || "Zero";
  };

  if (view === "preview" && activeBill) {
    const totalGst = activeBill.gstAmount || 0;
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;
    const roundOff = (Math.round(activeBill.total) - activeBill.total).toFixed(
      2,
    );
    const grandTotal = Math.round(activeBill.total);

    return (
      <div className="flex min-h-screen bg-slate-100 print:bg-white">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto max-h-screen print:p-0 print:overflow-visible">
          <div className="flex items-center justify-between mb-8 max-w-[210mm] mx-auto print:hidden">
            <button
              onClick={resetForm}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Invoices
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md cursor-pointer transition"
            >
              <Printer className="w-4.5 h-4.5" />
              Print / Save PDF
            </button>
          </div>

          {/* Invoice Page Container */}
          <div
            id="invoice"
            className="bg-white border border-slate-200 rounded-lg max-w-[210mm] mx-auto p-10 print:border-0 print:shadow-none shadow-lg print:p-4 text-xs font-sans text-slate-800 leading-relaxed"
          >
            {/* Invoice Header */}
            <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
              <h1 className="text-3xl font-extrabold uppercase tracking-wide text-slate-900">
                {settings.companyName || "PHARMA DISTRIBUTORS"}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {settings.companyAddress || "123, Wholesale Market, Mumbai, MH"}
              </p>
              <div className="flex justify-center gap-6 mt-2.5 text-slate-600 font-semibold text-[11px]">
                <p>Phone: {settings.companyPhone || "+91-XXXXXXXXXX"}</p>
                <p>DL No: {settings.dlNumber || "MH-MZ3-123456"}</p>
                <p>GSTIN: {settings.gstNumber || "27AAAAA0000A1Z5"}</p>
              </div>
            </div>

            {/* Meta Details Block */}
            <div className="grid grid-cols-2 gap-6 border-b border-slate-300 pb-4 mb-4">
              <div className="pr-4 border-r border-slate-200">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1.5">
                  Billed To
                </p>
                <p className="font-bold uppercase text-slate-900 text-sm">
                  {activeBill.customerName}
                </p>
                <p className="text-slate-600 mt-1">
                  {activeBill.customerAddress || "Walk-in Customer"}
                </p>
                <p className="text-slate-600">
                  Phone: {activeBill.customerPhone || "N/A"}
                </p>
                <p className="mt-2 font-semibold text-slate-800">
                  DL No: {activeBill.customerDl || "N/A"}
                </p>
                {activeBill.customerGst && (
                  <p className="font-semibold text-slate-800">
                    GSTIN: {activeBill.customerGst}
                  </p>
                )}
              </div>
              <div className="pl-4 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span className="font-bold">Invoice No:</span>{" "}
                  <span className="font-mono text-slate-900 font-semibold">
                    {activeBill.billNo}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-bold">Invoice Date:</span>{" "}
                  <span className="text-slate-900 font-semibold">
                    {new Date(activeBill.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-bold">Due Date:</span>{" "}
                  <span className="text-slate-900 font-semibold">
                    {activeBill.dueDate
                      ? new Date(activeBill.dueDate).toLocaleDateString("en-IN")
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-bold">Logistic/Transport:</span>{" "}
                  <span className="text-slate-900 font-semibold">
                    {activeBill.transportDetails || "Hand Delivery"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-bold">Settlement Mode:</span>{" "}
                  <span className="uppercase text-slate-900 font-semibold">
                    {activeBill.paymentMode}
                  </span>
                </div>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-[10px] mb-4 border border-slate-300 border-collapse">
              <thead className="bg-slate-50 border-b border-slate-300">
                <tr>
                  <th className="border-r border-slate-300 p-2 text-center w-10">
                    S.No
                  </th>
                  <th className="border-r border-slate-300 p-2 text-left">
                    Product Name
                  </th>
                  <th className="border-r border-slate-300 p-2 text-center">
                    HSN
                  </th>
                  <th className="border-r border-slate-300 p-2 text-center">
                    Pack
                  </th>
                  <th className="border-r border-slate-300 p-2 text-center">
                    Batch
                  </th>
                  <th className="border-r border-slate-300 p-2 text-center">
                    Exp
                  </th>
                  <th className="border-r border-slate-300 p-2 text-center">
                    Qty
                  </th>
                  <th className="border-r border-slate-300 p-2 text-center">
                    Free
                  </th>
                  <th className="border-r border-slate-300 p-2 text-right">
                    MRP
                  </th>
                  <th className="border-r border-slate-300 p-2 text-right">
                    Rate
                  </th>
                  <th className="border-r border-slate-300 p-2 text-center">
                    GST%
                  </th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {activeBill.items?.map((item, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-200 last:border-b-0"
                  >
                    <td className="border-r border-slate-300 p-2 text-center font-medium text-slate-400">
                      {i + 1}
                    </td>
                    <td className="border-r border-slate-300 p-2 font-bold uppercase text-slate-900">
                      {item.name}
                    </td>
                    <td className="border-r border-slate-300 p-2 text-center text-slate-600">
                      {item.hsn || "—"}
                    </td>
                    <td className="border-r border-slate-300 p-2 text-center text-slate-600">
                      {item.pack || "—"}
                    </td>
                    <td className="border-r border-slate-300 p-2 text-center font-mono text-slate-900 font-semibold">
                      {item.batch || "—"}
                    </td>
                    <td className="border-r border-slate-300 p-2 text-center text-slate-600">
                      {item.expiry
                        ? new Date(item.expiry).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="border-r border-slate-300 p-2 text-center font-bold text-slate-900">
                      {item.qty}
                    </td>
                    <td className="border-r border-slate-300 p-2 text-center text-slate-600">
                      {item.schemeQty || 0}
                    </td>
                    <td className="border-r border-slate-300 p-2 text-right text-slate-600">
                      {parseFloat(item.mrp || 0).toFixed(2)}
                    </td>
                    <td className="border-r border-slate-300 p-2 text-right font-bold text-slate-900">
                      {parseFloat(item.selling_price || 0).toFixed(2)}
                    </td>
                    <td className="border-r border-slate-300 p-2 text-center text-slate-600">
                      {item.gst}%
                    </td>
                    <td className="p-2 text-right font-bold text-slate-950">
                      ₹
                      {parseFloat(item.amount || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals & Footer Info */}
            <div className="flex border border-slate-300 rounded-lg overflow-hidden">
              <div className="w-2/3 p-4 border-r border-slate-300 flex flex-col justify-between space-y-4">
                <div>
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1">
                    Rupees in Words
                  </p>
                  <p className="italic font-bold text-slate-900 text-xs">
                    {numberToWords(grandTotal)}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1">
                    Settlement Account Details
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-700 font-semibold text-[10px]">
                    {settings.bankDetails ||
                      "Bank Name: XYZ Bank\nA/C No: 0000000000\nIFSC: XYZ0000000"}
                  </p>
                </div>
                <div className="text-[9px] text-slate-400">
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[8px] mb-0.5">
                    Terms & Conditions
                  </p>
                  <p className="whitespace-pre-wrap leading-snug">
                    {settings.termsConditions ||
                      "1. Goods once sold will not be taken back.\n2. Interest @ 24% p.a. will be charged if bill is not paid within due date."}
                  </p>
                </div>
              </div>

              <div className="w-1/3 text-xs divide-y divide-slate-200">
                <div className="flex justify-between p-2.5 text-slate-500 font-medium">
                  <span>Subtotal:</span>{" "}
                  <span>
                    ₹
                    {activeBill.subtotal?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 text-slate-500 font-medium">
                  <span>Flat Discount:</span>{" "}
                  <span>
                    ₹
                    {activeBill.discount?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 text-slate-500 font-medium">
                  <span>State GST (SGST):</span>{" "}
                  <span>
                    ₹
                    {sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 text-slate-500 font-medium">
                  <span>Central GST (CGST):</span>{" "}
                  <span>
                    ₹
                    {cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 text-slate-500 font-medium">
                  <span>Round OffAdjustment:</span> <span>₹{roundOff}</span>
                </div>
                <div className="flex justify-between p-3.5 bg-slate-50 font-extrabold text-base text-slate-900">
                  <span>GRAND TOTAL:</span>{" "}
                  <span className="text-emerald-700">
                    ₹
                    {grandTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-end">
              <p className="text-[9px] text-slate-400 italic">
                This is an authenticated computer generated tax invoice.
              </p>
              <div className="text-center w-52 border-t border-slate-800 pt-1.5 mt-8">
                <p className="font-bold text-[10px] text-slate-900">
                  For {settings.companyName || "PHARMA DISTRIBUTORS"}
                </p>
                <p className="text-[9px] mt-1 text-slate-400">
                  Authorized Signatory
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
}
