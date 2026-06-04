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
  if (view === "create") {
    // Totals calculations
    const grossAmount = rows.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const sgstAmount = rows.reduce((sum, r) => {
       const a = parseFloat(r.amount || 0);
       const g = parseFloat(r.gst || 0);
       return sum + (a * g / 100) / 2;
    }, 0);
    const cgstAmount = sgstAmount;
    const totalGst = sgstAmount + cgstAmount;
    const finalAmount = grossAmount - parseFloat(discount || 0) + totalGst;
    const roundOff = (Math.round(finalAmount) - finalAmount).toFixed(2);
    const grandTotal = Math.round(finalAmount);
    const totalQty = rows.reduce((sum, r) => sum + parseInt(r.qty || 0), 0);
    const totalFree = rows.reduce((sum, r) => sum + parseInt(r.schemeQty || 0), 0);
    


    return (
      <div className="flex min-h-screen bg-slate-200 font-sans">
        <Sidebar />
        <main className="flex-1 p-2 overflow-y-hidden max-h-screen flex flex-col">
          {/* TOP HEADER SECTION */}
          <div className="flex gap-2 mb-2 shrink-0">
            {/* Customer Card */}
            <div className="bg-white rounded p-3 shadow flex-1 border-t-4 border-t-teal-600">
              <div className="flex justify-between items-center mb-2 border-b pb-1 border-slate-100">
                <h2 className="font-bold text-sm text-teal-800 uppercase tracking-wide">Customer Details [F3]</h2>
                <div className="flex gap-2">
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded">Credit: —</span>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">30 Days</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block uppercase mb-1">Name/Code</label>
                  <input id="search-customer" type="text" list="customer-list" value={customer.name} onChange={(e) => handleCustomerSelect(e.target.value)} className="w-full border-b border-slate-300 focus:border-teal-500 outline-none py-1 bg-yellow-50 font-bold px-1" placeholder="Search Cust..." />
                  <datalist id="customer-list">{customers.map(c => <option key={c.id} value={c.name} />)}</datalist>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block uppercase mb-1">Mobile</label>
                  <input type="text" value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})} className="w-full border-b border-slate-300 outline-none py-1 px-1 font-semibold" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block uppercase mb-1">GSTIN</label>
                  <input type="text" value={customer.gstNumber} onChange={(e) => setCustomer({...customer, gstNumber: e.target.value})} className="w-full border-b border-slate-300 outline-none py-1 px-1 font-semibold" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block uppercase mb-1">DL Number</label>
                  <input type="text" value={customer.dlNumber} onChange={(e) => setCustomer({...customer, dlNumber: e.target.value})} className="w-full border-b border-slate-300 outline-none py-1 px-1 font-semibold" />
                </div>
              </div>
            </div>

            {/* Document Card */}
            <div className="bg-white rounded p-3 shadow w-[350px] border-t-4 border-t-amber-500">
              <h2 className="font-bold text-sm text-amber-800 uppercase tracking-wide mb-2 border-b pb-1 border-slate-100">Document Info</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                 <div className="flex justify-between border-b border-dashed border-slate-200 pb-1"><span className="text-slate-500 font-medium">Entry No:</span><span className="font-bold text-rose-600">NEW</span></div>
                 <div className="flex justify-between border-b border-dashed border-slate-200 pb-1"><span className="text-slate-500 font-medium">Date:</span><span className="font-bold">{new Date().toLocaleDateString('en-GB')}</span></div>
                 <div className="flex justify-between border-b border-dashed border-slate-200 pb-1 items-center"><span className="text-slate-500 font-medium">Due Date:</span><input type="date" value={customer.dueDate} onChange={e => setCustomer({...customer, dueDate: e.target.value})} className="w-24 outline-none text-right font-semibold bg-transparent" /></div>
                 <div className="flex justify-between border-b border-dashed border-slate-200 pb-1 items-center"><span className="text-slate-500 font-medium">Salesman:</span><select value={selectedSalesman.name} onChange={e => { const found = salesmen.find(s => s.name === e.target.value); setSelectedSalesman(found ? { id: found.id, name: found.name } : { id: '', name: '' }); }} className="w-24 outline-none text-right bg-transparent font-semibold"><option value="">Direct</option>{salesmen.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
              </div>
            </div>
          </div>

          {/* GRID SECTION */}
          <div className="flex-1 bg-white rounded shadow flex flex-col min-h-0 border-t-4 border-t-blue-600 relative overflow-hidden">
             <div className="overflow-auto flex-1">
               <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                 <thead className="sticky top-0 bg-blue-900 text-white z-10 text-[10px] uppercase tracking-wider">
                   <tr>
                     <th className="px-2 py-2 border-r border-blue-800 w-8 text-center">S.N</th>
                     <th className="px-2 py-2 border-r border-blue-800 w-1/4">Product Name [F2]</th>
                     <th className="px-2 py-2 border-r border-blue-800 text-center w-16">Pack</th>
                     <th className="px-2 py-2 border-r border-blue-800 text-center w-24">Batch [F4]</th>
                     <th className="px-2 py-2 border-r border-blue-800 text-center w-16">Expiry</th>
                     <th className="px-2 py-2 border-r border-blue-800 text-right w-16">Stock</th>
                     <th className="px-2 py-2 border-r border-blue-800 text-right text-yellow-300 w-16">Qty</th>
                     <th className="px-2 py-2 border-r border-blue-800 text-right text-emerald-300 w-12">Free</th>
                     <th className="px-2 py-2 border-r border-blue-800 text-right w-20">MRP</th>
                     <th className="px-2 py-2 border-r border-blue-800 text-right w-20">Rate</th>
                     <th className="px-2 py-2 border-r border-blue-800 text-center w-12">GST%</th>
                     <th className="px-3 py-2 text-right font-bold w-24">Amount</th>
                     <th className="px-2 py-2 text-center w-8">X</th>
                   </tr>
                 </thead>
                 <tbody>
                   {rows.map((row, i) => {
                     const isLowStock = row.availableQty !== null && (row.availableQty + (row.availableSchemeQty || 0)) <= 0;
                     return (
                     <tr key={i} className="border-b border-slate-200 hover:bg-slate-50 focus-within:bg-blue-50/50 transition-colors">
                       <td className="px-2 py-1.5 text-center text-slate-400 font-medium">{i+1}</td>
                       <td className="px-2 py-1.5 border-r border-slate-200">
                         <input id={`search-product-${i}`} list={`item-list-${i}`} value={row.searchStr !== undefined ? row.searchStr : row.name} onChange={(e) => handleItemSelect(i, e.target.value)} className="w-full bg-transparent outline-none font-bold text-slate-900 placeholder:text-slate-300 uppercase" placeholder="Product search..." />
                         <datalist id={`item-list-${i}`}>{items.map(it => <option key={it.id} value={`${it.name}${it.batch ? ' | Batch: ' + it.batch : ''}`} />)}</datalist>
                       </td>
                       <td className="px-2 py-1.5 border-r border-slate-200 text-center text-slate-500 font-medium">{row.unit || 'STRIP'}</td>
                       <td className="px-2 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-slate-700">{row.batch}</td>
                       <td className="px-2 py-1.5 border-r border-slate-200 text-center text-rose-600 font-bold">{row.expiry ? new Date(row.expiry).toLocaleDateString('en-GB').substring(0,5) : ''}</td>
                       <td className={`px-2 py-1.5 border-r border-slate-200 text-right font-bold ${isLowStock ? 'text-rose-600 bg-rose-50/80' : 'text-emerald-600'}`}>{row.availableQty !== null ? row.availableQty : '-'}</td>
                       <td className="px-2 py-1.5 border-r border-slate-200 bg-yellow-50/30">
                         <input type="number" min="1" value={row.qty} onChange={e => handleRowChange(i, "qty", e.target.value)} className="w-full text-right bg-transparent outline-none font-bold text-blue-900 border-b border-slate-300 focus:border-blue-500 transition-colors" />
                       </td>
                       <td className="px-2 py-1.5 border-r border-slate-200 bg-emerald-50/30">
                         <input type="number" min="0" value={row.schemeQty} onChange={e => handleRowChange(i, "schemeQty", e.target.value)} className="w-full text-right bg-transparent outline-none font-bold text-emerald-700 border-b border-slate-300 focus:border-emerald-500 transition-colors" />
                       </td>
                       <td className="px-2 py-1.5 border-r border-slate-200 text-right text-slate-500 font-medium">{parseFloat(row.mrp||0).toFixed(2)}</td>
                       <td className="px-2 py-1.5 border-r border-slate-200">
                         <input type="number" value={row.selling_price} onChange={e => handleRowChange(i, "selling_price", e.target.value)} className="w-full text-right bg-transparent outline-none font-bold text-slate-900 border-b border-slate-300 focus:border-slate-500" />
                       </td>
                       <td className="px-2 py-1.5 border-r border-slate-200 text-center">
                         <select value={row.gst} onChange={e => handleRowChange(i, "gst", e.target.value)} className="bg-transparent outline-none appearance-none text-center font-bold text-slate-700 w-full cursor-pointer">
                           {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                         </select>
                       </td>
                       <td className="px-3 py-1.5 font-bold text-right text-slate-900 bg-slate-50/50">₹{parseFloat(row.amount||0).toFixed(2)}</td>
                       <td className="px-2 py-1.5 text-center">
                         {rows.length > 1 && <button onClick={() => removeRow(i)} className="text-rose-400 font-bold hover:bg-rose-100 hover:text-rose-600 rounded px-2 transition-colors">×</button>}
                       </td>
                     </tr>
                   )})}
                 </tbody>
               </table>
             </div>
             
             {/* Quick Info Bar for Active Row */}
             <div className="bg-yellow-50 border-t border-yellow-200 px-3 py-1.5 flex items-center gap-6 text-[11px] text-yellow-800 font-bold shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <span className="flex items-center gap-1 bg-yellow-100 px-2 py-0.5 rounded text-yellow-900"><AlertCircle className="w-3.5 h-3.5" /> F5 - Apply Scheme</span>
                <span className="flex items-center gap-1"><span className="text-yellow-600/70 font-medium">Margin:</span> 12.5%</span>
                <span className="flex items-center gap-1"><span className="text-yellow-600/70 font-medium">PTR:</span> ₹45.00</span>
                <span className="flex items-center gap-1"><span className="text-yellow-600/70 font-medium">PTS:</span> ₹52.00</span>
                <span className="flex items-center gap-1"><span className="text-yellow-600/70 font-medium">Location:</span> RACK-A-12</span>
                <div className="ml-auto text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <Package className="w-3.5 h-3.5"/> Scheme Active: 10+1 Free
                </div>
             </div>
          </div>

          {/* SUMMARY SECTION */}
          <div className="mt-2 flex gap-2 shrink-0 h-[100px]">
             {/* Note & Shortcuts */}
             <div className="w-1/4 bg-slate-800 rounded text-slate-300 p-2.5 text-[10px] flex flex-col justify-between shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none"></div>
               <div>
                 <p className="font-bold text-white mb-1.5 uppercase tracking-wider border-b border-slate-700 pb-1 text-[9px] flex items-center gap-1"><ClipboardList className="w-3 h-3"/> System Hotkeys</p>
                 <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                   <span className="flex justify-between items-center bg-slate-700/50 px-1.5 py-0.5 rounded"><span className="text-slate-400">Search Item</span><span className="font-mono text-emerald-400 font-bold">F2</span></span>
                   <span className="flex justify-between items-center bg-slate-700/50 px-1.5 py-0.5 rounded"><span className="text-slate-400">Search Cust</span><span className="font-mono text-emerald-400 font-bold">F3</span></span>
                   <span className="flex justify-between items-center bg-slate-700/50 px-1.5 py-0.5 rounded"><span className="text-slate-400">Change Batch</span><span className="font-mono text-emerald-400 font-bold">F4</span></span>
                   <span className="flex justify-between items-center bg-slate-700/50 px-1.5 py-0.5 rounded"><span className="text-slate-400">Save Bill</span><span className="font-mono text-emerald-400 font-bold">F10</span></span>
                   <span className="flex justify-between items-center bg-slate-700/50 px-1.5 py-0.5 rounded"><span className="text-slate-400">Save+Print</span><span className="font-mono text-emerald-400 font-bold">F12</span></span>
                   <span className="flex justify-between items-center bg-slate-700/50 px-1.5 py-0.5 rounded"><span className="text-slate-400">Cancel</span><span className="font-mono text-rose-400 font-bold">ESC</span></span>
                 </div>
               </div>
             </div>

             {/* GST Summary */}
             <div className="w-1/4 bg-white rounded shadow-sm p-3 text-xs border border-slate-200 grid grid-cols-2 gap-x-2 text-right items-center">
                <span className="text-slate-500 text-left font-bold uppercase tracking-wider text-[9px]">Taxable Amt</span>
                <span className="font-bold text-slate-800">₹{grossAmount.toFixed(2)}</span>
                <span className="text-slate-500 text-left font-bold uppercase tracking-wider text-[9px]">SGST</span>
                <span className="font-bold text-slate-800">₹{sgstAmount.toFixed(2)}</span>
                <span className="text-slate-500 text-left font-bold uppercase tracking-wider text-[9px]">CGST</span>
                <span className="font-bold text-slate-800">₹{cgstAmount.toFixed(2)}</span>
                <span className="text-slate-500 text-left font-bold uppercase tracking-wider text-[9px]">IGST</span>
                <span className="font-bold text-slate-800">₹0.00</span>
             </div>

             {/* Final Totals */}
             <div className="flex-1 bg-white rounded shadow-sm p-2 border border-slate-200 flex text-xs">
                <div className="flex-1 grid grid-cols-2 gap-y-1.5 pr-4 border-r border-slate-200 items-center pl-2">
                   <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Total Items/Qty</span>
                   <span className="font-bold text-right text-slate-800 bg-slate-50 py-0.5 px-2 rounded">{rows.length} <span className="text-slate-400 mx-1">|</span> {totalQty}</span>
                   
                   <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Gross Amt</span>
                   <span className="font-bold text-right text-slate-800">₹{grossAmount.toFixed(2)}</span>
                   
                   <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Discount [-]</span>
                   <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="text-right font-bold text-rose-600 bg-rose-50 border border-rose-200 outline-none w-20 justify-self-end px-1 rounded" />
                   
                   <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Round Off</span>
                   <span className="font-bold text-right text-slate-800">₹{roundOff}</span>
                </div>
                <div className="w-56 pl-5 flex flex-col justify-center items-end bg-emerald-50 rounded-r -my-2 -mr-2 pr-5 border-l border-emerald-100 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/40 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                   <span className="text-emerald-800 font-bold uppercase tracking-widest text-[10px] mb-1 relative z-10">Grand Total</span>
                   <span className="text-5xl font-black text-emerald-600 tracking-tighter relative z-10 drop-shadow-sm">₹{grandTotal}</span>
                   <button onClick={handleSaveBill} className="mt-3 bg-emerald-600 text-white font-bold uppercase tracking-wider text-[11px] px-4 py-2 rounded shadow-md hover:bg-emerald-700 transition w-full flex items-center justify-center gap-1.5 relative z-10"><Check className="w-3.5 h-3.5"/> Save Bill [F10]</button>
                </div>
             </div>
          </div>
        </main>
        
        {/* Right Quick Panel */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col p-3 gap-3 overflow-y-auto shrink-0 shadow-[-10px_0_20px_rgba(0,0,0,0.1)] border-l border-slate-800">
          <div className="text-center pb-3 border-b border-slate-700/50 mt-1">
             <h3 className="uppercase tracking-widest text-slate-400 font-bold text-[9px] mb-1.5 flex items-center justify-center gap-1.5"><Wallet className="w-3 h-3"/> Today's Collection</h3>
             <p className="text-3xl font-black text-emerald-400 tracking-tight text-shadow-sm">₹1,42,500</p>
          </div>
          
          <div className="bg-slate-800/80 rounded border border-slate-700/50 p-2.5 text-xs shadow-inner">
            <h4 className="uppercase font-bold text-[10px] text-amber-400 border-b border-slate-700 pb-1.5 mb-2 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Near Expiry</h4>
            <ul className="space-y-1.5">
              <li className="flex justify-between items-center text-slate-300 bg-slate-700/30 p-1.5 rounded"><span className="font-medium">Dolo 650 (B-19X)</span><span className="text-amber-400 font-bold text-[10px] bg-amber-400/10 px-1.5 py-0.5 rounded">12 Days</span></li>
              <li className="flex justify-between items-center text-slate-300 bg-slate-700/30 p-1.5 rounded"><span className="font-medium">Calpol (A-22)</span><span className="text-amber-400 font-bold text-[10px] bg-amber-400/10 px-1.5 py-0.5 rounded">28 Days</span></li>
            </ul>
          </div>

          <div className="bg-slate-800/80 rounded border border-slate-700/50 p-2.5 text-xs shadow-inner">
            <h4 className="uppercase font-bold text-[10px] text-blue-400 border-b border-slate-700 pb-1.5 mb-2 flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Low Stock</h4>
            <ul className="space-y-1.5">
              <li className="flex justify-between items-center text-slate-300 bg-slate-700/30 p-1.5 rounded"><span className="font-medium">Augmentin 625</span><span className="text-rose-400 font-bold text-[10px] bg-rose-400/10 px-1.5 py-0.5 rounded">2 Box</span></li>
              <li className="flex justify-between items-center text-slate-300 bg-slate-700/30 p-1.5 rounded"><span className="font-medium">Vicks Vaporub</span><span className="text-rose-400 font-bold text-[10px] bg-rose-400/10 px-1.5 py-0.5 rounded">4 Box</span></li>
            </ul>
          </div>
          
          <button onClick={resetForm} className="mt-auto bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 border border-slate-700 transition-colors shadow-sm"><ArrowLeft className="w-3.5 h-3.5" /> Exit Entry [ESC]</button>
        </aside>
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
