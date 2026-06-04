import { useEffect, useState, useRef, Fragment } from "react";
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
  ChevronDown,
  ChevronUp,
  Package,
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
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [listFilter, setListFilter] = useState("All"); // Legacy quick filter
  const [advancedSearch, setAdvancedSearch] = useState({
    shop: "",
    period: "All",
    dateFrom: "",
    dateTo: "",
    itemName: "",
    company: "",
    division: ""
  });
  const handleSaveBillRef = useRef(null);

  // Keep handleSaveBillRef always pointing at the latest handleSaveBill
  useEffect(() => { handleSaveBillRef.current = handleSaveBill; });

  // F-key listener for create view
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (view !== "create") return;
      if (e.key === "F2") { e.preventDefault(); document.getElementById('search-product-0')?.focus(); }
      if (e.key === "F3") { e.preventDefault(); document.getElementById('search-customer')?.focus(); }
      if (e.key === "F10") { e.preventDefault(); handleSaveBillRef.current?.(); }
      if (e.key === "Escape") { e.preventDefault(); resetForm(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view]);

  const toggleRow = (id) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  const fetchBills = () => {
    axios
      .get("http://localhost:5000/api/billing", { headers: headers() })
      .then((res) => setBills(res.data))
      .catch((err) => console.error(err));
  };

  const fetchItems = () => {
    axios
      .get("http://localhost:5000/api/items", { headers: headers() })
      .then((res) => setItems(res.data))
      .catch((err) => console.error(err));
  };

  const fetchSchemes = () =>
    axios
      .get("http://localhost:5000/api/schemes", { headers: headers() })
      .then((res) => setAllSchemes(res.data))
      .catch((err) => console.error(err));

  const fetchCustomers = () =>
    axios
      .get("http://localhost:5000/api/customers", { headers: headers() })
      .then((res) => setCustomers(res.data || []))
      .catch((err) => console.error(err));

  const fetchSalesmen = () =>
    axios
      .get("http://localhost:5000/api/salesman", { headers: headers() })
      .then((res) => setSalesmen(res.data || []))
      .catch((err) => console.error(err));

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
      .then((res) => setSettings(res.data || {}))
      .catch((err) => console.error(err));

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

  const calculateAmount = (mrp, qty, _gst) => {
    const base = parseFloat(mrp || 0) * parseInt(qty || 1);
    return parseFloat(base.toFixed(2));
  };

  const handleRowChange = (index, field, value) => {
    // Coerce numeric fields so they aren't stored as strings
    if (field === 'qty' || field === 'schemeQty') value = parseInt(value) || 0;
    if (field === 'gst') value = parseFloat(value) || 0;
    if (field === 'selling_price' || field === 'mrp') value = parseFloat(value) || 0;

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
      const rebuilt = {};
      Object.keys(prev).forEach((key) => {
        const k = parseInt(key);
        if (k < i) rebuilt[k] = prev[k];
        else if (k > i) rebuilt[k - 1] = prev[k];
        // k === i is the deleted row, skip it
      });
      return rebuilt;
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
    try {
      await axios.delete(`http://localhost:5000/api/billing/${id}`, {
        headers: headers(),
      });
      fetchBills();
      fetchItems(); // Refresh items since stock is restored on bill deletion
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to delete bill");
    }
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
  if (view === "list") {
    const handlePeriodChange = (e) => {
      const val = e.target.value;
      let from = "", to = "";
      const today = new Date();
      if (val === "Today") {
        from = to = today.toLocaleDateString('en-CA');
      } else if (val === "Yesterday") {
        const y = new Date(); y.setDate(today.getDate() - 1);
        from = to = y.toLocaleDateString('en-CA');
      } else if (val === "This Month") {
        from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];
      } else if (val === "Last Quarter") {
        const quarter = Math.floor((today.getMonth() - 3) / 3);
        const y = today.getFullYear() + (quarter < 0 ? -1 : 0);
        const q = quarter < 0 ? quarter + 4 : quarter;
        from = new Date(y, q * 3, 1).toISOString().split("T")[0];
        to = new Date(y, q * 3 + 3, 0).toISOString().split("T")[0];
      }
      setAdvancedSearch(p => ({ ...p, period: val, dateFrom: from, dateTo: to }));
    };

    const uniqueCompanies = [...new Set(items.map(i => i.company).filter(Boolean))].sort();
    const uniqueDivisions = [...new Set(items.map(i => i.category).filter(Boolean))].sort();

    const filteredBills = bills.filter(bill => {
      // Shop / Customer Filter
      if (advancedSearch.shop && !bill.customerName?.toLowerCase().includes(advancedSearch.shop.toLowerCase())) return false;
      // Date Filter
      const bDate = bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-CA') : '';
      if (advancedSearch.dateFrom && bDate < advancedSearch.dateFrom) return false;
      if (advancedSearch.dateTo && bDate > advancedSearch.dateTo) return false;
      
      // Item Name Filter
      if (advancedSearch.itemName) {
        const hasItem = bill.items?.some(i => i.name.toLowerCase().includes(advancedSearch.itemName.toLowerCase()));
        if (!hasItem) return false;
      }
      
      // Company Filter
      if (advancedSearch.company) {
        // Find which item names in the master list belong to this company
        const companyItemNames = new Set(items.filter(i => i.company === advancedSearch.company).map(i => i.name));
        const hasCompanyItem = bill.items?.some(i => companyItemNames.has(i.name));
        if (!hasCompanyItem) return false;
      }

      // Division / Category Filter
      if (advancedSearch.division) {
        const divisionItemNames = new Set(items.filter(i => i.category === advancedSearch.division).map(i => i.name));
        const hasDivisionItem = bill.items?.some(i => divisionItemNames.has(i.name));
        if (!hasDivisionItem) return false;
      }

      return true;
    });

    return (
      <div className="flex h-screen bg-[#e5e5e5] font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            
            {/* Page Title Bar */}
            <div className="bg-[#1b4985] text-white px-6 py-3 flex items-center justify-between shadow-md flex-shrink-0">
              <div>
                <h1 className="text-lg font-bold tracking-wide">BILLING & INVOICES</h1>
                <p className="text-xs text-blue-200 opacity-80">Retail & Wholesale Billing Register</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-white/10 px-3 py-1 rounded">Total Invoices: {filteredBills.length}</span>
                <button 
                  onClick={() => setView("create")}
                  className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> F2 New Invoice
                </button>
              </div>
            </div>

            {/* Advanced Search Strip */}
            <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 flex flex-wrap items-end gap-4 text-xs shadow-inner flex-shrink-0">
              <div className="flex flex-col gap-1 w-48">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Shop / Customer</label>
                <input type="text" list="adv-customer-list" value={advancedSearch.shop} onChange={e => setAdvancedSearch(p => ({...p, shop: e.target.value}))}
                  placeholder="Customer Name..." className="border border-gray-400 px-2 py-1 focus:outline-none focus:border-[#1b4985]" />
                <datalist id="adv-customer-list">
                  {customers.map(c => <option key={c.id || c.name} value={c.name} />)}
                </datalist>
              </div>
              <div className="flex flex-col gap-1 w-32">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Period</label>
                <select value={advancedSearch.period} onChange={handlePeriodChange} className="border border-gray-400 px-2 py-1 focus:outline-none focus:border-[#1b4985] bg-white">
                  <option value="All">All Time</option>
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="This Month">This Month</option>
                  <option value="Last Quarter">Last Quarter</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 w-32">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Date From</label>
                <input type="date" value={advancedSearch.dateFrom} onChange={e => setAdvancedSearch(p => ({...p, dateFrom: e.target.value, period: "Custom"}))}
                  className="border border-gray-400 px-2 py-1 focus:outline-none focus:border-[#1b4985]" />
              </div>
              <div className="flex flex-col gap-1 w-32">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Date To</label>
                <input type="date" value={advancedSearch.dateTo} onChange={e => setAdvancedSearch(p => ({...p, dateTo: e.target.value, period: "Custom"}))}
                  className="border border-gray-400 px-2 py-1 focus:outline-none focus:border-[#1b4985]" />
              </div>
              <div className="flex flex-col gap-1 w-48">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Item Name</label>
                <input type="text" list="adv-item-list" value={advancedSearch.itemName} onChange={e => setAdvancedSearch(p => ({...p, itemName: e.target.value}))}
                  placeholder="Contains item..." className="border border-gray-400 px-2 py-1 focus:outline-none focus:border-[#1b4985]" />
                <datalist id="adv-item-list">
                  {[...new Set(items.map(i => i.name))].sort().map(name => <option key={name} value={name} />)}
                </datalist>
              </div>
              <div className="flex flex-col gap-1 w-40">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Company</label>
                <select value={advancedSearch.company} onChange={e => setAdvancedSearch(p => ({...p, company: e.target.value}))} className="border border-gray-400 px-2 py-1 focus:outline-none focus:border-[#1b4985] bg-white">
                  <option value="">All Companies</option>
                  {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1 w-40">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Division</label>
                <select value={advancedSearch.division} onChange={e => setAdvancedSearch(p => ({...p, division: e.target.value}))} className="border border-gray-400 px-2 py-1 focus:outline-none focus:border-[#1b4985] bg-white">
                  <option value="">All Divisions</option>
                  {uniqueDivisions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button className="bg-[#1b4985] text-white px-4 py-1 font-bold shadow hover:bg-blue-900 border border-[#1b4985]">Search</button>
                <button onClick={() => setAdvancedSearch({ shop: "", period: "All", dateFrom: "", dateTo: "", itemName: "", company: "", division: "" })} className="bg-white text-gray-700 px-4 py-1 font-bold shadow hover:bg-gray-100 border border-gray-400">Clear</button>
              </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 overflow-auto bg-white">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="w-8 py-2 px-2 border-r border-gray-200"></th>
                    <th className="py-2 px-3 text-left font-bold text-gray-700 uppercase border-r border-gray-200">Invoice No</th>
                    <th className="py-2 px-3 text-left font-bold text-gray-700 uppercase border-r border-gray-200">Date</th>
                    <th className="py-2 px-3 text-left font-bold text-gray-700 uppercase border-r border-gray-200 w-1/4">Customer</th>
                    <th className="py-2 px-3 text-left font-bold text-gray-700 uppercase border-r border-gray-200">Items Billed</th>
                    <th className="py-2 px-3 text-right font-bold text-gray-700 uppercase border-r border-gray-200">Amount</th>
                    <th className="py-2 px-3 text-center font-bold text-gray-700 uppercase border-r border-gray-200">Status</th>
                    <th className="py-2 px-3 text-center font-bold text-gray-700 uppercase w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => {
                    const isExpanded = expandedRows.has(bill.id || bill._id);
                    return (
                      <Fragment key={bill.id || bill._id}>
                        <tr className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                          <td className="py-1.5 px-2 text-center border-r border-gray-200">
                            <button onClick={() => toggleRow(bill.id || bill._id)} className="text-gray-400 hover:text-[#1b4985] font-bold">
                              {isExpanded ? "[-]" : "[+]"}
                            </button>
                          </td>
                          <td className="py-1.5 px-3 border-r border-gray-200 font-black text-[#1b4985]">{bill.billNo}</td>
                          <td className="py-1.5 px-3 border-r border-gray-200 text-gray-700 font-medium">
                            {new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="py-1.5 px-3 border-r border-gray-200 font-bold text-gray-900">{bill.customerName}</td>
                          <td className="py-1.5 px-3 border-r border-gray-200 text-gray-600">{bill.items?.length || 0} items</td>
                          <td className="py-1.5 px-3 border-r border-gray-200 text-right font-black text-gray-900">₹{(bill.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td className="py-1.5 px-3 border-r border-gray-200 text-center">
                            <span className={`px-2 py-0.5 font-bold uppercase ${bill.status === "paid" ? "text-green-700 bg-green-100" : bill.status === "unpaid" ? "text-red-700 bg-red-100" : "text-amber-700 bg-amber-100"}`}>
                              {bill.status}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => { setActiveBill(bill); setView("preview"); }} className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">View</button>
                              <button onClick={() => handleDelete(bill.id || bill._id)} className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">Del</button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <td colSpan={8} className="p-0">
                              <div className="p-4 ml-8">
                                <table className="w-2/3 border border-gray-300 text-xs bg-white">
                                  <thead className="bg-gray-200">
                                    <tr>
                                      <th className="px-2 py-1 text-left border-r border-gray-300">Item Name</th>
                                      <th className="px-2 py-1 text-left border-r border-gray-300">Batch</th>
                                      <th className="px-2 py-1 text-right border-r border-gray-300">Qty</th>
                                      <th className="px-2 py-1 text-right">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {bill.items?.map((item, idx) => (
                                      <tr key={idx} className="border-b border-gray-200 last:border-b-0">
                                        <td className="px-2 py-1 border-r border-gray-300 font-bold">{item.name}</td>
                                        <td className="px-2 py-1 border-r border-gray-300 text-gray-600">{item.batch || "-"}</td>
                                        <td className="px-2 py-1 border-r border-gray-300 text-right font-black">{item.qty}</td>
                                        <td className="px-2 py-1 text-right font-bold text-[#1b4985]">₹{(item.amount || 0).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {filteredBills.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-500 font-medium">
                        No billing records found matching your advanced filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Shortcut Bar */}
            <div className="bg-gray-100 border-t border-gray-200 px-6 py-2.5 flex items-center gap-6 text-xs text-gray-600 font-bold flex-shrink-0 shadow-inner">
              <button onClick={() => setView("create")} className="flex items-center hover:text-[#1b4985] cursor-pointer"><span className="text-[#1b4985] font-black mr-1">F2</span> New Invoice</button>
              <button className="flex items-center hover:text-red-600 cursor-pointer"><span className="text-red-600 font-black mr-1">Del</span> Delete Invoice</button>
              <button className="flex items-center hover:text-[#1b4985] cursor-pointer"><span className="text-[#1b4985] font-black mr-1">Enter</span> View Details</button>
              <div className="ml-auto flex gap-4">
                <span className="text-[#1b4985]">Total Records: {filteredBills.length}</span>
                <span className="text-green-700">Filter Total: ₹{filteredBills.reduce((s, b) => s + b.total, 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

          </main>
        </div>
      </div>
    );
  }

  // ── CREATE VIEW ──
  // 🟢 CREATE VIEW 🟢
  if (view === "create") {
    const grossAmount = rows.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const sgstAmount = rows.reduce((sum, r) => {
       const a = parseFloat(r.amount || 0);
       const g = parseFloat(r.gst || 0);
       return sum + (a * g / 100) / 2;
    }, 0);
    const cgstAmount = sgstAmount;
    const totalGst = sgstAmount + cgstAmount;
    const finalAmount = grossAmount - parseFloat(discount || 0) + totalGst;
    const grandTotal = Math.round(finalAmount);
    const totalQty = rows.reduce((sum, r) => sum + parseInt(r.qty || 0), 0);
    const totalFree = rows.reduce((sum, r) => sum + parseInt(r.schemeQty || 0), 0);

    const activeCustomerData = customers.find(c => c.name.toLowerCase() === (customer?.name || "").toLowerCase()) || {};
    
    // Fill empty rows for visual structure
    const MIN_ROWS = 15;
    const emptyRowsCount = Math.max(0, MIN_ROWS - rows.length);
    const emptyRows = Array.from({ length: emptyRowsCount });

    return (
      <div className="flex min-h-screen bg-[#1b4985] font-sans text-xs">
        <Sidebar />
        <main className="flex-1 overflow-y-hidden max-h-screen flex flex-col p-1 gap-1">
          {/* TOP HEADER SECTION */}
          <div className="flex bg-[#1b4985] border border-white text-white p-1 shrink-0 gap-2">
            
            {/* Column 1: Customer Details */}
            <div className="w-[32%] border border-slate-500 p-1">
              <h3 className="font-bold border-b border-slate-500 pb-1 mb-1">Customer Details</h3>
              <div className="grid grid-cols-[100px_1fr] gap-y-1 items-center">
                <label className="text-[10px]">Customer Name</label>
                <input list="customer-list" value={customer.name} onChange={e => handleCustomerSelect(e.target.value)} className="bg-white text-black px-1 py-0.5 outline-none w-full" />
                <datalist id="customer-list">{customers.map(c => <option key={c.id} value={c.name} />)}</datalist>
                
                <label className="text-[10px]">Customer ID</label>
                <input value={activeCustomerData.id || "001000003"} readOnly className="bg-white text-black px-1 py-0.5 outline-none w-full" />
                
                <label className="text-[10px]">Address</label>
                <input value={activeCustomerData.address || "Address"} readOnly className="bg-white text-black px-1 py-0.5 outline-none w-full h-8" />
                
                <label className="text-[10px]">Contact</label>
                <input value={activeCustomerData.phone || "(097) 8617660"} readOnly className="bg-white text-black px-1 py-0.5 outline-none w-full" />
                
                <label className="text-[10px]">Contact 2</label>
                <input value="RATIUNISIH,196TH" readOnly className="bg-white text-black px-1 py-0.5 outline-none w-full" />
                
                <label className="text-[10px]">Custom Number</label>
                <input className="bg-white text-black px-1 py-0.5 outline-none w-full" />
                
                <label className="text-[10px]">Current Number</label>
                <input className="bg-white text-black px-1 py-0.5 outline-none w-full" />
                
                <label className="text-[10px]">Spend Year</label>
                <select className="bg-white text-black px-1 py-0.5 outline-none w-24">
                  <option>2010</option>
                  <option>2023</option>
                </select>
              </div>
            </div>

            {/* Column 2: Shop Details */}
            <div className="w-[38%] border border-slate-500 p-1">
              <h3 className="font-bold border-b border-slate-500 pb-1 mb-1">Shop Details</h3>
              <div className="grid grid-cols-[90px_1fr] gap-y-1">
                <label className="text-[10px] mt-0.5">Active Scheme</label>
                <select className="bg-white text-black px-1 py-0.5 outline-none w-full"><option>Selects Scheme</option></select>
                
                <label className="text-[10px] mt-0.5">Active Options</label>
                <select size="4" className="bg-white text-black px-1 py-0.5 outline-none w-full text-[10px]">
                  {allSchemes.slice(0,4).map((s, idx) => <option key={idx} selected={idx===0}>{s.name}</option>)}
                  <option selected>Active Srawa Options</option>
                  <option>Active Prays Option</option>
                  <option>Active Translars Options</option>
                  <option>Active Growd Options</option>
                </select>
                
                <label className="text-[10px] mt-1">Contact</label>
                <input className="bg-white text-black px-1 py-0.5 outline-none w-full mt-1" />
                
                <label className="text-[10px] mt-0.5">Installation</label>
                <input value="Billine Waese" className="bg-white text-black px-1 py-0.5 outline-none w-full mt-0.5" />
                
                <label className="text-[10px] mt-0.5">Distribute</label>
                <input value="Active Channels" className="bg-white text-black px-1 py-0.5 outline-none w-full mt-0.5" />
                
                <label className="text-[10px] mt-0.5">Credit Type</label>
                <select className="bg-white text-black px-1 py-0.5 outline-none w-full mt-0.5"><option></option></select>
              </div>
            </div>

            {/* Column 3: Key Info */}
            <div className="flex-1 border border-slate-500 p-1 flex flex-col">
              <h3 className="font-bold border-b border-slate-500 pb-1 mb-1">Key Info</h3>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px]">New Unit Code</span>
                <input value="01/6/2020" className="bg-[#a8c6e6] text-black px-1 py-0.5 outline-none w-24 text-right" readOnly />
              </div>
              <div className="text-[10px] mb-1">Account Credit Balance</div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px]">GST Libete</span>
                <input value="$120.00" className="bg-[#a8c6e6] text-black px-1 py-0.5 outline-none w-24 text-right" readOnly />
              </div>
              <div className="flex justify-end mb-2">
                <label className="text-[10px] flex items-center gap-1"><input type="checkbox" checked readOnly/> Restricted</label>
              </div>
              
              <div className="flex justify-between mb-2">
                 <span className="text-[10px] w-20 leading-tight">Current Credit<br/>Balance</span>
                 <div className="w-24 bg-[#ffcc99] text-black text-center text-[10px] font-bold py-1 border border-slate-600">
                    <div>${(activeCustomerData.creditLimit || 12).toFixed(2)}</div>
                    <div>-${(activeCustomerData.openingBalance || 0).toFixed(2)}</div>
                 </div>
              </div>
              <div className="flex justify-between">
                 <span className="text-[10px] w-20 leading-tight">Current Credit<br/>Balance</span>
                 <div className="w-24 bg-[#cc0000] text-white text-center text-[10px] font-bold py-1 border border-slate-600">
                    <div>$0.00</div>
                    <div>-$0.00</div>
                 </div>
              </div>
            </div>
          </div>

          {/* GRID SECTION */}
          <div className="flex-1 flex flex-col bg-white border border-[#1b4985] min-h-0 overflow-y-auto relative">
             <table className="w-full text-left border-collapse whitespace-nowrap text-[11px]">
               <thead className="sticky top-0 bg-[#1b4985] text-white z-10 font-normal">
                 <tr>
                   <th className="px-1 border-r border-slate-400 w-6 text-center"></th>
                   <th className="px-1 border-r border-slate-400 w-1/3">Product</th>
                   <th className="px-1 border-r border-slate-400 text-center w-24">Batch</th>
                   <th className="px-1 border-r border-slate-400 text-center w-24">Expiry</th>
                   <th className="px-1 border-r border-slate-400 text-center w-12">Qty</th>
                   <th className="px-1 border-r border-slate-400 text-center w-12">Free</th>
                   <th className="px-1 border-r border-slate-400 text-center w-16">MRP</th>
                   <th className="px-1 border-r border-slate-400 text-center w-16">Rate</th>
                   <th className="px-1 text-center w-20">Net</th>
                 </tr>
                 {/* Fake Filter Row exactly like image */}
                 <tr className="bg-slate-200 text-black border-b border-slate-400">
                   <td className="border-r border-slate-400"></td>
                   <td className="px-0.5 border-r border-slate-400">
                     <div className="flex bg-white border border-slate-400 items-center px-1 text-slate-400">Search Dropdown... <span className="ml-auto">🔍</span></div>
                   </td>
                   <td className="px-0.5 border-r border-slate-400"><div className="flex bg-white border border-slate-400 items-center px-1 text-slate-400 justify-between">Batch <span>▼</span></div></td>
                   <td className="px-0.5 border-r border-slate-400"><div className="flex bg-white border border-slate-400 items-center px-1 text-slate-400 justify-between">Expiry <span>▼</span></div></td>
                   <td className="border-r border-slate-400"></td><td className="border-r border-slate-400"></td><td className="border-r border-slate-400"></td><td className="border-r border-slate-400"></td><td></td>
                 </tr>
               </thead>
               <tbody>
                 {rows.map((row, i) => {
                   const isLowStock = row.availableQty !== null && (row.availableQty + (row.availableSchemeQty || 0)) <= (row.reorderPoint ?? 10);
                   let isNearExpiry = false;
                   if (row.expiry) {
                     const expDate = new Date(row.expiry);
                     const diffTime = expDate - new Date();
                     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                     isNearExpiry = diffDays > 0 && diffDays <= 60;
                   }
                   return (
                   <tr key={i} className={`border-b border-slate-300 text-black ${i%2===0?'bg-[#e6f0fa]':'bg-white'}`}>
                     <td className="px-1 border-r border-slate-300 text-center">{i+1}</td>
                     <td className="px-1 border-r border-slate-300 flex items-center justify-between">
                       <input list={`item-list-${i}`} value={row.searchStr !== undefined ? row.searchStr : row.name} onChange={(e) => handleItemSelect(i, e.target.value)} className="bg-transparent outline-none w-full text-black" />
                       <datalist id={`item-list-${i}`}>{items.map(it => <option key={it.id} value={`${it.name}${it.batch ? ' | B: ' + it.batch : ''}`} />)}</datalist>
                       {isNearExpiry && !isLowStock && <span className="bg-[#ff9900] text-black font-bold px-1 py-0.5 ml-1 text-[9px] shrink-0">Near Expiry</span>}
                       {isLowStock && <span className="bg-[#cc0000] text-white font-bold px-1 py-0.5 ml-1 text-[9px] shrink-0">Low Stock</span>}
                     </td>
                     <td className="px-1 border-r border-slate-300 text-left">{row.batch || "000001"}</td>
                     <td className="px-1 border-r border-slate-300 text-left">{row.expiry ? new Date(row.expiry).toLocaleDateString('en-GB').replace(/\//g,'-') : '05-01-2023'}</td>
                     <td className="px-1 border-r border-slate-300 text-right"><input type="number" min="1" value={row.qty} onChange={e => handleRowChange(i, "qty", e.target.value)} className="w-full text-right bg-transparent outline-none text-black" /></td>
                     <td className="px-1 border-r border-slate-300 text-right"><input type="number" min="0" value={row.schemeQty} onChange={e => handleRowChange(i, "schemeQty", e.target.value)} className="w-full text-right bg-transparent outline-none text-black" /></td>
                     <td className="px-1 border-r border-slate-300 text-right">{parseFloat(row.mrp||100).toFixed(2)}</td>
                     <td className="px-1 border-r border-slate-300 text-right"><input type="number" value={row.selling_price} onChange={e => handleRowChange(i, "selling_price", e.target.value)} className="w-full text-right bg-transparent outline-none text-black" /></td>
                     <td className="px-1 text-right">{(parseFloat(row.amount||0)).toFixed(2)}</td>
                   </tr>
                 )})}
                 {emptyRows.map((_, i) => (
                    <tr key={`empty-${i}`} className={`border-b border-slate-300 ${(i+rows.length)%2===0?'bg-[#e6f0fa]':'bg-white'} h-[21px]`}>
                      <td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td></td>
                    </tr>
                 ))}
               </tbody>
             </table>
          </div>

          {/* TOTALS SECTION */}
          <div className="bg-[#1b4985] text-white flex flex-col shrink-0 border border-white p-0.5">
             <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr] text-[10px]">
                {/* Col 1 */}
                <div className="border-r border-white/20 p-1">
                   <div className="flex justify-between items-center mb-0.5"><span>Total</span><input readOnly value={grossAmount.toFixed(2)} className="w-20 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center mb-0.5"><span>GST</span><input readOnly value={totalGst.toFixed(2)} className="w-20 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center mb-0.5"><span>GST 7%</span><input readOnly value="176.00" className="w-20 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center mb-0.5"><span>GST 12%</span><input readOnly value="238.00" className="w-20 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center"><span>Total Total</span><input readOnly value={(grossAmount + totalGst).toFixed(2)} className="w-20 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                </div>
                {/* Col 2 */}
                <div className="border-r border-white/20 p-1">
                   <div className="flex justify-between items-center mb-0.5"><span>GST</span><input readOnly value="0.00" className="w-16 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center mb-0.5"><span>GST %</span><input readOnly value="0.00" className="w-16 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center mb-0.5"><span>GST %</span><input readOnly value="0.00" className="w-16 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center mb-0.5"><span>GST 4</span><input readOnly value="0.00" className="w-16 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center"><span>GST</span><input readOnly value="0.00" className="w-16 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                </div>
                {/* Col 3 */}
                <div className="border-r border-white/20 p-1">
                   <div className="flex justify-between items-center mb-0.5"><span>GST</span><input readOnly value="0.00" className="w-16 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center mb-0.5"><span>GST %</span><input readOnly value="0.00" className="w-16 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center mb-0.5"><span>GST %</span><input readOnly value="0.00" className="w-16 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center mb-0.5"><span>GST 4</span><input readOnly value="0.00" className="w-16 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center"><span>GST %</span><input readOnly value="0.00" className="w-16 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                </div>
                {/* Col 4 */}
                <div className="p-1">
                   <div className="flex justify-between items-center mb-0.5"><span>Comprehensive Bt Total</span><span className="w-20 text-right text-[#a8c6e6]">{grandTotal.toFixed(2)}</span></div>
                   <div className="flex justify-between items-center mb-0.5"><span>GST Total</span><span className="w-20 text-right text-[#a8c6e6]">{totalGst.toFixed(2)}</span></div>
                   <div className="flex justify-between items-center mb-0.5"><span>GST Free</span><span className="w-20 text-right text-[#a8c6e6]">80.00</span></div>
                   <div className="flex justify-between items-center mb-0.5"><span>Credit Code</span><span className="w-20 text-right text-[#a8c6e6]">0.00</span></div>
                   <div className="flex justify-between items-center font-bold"><span>Credit Total</span><span className="w-20 text-right text-[#a8c6e6]">{(grandTotal + 100).toFixed(2)}</span></div>
                </div>
             </div>
          </div>

          {/* BOTTOM BUTTONS */}
          <div className="flex justify-between bg-[#1b4985] p-1 gap-1 shrink-0">
             <div className="flex gap-1 flex-1">
               <button onClick={handleSaveBill} className="bg-[#1b4985] text-white border border-white hover:bg-[#255b9e] text-[10px] w-12 text-center py-0.5 leading-tight">F10<br/>Save</button>
               <button className="bg-[#1b4985] text-white border border-white hover:bg-[#255b9e] text-[10px] w-12 text-center py-0.5 leading-tight">F11<br/>Mover</button>
               <button className="bg-[#1b4985] text-white border border-white hover:bg-[#255b9e] text-[10px] w-12 text-center py-0.5 leading-tight">F12<br/>Fast</button>
               <button className="bg-[#1b4985] text-white border border-white hover:bg-[#255b9e] text-[10px] w-12 text-center py-0.5 leading-tight">F13<br/>Delete</button>
               <button className="bg-[#1b4985] text-white border border-white hover:bg-[#255b9e] text-[10px] w-14 text-center py-0.5 leading-tight">F14<br/>Shortcut</button>
               <button className="bg-[#1b4985] text-white border border-white hover:bg-[#255b9e] text-[10px] w-16 text-center py-0.5 leading-tight">F15<br/>Shortcuts</button>
               <button className="bg-[#1b4985] text-white border border-white hover:bg-[#255b9e] text-[10px] w-12 text-center py-0.5 leading-tight">F17<br/>Count</button>
             </div>
             <div className="flex gap-1">
               <button onClick={resetForm} className="bg-[#1b4985] text-white border border-white hover:bg-[#255b9e] text-[10px] w-12 text-center py-0.5 leading-tight">F18<br/>Cancel</button>
               <button onClick={() => setView('list')} className="bg-[#1b4985] text-white border border-white hover:bg-[#255b9e] text-[10px] w-12 text-center py-0.5 leading-tight flex items-center justify-center">Close</button>
             </div>
          </div>
        </main>
      </div>
    );
  }



  // Number to Words converter for Indian Rupees
  const numberToWords = (num) => {
    num = Math.abs(Math.round(Number(num)));
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

  return null;
}
