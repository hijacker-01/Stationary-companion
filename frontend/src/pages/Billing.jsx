import { useEffect, useState, useRef, Fragment, lazy, Suspense } from "react";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
// Lazy-loaded: pulls in html5-qrcode (~250KB), only needed when the scan modal opens.
const BarcodeScannerModal = lazy(() => import("../components/BarcodeScannerModal"));
import SmartSelect from "../components/SmartSelect";
import PartyHistoryModal from "../components/PartyHistoryModal";
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
import { useConfirm } from "../hooks/useConfirm";
import { advanceFocusFrom, focusFirstField } from "../utils/focusHelpers";

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
  disc: 0,
  amount: 0,
  availableQty: null,
  availableSchemeQty: null,
};

const fmt = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    date: new Date().toISOString().slice(0, 10),
  });
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [activeBill, setActiveBill] = useState(null);
  const [rowSchemes, setRowSchemes] = useState({}); // { rowIndex: [scheme, ...] }
  const [allSchemes, setAllSchemes] = useState([]);
  const [settings, setSettings] = useState({});
  const [customers, setCustomers] = useState([]);
  const [partyHistory, setPartyHistory] = useState(null); // { loading, customer, entries, balance, error } | null
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
  const [showScanner, setShowScanner] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownIndex, setDropdownIndex] = useState(0);
  // Wizard: 1 New · 2 Select Party · 3 Party Status · 4 Bill Entry
  const [step, setStep] = useState(1);
  const [partySearch, setPartySearch] = useState("");
  const [partyIndex, setPartyIndex] = useState(0);
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [billType, setBillType] = useState("Cash"); // Cash | Credit
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const { confirm, ConfirmModalComponent } = useConfirm();
  const handleSaveBillRef = useRef(null);

  // Keep handleSaveBillRef always pointing at the latest handleSaveBill
  useEffect(() => { handleSaveBillRef.current = handleSaveBill; });

  // F-key + wizard navigation for create view
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F4') { e.preventDefault(); setShowScanner(true); }
      if (e.key === 'F2') {
        e.preventDefault();
        if (view === 'list') { setView('create'); setStep(1); }
        else if (view === 'create') setStep(1);
      }
      if (view !== "create") return;
      if (e.key === "F3") { e.preventDefault(); setStep(2); }
      if (e.key === "F10") { e.preventDefault(); handleSaveBillRef.current?.(); }
      if (e.key === 'Escape') {
        if (e.defaultPrevented) return; // useEscReverse / dropdown already handled it
        if (showScanner) { e.preventDefault(); setShowScanner(false); return; }
        // Wizard: step one back (4→3→2→1); from step 1 leave to the list.
        e.preventDefault();
        if (step > 1) setStep((s) => s - 1);
        else resetForm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, step, showScanner]);

  // Reset wizard to step 1 when entering create; focus each step's control.
  useEffect(() => {
    if (view === 'create') { setStep(1); setPartySearch(""); setPartyIndex(0); }
  }, [view]);
  useEffect(() => {
    if (view !== 'create') return;
    const focusId = (id) => setTimeout(() => document.getElementById(id)?.focus(), 60);
    if (step === 1) focusId('select-party-btn');
    if (step === 2) focusId('party-search');
    if (step === 3) focusId('proceed-billing');
    if (step === 4) focusId('bill-date-input');
  }, [view, step]);

  // Shift+Enter finishes/saves the bill from anywhere in the create view.
  // Capture phase so it isn't pre-empted by the global Enter-navigation hooks.
  useEffect(() => {
    const onShiftEnter = (e) => {
      if (e.key === 'Enter' && e.shiftKey && view === 'create') {
        e.preventDefault();
        e.stopPropagation();
        handleSaveBillRef.current?.();
      }
    };
    window.addEventListener('keydown', onShiftEnter, true);
    return () => window.removeEventListener('keydown', onShiftEnter, true);
  }, [view]);

  // On the saved-bill preview, a single Enter prints the invoice.
  useEffect(() => {
    if (view !== 'preview') return;
    const onEnter = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); window.print(); }
    };
    window.addEventListener('keydown', onEnter, true);
    return () => window.removeEventListener('keydown', onEnter, true);
  }, [view]);

  const toggleRow = (id) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  const fetchBills = () => {
    axios
      .get("/billing")
      .then((res) => setBills(res.data?.data || res.data?.rows || res.data || []))
      .catch((err) => console.error(err));
  };

  const fetchItems = () => {
    axios
      .get("/items")
      .then((res) => setItems(res.data?.data || res.data?.rows || res.data?.items || res.data || []))
      .catch((err) => console.error(err));
  };

  const fetchSchemes = () =>
    axios
      .get("/schemes")
      .then((res) => setAllSchemes(res.data?.data || res.data?.rows || res.data?.items || res.data || []))
      .catch((err) => console.error(err));

  const fetchCustomers = () =>
    axios
      .get("/customers")
      .then((res) => setCustomers(res.data?.data || res.data?.rows || res.data?.items || res.data || []))
      .catch((err) => console.error(err));

  const fetchSalesmen = () =>
    axios
      .get("/salesman")
      .then((res) => setSalesmen(res.data?.data || res.data?.rows || res.data?.items || res.data || []))
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

  // Party History: on selecting an existing customer, show their balance +
  // previous bills (mirrors real MARG). New/typed names skip straight to date.
  const showPartyHistory = async (cust) => {
    if (!cust?.id) { setTimeout(() => document.getElementById('bill-date')?.focus(), 50); return; }
    setPartyHistory({ loading: true, customer: cust, entries: [], balance: cust.balance || 0 });
    try {
      const res = await axios.get(`/customers/${cust.id}/ledger`);
      setPartyHistory({
        loading: false,
        customer: res.data?.customer || cust,
        entries: res.data?.entries || [],
        balance: res.data?.finalBalance ?? cust.balance ?? 0,
      });
    } catch {
      setPartyHistory({ loading: false, customer: cust, entries: [], balance: cust.balance || 0, error: true });
    }
  };
  // OK / Enter → continue into the bill (date → items).
  const closePartyHistory = () => {
    setPartyHistory(null);
    setTimeout(() => document.getElementById('bill-date')?.focus(), 50);
  };

  // ── Wizard helpers ──
  const selectParty = (cust) => {
    if (!cust) return;
    handleCustomerSelect(cust.name);
    setStep(3);
    if (cust.id) {
      setPartyHistory({ loading: true, customer: cust, entries: [], balance: cust.balance || 0 });
      axios.get(`/customers/${cust.id}/ledger`)
        .then((res) => setPartyHistory({ loading: false, customer: res.data?.customer || cust, entries: res.data?.entries || [], balance: res.data?.finalBalance ?? cust.balance ?? 0 }))
        .catch(() => setPartyHistory({ loading: false, customer: cust, entries: [], balance: cust.balance || 0, error: true }));
    } else {
      setPartyHistory({ loading: false, customer: cust, entries: [], balance: 0 });
    }
  };
  const proceedToBilling = () => { setStep(4); setTimeout(() => document.getElementById('bill-date-input')?.focus(), 80); };

  const fetchSettings = () =>
    axios
      .get("/settings")
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

  const handleBarcodeScan = (scannedCode) => {
    const match = items.find(item => item.id?.toString() === scannedCode || (item.name && item.name.toLowerCase().includes(scannedCode.toLowerCase())));
    if (match) {
      const emptyIndex = rows.findIndex(r => !r.name);
      if (emptyIndex !== -1) {
        handleItemSelect(emptyIndex, match.name);
      } else {
        setRows([...rows, { ...emptyRow, searchStr: match.name, name: match.name, qty: 1 }]);
      }
      setShowScanner(false);
    }
  };

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
      const res = await axios.get(`/schemes/check`, {
        params: { itemName, qty },
        
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
      updated[index] = {
        ...updated[index],
        name: found.name,
        batch: found.batch || "",
        hsn: found.hsn || "",
        pack: found.pack || "",
        expiry: found.expiry || "",
        mrp: found.mrp || "",
        selling_price: found.selling_price || found.mrp || "",
        gst: found.gst || 0,
        reorderPoint: found.reorderPoint || 10,
        unit: found.unit || "strips",
        availableQty: found.stock_qty,
        availableSchemeQty: found.scheme_qty,
        amount: calculateAmount(
          found.selling_price || found.mrp,
          updated[index].qty,
          updated[index].disc,
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

  // Line amount = rate × qty, less DIS%. GST applied on the taxable total.
  const calculateAmount = (rate, qty, disc) => {
    const base = parseFloat(rate || 0) * parseInt(qty || 1);
    return parseFloat((base * (1 - (parseFloat(disc || 0) / 100))).toFixed(2));
  };

  const handleRowChange = (index, field, value) => {
    // Coerce numeric fields so they aren't stored as strings
    if (field === 'qty' || field === 'schemeQty') value = parseInt(value) || 0;
    if (field === 'gst' || field === 'disc') value = parseFloat(value) || 0;
    if (field === 'selling_price' || field === 'mrp') value = parseFloat(value) || 0;

    const updated = [...rows];
    updated[index][field] = value;
    updated[index].amount = calculateAmount(
      field === "selling_price" ? value : updated[index].selling_price,
      field === "qty" ? value : updated[index].qty,
      field === "disc" ? value : updated[index].disc,
    );
    setRows(updated);
    // Re-check scheme if qty changed
    if (field === "qty") {
      checkScheme(index, updated[index].name, value);
    }
  };

  const addRow = () => setRows((prev) => [...prev, { ...emptyRow }]);
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

  // ── Computed totals (match the bill-entry layout) ──
  const mrpValue = rows.reduce((s, r) => s + parseFloat(r.mrp || 0) * parseInt(r.qty || 0), 0);
  const grossBeforeDisc = rows.reduce((s, r) => s + parseFloat(r.selling_price || r.mrp || 0) * parseInt(r.qty || 0), 0);
  const valueOfGoods = rows.reduce((s, r) => s + parseFloat(r.amount || 0), 0); // taxable, after DIS%
  const discountAmt = grossBeforeDisc - valueOfGoods;
  const gstAmt = rows.reduce((s, r) => s + parseFloat(r.amount || 0) * parseFloat(r.gst || 0) / 100, 0);
  const sgstAmount = gstAmt / 2;
  const cgstAmount = gstAmt / 2;
  const preRound = valueOfGoods + gstAmt;
  const challanValue = Math.round(preRound);
  const roundOff = (challanValue - preRound).toFixed(2);
  const totalQty = rows.reduce((s, r) => s + parseInt(r.qty || 0), 0);
  const totalFree = rows.reduce((s, r) => s + parseInt(r.schemeQty || 0), 0);
  const avgGstPct = valueOfGoods > 0 ? Math.round((gstAmt / valueOfGoods) * 100) : 0;
  const activeRowData = rows[activeRowIndex] || rows[0] || {};

  const handleSaveBill = async () => {
    if (!customer.name) return 
    if (rows.every((r) => !r.name)) return 

    // Check stock availability on frontend before submitting
    for (const row of rows.filter((r) => r.name)) {
      const totalAvailable =
        (row.availableQty || 0) + (row.availableSchemeQty || 0);
      const totalRequested =
        parseInt(row.qty || 0) + parseInt(row.schemeQty || 0);
      if (row.availableQty !== null && totalRequested > totalAvailable) {
        return 
      }
    }

    const payload = {
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerDl: customer.dlNumber,
      customerGst: customer.gstNumber,
      dueDate: customer.dueDate || null,
      date: billDate || customer.date || null,
      transportDetails: customer.transportDetails,
      salesmanId: selectedSalesman.id || null,
      salesmanName: selectedSalesman.name || "",
      items: rows.filter((r) => r.name).map(r => ({
        ...r,
        qty: parseInt(r.qty) || 1,
        schemeQty: parseInt(r.schemeQty) || 0,
        disc: parseFloat(r.disc) || 0,
        discount: parseFloat(r.disc) || 0,
        gst: parseFloat(r.gst) || 0,
        amount: parseFloat(r.amount) || 0,
        mrp: parseFloat(r.mrp) || 0,
        selling_price: parseFloat(r.selling_price) || 0,
      })),
      subtotal: parseFloat(valueOfGoods.toFixed(2)) || 0,
      gstAmount: parseFloat(gstAmt.toFixed(2)) || 0,
      discount: parseFloat(discountAmt.toFixed(2)) || 0,
      total: challanValue,
      paymentMode: billType.toLowerCase() === "cash" ? "cash" : "credit",
      status: "paid",
    };

    try {
      const res = await axios.post(
        "/billing",
        payload,
        {  },
      );
      setActiveBill(res.data);
      setView("preview");
      fetchBills();
      fetchItems(); // Refresh items to get updated stock
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: "Delete Bill",
      message: "Are you sure you want to delete this bill? Stock quantities will be restored.",
      confirmText: "Delete",
      confirmStyle: "bg-red-600 hover:bg-red-700"
    });
    if (!isConfirmed) return;
    
    try {
      await axios.delete(`/billing/${id}`, {
        
      });
      fetchBills();
      fetchItems(); // Refresh items since stock is restored on bill deletion
    } catch (err) {
      console.error(err);
      
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
      date: new Date().toISOString().slice(0, 10),
    });
    setDiscount(0);
    setPaymentMode("cash");
    setSelectedSalesman({ id: "", name: "" });
    setActiveBill(null);
    setRowSchemes({});
    setView("list");
    setStep(1); setPartySearch(""); setPartyIndex(0);
    setBillDate(new Date().toISOString().slice(0, 10)); setBillType("Cash");
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
        <ConfirmModalComponent />
      </div>
    );
  }

  // ── CREATE VIEW ──
  // ── CREATE VIEW (4-step wizard: New → Select Party → Party Status → Bill Entry) ──
  if (view === "create") {
    const q = partySearch.trim().toLowerCase();
    const partyList = customers.filter((c) =>
      !q || c.name.toLowerCase().includes(q) || (c.address || "").toLowerCase().includes(q) || (c.phone || "").includes(q)
    );
    const hp = partyList[partyIndex] || null;
    const now = new Date();
    const ph = partyHistory || {};
    const phInvoices = (ph.entries || []).filter((e) => e.type === "Invoice");
    const lastSale = phInvoices.length ? phInvoices[phInvoices.length - 1].date : null;
    const wsteps = [
      { n: 1, label: "New" },
      { n: 2, label: "Select Party" },
      { n: 3, label: "Party Status" },
      { n: 4, label: "Bill Entry" },
    ];
    const dmy = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

    const ProductRow = ({ row, i }) => {
      const searchVal = row.searchStr !== undefined ? row.searchStr : row.name;
      const filtered = items.filter((it) => !searchVal || it.name.toLowerCase().includes(searchVal.toLowerCase()));
      return (
        <div key={i} data-billrow className="grid grid-cols-[44px_2fr_1fr_1.2fr_0.8fr_0.8fr_1fr_0.8fr_1.2fr] items-center border-b border-slate-100 hover:bg-blue-50/40 text-base" onFocus={() => setActiveRowIndex(i)}>
          <div className="px-2 py-1.5 text-slate-400 font-mono">{String(i + 1).padStart(2, "0")}</div>
          <div className="px-2 py-1.5 relative">
            <input id={`search-product-${i}`} value={searchVal}
              onChange={(e) => { handleItemSelect(i, e.target.value); setActiveDropdown(`item-${i}`); setDropdownIndex(0); }}
              onFocus={() => { setActiveRowIndex(i); setActiveDropdown(`item-${i}`); setDropdownIndex(0); }}
              onBlur={() => setTimeout(() => setActiveDropdown((prev) => prev === `item-${i}` ? null : prev), 200)}
              aria-expanded={activeDropdown === `item-${i}` ? "true" : "false"}
              onKeyDown={(e) => {
                if (activeDropdown !== `item-${i}`) return;
                if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); setDropdownIndex((p) => Math.min(p + 1, filtered.length - 1)); }
                else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); setDropdownIndex((p) => Math.max(p - 1, 0)); }
                else if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault(); e.stopPropagation();
                  const it = filtered[dropdownIndex];
                  if (it) handleItemSelect(i, `${it.name}${it.batch ? " | Batch: " + it.batch : ""}`);
                  else if ((searchVal || "").trim()) handleItemSelect(i, searchVal);
                  else { setActiveDropdown(null); return; }
                  setActiveDropdown(null);
                  if (i === rows.length - 1) setTimeout(() => addRow(), 0);
                  setTimeout(() => { const tr = e.target.closest("[data-billrow]"); tr?.querySelector("input[data-qty]")?.focus(); }, 50);
                } else if (e.key === "Escape") { e.preventDefault(); setActiveDropdown(null); }
              }}
              placeholder={i === rows.length - 1 ? "Type to add item…" : ""}
              className="w-full bg-transparent outline-none font-semibold" />
            {activeDropdown === `item-${i}` && filtered.length > 0 && (
              <ul className="absolute left-2 top-full mt-0.5 w-[440px] bg-white border border-gray-300 shadow-xl z-50 max-h-56 overflow-auto">
                {filtered.map((it, di) => (
                  <li key={it.id || di} className={`px-3 py-1.5 cursor-pointer text-sm border-b border-gray-100 ${di === dropdownIndex ? "bg-blue-100" : "hover:bg-blue-50"}`}
                    onMouseDown={(e) => { e.preventDefault(); handleItemSelect(i, `${it.name}${it.batch ? " | Batch: " + it.batch : ""}`); setActiveDropdown(null); if (i === rows.length - 1) setTimeout(() => addRow(), 0); }}>
                    <div className="flex justify-between font-semibold"><span>{it.name}</span><span className="text-emerald-700">₹{it.selling_price || it.mrp || 0}</span></div>
                    <div className="flex justify-between text-xs text-gray-500"><span>Batch {it.batch || "-"}</span><span>Stock {it.stock_qty || 0}</span></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="px-2 py-1.5 text-slate-600">{row.pack || "—"}</div>
          <div className="px-2 py-1.5 text-slate-600 font-mono">{row.batch || "—"}</div>
          <div className="px-1 py-1.5"><input data-qty type="number" min="1" value={row.qty} onChange={(e) => handleRowChange(i, "qty", e.target.value)} className="w-full text-right bg-transparent outline-none font-bold" /></div>
          <div className="px-1 py-1.5"><input type="number" min="0" value={row.schemeQty} onChange={(e) => handleRowChange(i, "schemeQty", e.target.value)} className="w-full text-right bg-transparent outline-none text-emerald-700 font-bold" /></div>
          <div className="px-1 py-1.5"><input type="number" value={row.selling_price} onChange={(e) => handleRowChange(i, "selling_price", e.target.value)} className="w-full text-right bg-transparent outline-none" /></div>
          <div className="px-1 py-1.5"><input type="number" value={row.disc} onChange={(e) => handleRowChange(i, "disc", e.target.value)} className="w-full text-right bg-transparent outline-none" /></div>
          <div className="px-2 py-1.5 text-right font-bold">{row.name ? fmt(row.amount) : ""}</div>
        </div>
      );
    };

    const GridHeader = () => (
      <div className="grid grid-cols-[44px_2fr_1fr_1.2fr_0.8fr_0.8fr_1fr_0.8fr_1.2fr] bg-[#1b4985] text-white text-sm font-semibold">
        <div className="px-2 py-2.5">#</div><div className="px-2 py-2.5">PRODUCT</div><div className="px-2 py-2.5">PACK</div><div className="px-2 py-2.5">BATCH</div>
        <div className="px-1 py-2.5 text-right">QTY</div><div className="px-1 py-2.5 text-right">FREE</div><div className="px-1 py-2.5 text-right">RATE</div>
        <div className="px-1 py-2.5 text-right">DIS %</div><div className="px-2 py-2.5 text-right">AMOUNT</div>
      </div>
    );

    return (
      <div className="flex h-screen flex-col bg-slate-100 font-sans overflow-hidden">
        {/* Top bar */}
        <div className="bg-[#1b4985] text-white px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white text-[#1b4985] rounded-lg flex items-center justify-center font-extrabold text-lg">S</div>
            <div>
              <div className="font-bold leading-tight">Subhash Medicose</div>
              <div className="text-xs text-blue-200">Cash / Credit Bill · Silver-2</div>
            </div>
            <span className="ml-2 bg-white/15 text-xs font-semibold px-2 py-1 rounded">FY 2026-2027</span>
          </div>
          <div className="text-right text-xs leading-tight">
            <div className="font-bold">{now.toLocaleDateString("en-GB", { weekday: "short" })} · {now.toLocaleDateString("en-GB")}</div>
            <div className="text-blue-200">{now.toLocaleTimeString("en-GB")}</div>
          </div>
        </div>

        {/* Step tabs */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-2 shrink-0">
          {wsteps.map((s) => (
            <button key={s.n} onClick={() => { if (s.n <= step || customer.name) setStep(s.n); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer ${step === s.n ? "bg-[#1b4985] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === s.n ? "bg-white text-[#1b4985]" : "bg-slate-300 text-white"}`}>{s.n}</span>
              {s.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-slate-400">Bill <span className="font-bold text-[#1b4985]">{activeBill?.billNo || "NEW"}</span></span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6" data-form-scope>
          {/* STEP 1 — New */}
          {step === 1 && (
            <div className="flex gap-6">
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Party Name</div>
                    <div className="text-xl font-bold text-slate-300">No party selected</div>
                  </div>
                  <button id="select-party-btn" onClick={() => setStep(2)} className="flex items-center gap-2 bg-[#1b4985] hover:bg-[#163a6b] text-white px-5 py-2.5 rounded-lg font-semibold cursor-pointer">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">?</span> Select Party
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <GridHeader />
                  <div className="px-4 py-3 text-[#1b4985] bg-blue-50/60 text-sm">Select a party to begin adding products…</div>
                </div>
              </div>
              <div className="w-72 shrink-0">
                <div className="bg-[#0e2440] text-white rounded-xl p-5">
                  <div className="font-bold text-blue-200 uppercase text-sm mb-2">New Bill</div>
                  <p className="text-sm text-blue-100/80 mb-4">Press Enter or use the button to pick a party from your ledgers, then capture date &amp; type and start scanning products.</p>
                  <div className="space-y-2 text-sm border-t border-white/10 pt-3">
                    <div className="flex justify-between"><span className="text-blue-300">Date</span><span>{dmy(billDate)}</span></div>
                    <div className="flex justify-between"><span className="text-blue-300">Series</span><span>Credit Sale</span></div>
                    <div className="flex justify-between"><span className="text-blue-300">Counter</span><span>Main</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Select Party */}
          {step === 2 && (
            <div className="flex gap-6">
              <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-w-0">
                <div className="px-5 py-3 flex items-center justify-between border-b border-slate-200">
                  <span className="font-bold text-slate-800">Select Ledger / Party</span>
                  <span className="text-sm text-slate-400">Top Ordering · A→Z</span>
                </div>
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[#1b4985] font-bold">?&gt;&gt;</span>
                    <input id="party-search" value={partySearch}
                      onChange={(e) => { setPartySearch(e.target.value); setPartyIndex(0); }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") { e.preventDefault(); setPartyIndex((p) => Math.min(p + 1, partyList.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setPartyIndex((p) => Math.max(p - 1, 0)); }
                        else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); if (hp) selectParty(hp); }
                      }}
                      placeholder="Type to search party…" autoComplete="off"
                      className="flex-1 bg-transparent outline-none text-lg" />
                  </div>
                  <span className="text-sm text-slate-400">{partyList.length} matches</span>
                </div>
                <div className="flex-1 overflow-auto">
                  <div className="grid grid-cols-[2fr_1.2fr_1fr] bg-slate-100 text-slate-500 text-sm font-semibold sticky top-0">
                    <div className="px-5 py-2">PARTY NAME</div><div className="px-2 py-2">STATION</div><div className="px-2 py-2 text-right">BALANCE</div>
                  </div>
                  {partyList.map((c, i) => (
                    <div key={c.id || i} onClick={() => setPartyIndex(i)} onDoubleClick={() => selectParty(c)}
                      className={`grid grid-cols-[2fr_1.2fr_1fr] items-center cursor-pointer border-b border-slate-50 ${i === partyIndex ? "bg-blue-50 border-l-4 border-l-[#1b4985]" : "hover:bg-slate-50 border-l-4 border-l-transparent"}`}>
                      <div className={`px-5 py-2.5 ${i === partyIndex ? "font-bold text-[#1b4985]" : "text-slate-800"}`}>{c.name}</div>
                      <div className="px-2 py-2.5 text-slate-500">{c.address || "—"}</div>
                      <div className="px-2 py-2.5 text-right">{c.balance ? <span className={`font-bold ${c.balance > 0 ? "text-red-600" : "text-emerald-700"}`}>{fmt(Math.abs(c.balance))} <span className="text-xs">{c.balance > 0 ? "Dr" : "Cr"}</span></span> : ""}</div>
                    </div>
                  ))}
                  {partyList.length === 0 && <div className="px-5 py-10 text-center text-slate-400">No matching parties.</div>}
                </div>
              </div>
              <div className="w-80 shrink-0">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-[#1b4985] text-white px-4 py-2.5 font-bold">Highlighted Party</div>
                  {hp ? (
                    <div className="p-4">
                      <div className="text-lg font-bold text-slate-900 mb-2">{hp.name}</div>
                      <div className="flex gap-2 mb-3">
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Debtor</span>
                        <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{hp.gstNumber ? "Registered" : "Unregistered"}</span>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between"><span className="text-slate-400">Address</span><span className="font-semibold">{hp.address || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Phone</span><span className="font-semibold">{hp.phone || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Balance</span><span className="font-semibold">{fmt(hp.balance)}</span></div>
                      </div>
                      <button onClick={() => selectParty(hp)} className="w-full mt-4 bg-[#1b4985] hover:bg-[#163a6b] text-white py-2.5 rounded-lg font-bold cursor-pointer">Select Party →</button>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-sm">Type to find a party.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Party Status */}
          {step === 3 && (
            <div className="flex gap-6">
              <div className="flex-1 space-y-4 min-w-0">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-400 uppercase">Party Name</div>
                    <div className="text-2xl font-bold text-slate-900">{customer.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded">R Credit</span>
                    <span className="text-sm font-semibold text-slate-600">{now.toLocaleDateString("en-GB")}</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-[#1b4985] text-white px-5 py-2.5 font-bold">Party History</div>
                  <div className="grid grid-cols-2">
                    <div className="p-5 space-y-2 text-sm border-r border-slate-100">
                      {[["Sale (Annual)", "0"], ["Sale (Month)", "0"], ["Credit Limit", fmt(ph.customer?.creditLimit)], ["Balance", fmt(ph.balance)], ["Last Receipt", "—"], ["Last Sale", lastSale ? dmy(lastSale) : "—"], ["P.D.C.", "Nil"], ["Collection Days", "All Days"]].map(([k, v]) => (
                        <div key={k} className="flex justify-between"><span className="text-slate-500">{k}</span><span className="font-bold text-slate-800">{v}</span></div>
                      ))}
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-4 text-xs font-semibold text-slate-400 border-b border-slate-200 pb-2"><span>BILL</span><span>DATE</span><span className="text-right">AMOUNT</span><span className="text-right">DAYS</span></div>
                      {phInvoices.length ? phInvoices.slice().reverse().slice(0, 8).map((e, i) => (
                        <div key={i} className="grid grid-cols-4 text-sm py-1.5 border-b border-slate-50"><span className="font-mono">{e.ref}</span><span>{dmy(e.date)}</span><span className="text-right font-semibold">{fmt(e.debit)}</span><span className="text-right">—</span></div>
                      )) : <div className="py-10 text-center text-slate-400">No outstanding bills</div>}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button id="proceed-billing" onClick={proceedToBilling} className="bg-[#1b4985] hover:bg-[#163a6b] text-white px-6 py-3 rounded-lg font-bold cursor-pointer">Proceed to Billing →</button>
                </div>
              </div>
              <div className="w-80 shrink-0">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-[#1b4985] text-white px-4 py-2.5 font-bold">Customer Status</div>
                  <div className="p-4">
                    <div className="text-lg font-bold text-slate-900 mb-2">{customer.name}</div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Mobile</span><span className="font-semibold">{customer.phone || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="font-semibold">Manual Indicate</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Outstanding</span><span className="font-bold">{fmt(ph.balance)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Bill Entry */}
          {step === 4 && (
            <div className="flex gap-6">
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                {/* Party header with date + type */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Party Name</div>
                    <div className="text-2xl font-bold text-slate-900">{customer.name || "—"}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{[customer.address, customer.gstNumber, customer.phone ? "M-" + customer.phone : ""].filter(Boolean).join(" · ")}</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase">Bill No.</div>
                      <div className="text-[#1b4985] font-bold">{activeBill?.billNo || "NEW"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase">Date</div>
                      <input id="bill-date-input" type="date" value={billDate}
                        onChange={(e) => setBillDate(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); document.getElementById("bill-type-input")?.focus(); } }}
                        className="font-bold text-slate-800 bg-transparent outline-none border-b border-transparent focus:border-[#1b4985]" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase">Type</div>
                      <div className="flex items-center gap-1.5">
                        <select id="bill-type-input" value={billType}
                          onChange={(e) => setBillType(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); document.getElementById("search-product-0")?.focus(); } }}
                          className={`font-bold rounded px-2 py-0.5 outline-none cursor-pointer ${billType === "Cash" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                          <option value="Credit">Credit</option>
                          <option value="Cash">Cash</option>
                        </select>
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">Local</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product grid */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <GridHeader />
                  {rows.map((row, i) => <ProductRow key={i} row={row} i={i} />)}
                </div>

                {/* Selected line + totals */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="text-sm font-semibold text-slate-400 uppercase mb-2">Selected Line</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Item</span><span className="font-semibold">{activeRowData.name || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Batch</span><span className="font-semibold font-mono">{activeRowData.batch || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Expiry</span><span className="font-semibold">{activeRowData.expiry ? dmy(activeRowData.expiry) : "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Stock</span><span className="font-semibold">{activeRowData.availableQty != null ? `${activeRowData.availableQty} units` : "—"}</span></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">MRP Value</span><span className="font-semibold">{fmt(mrpValue)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Value of Goods</span><span className="font-semibold">{fmt(valueOfGoods)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-semibold text-red-600">- {fmt(discountAmt)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">GST @ {avgGstPct}%</span><span className="font-semibold">{fmt(gstAmt)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Round Off</span><span className="font-semibold">{roundOff}</span></div>
                      <div className="border-t pt-2 flex justify-between items-center"><span className="font-bold text-[#1b4985]">BILL VALUE</span><span className="text-3xl font-extrabold text-[#1b4985]">{fmt(challanValue)}</span></div>
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-2 flex-wrap">
                  {["Sale", "Purchase", "SC", "PC", "Copy", "Paste", "SR", "PR", "O/S", "BE", "Cash", "Vou", "Hold", "Push"].map((b) => (
                    <button key={b} tabIndex={-1} className="px-3 py-1.5 text-sm border border-slate-200 rounded text-slate-600 hover:bg-slate-50">{b}</button>
                  ))}
                  <div className="ml-auto flex items-center gap-2">
                    <button tabIndex={-1} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm">QR ID</button>
                    <button onClick={() => handleSaveBillRef.current?.()} className="px-6 py-2 bg-[#1b4985] hover:bg-[#163a6b] text-white rounded-lg font-bold text-sm">Save (Shift + Enter)</button>
                  </div>
                </div>
              </div>

              {/* Customer status panel */}
              <div className="w-80 shrink-0 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-[#1b4985] text-white px-4 py-2.5 font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Customer Status</div>
                  <div className="p-4">
                    <div className="text-lg font-bold text-slate-900 mb-3">{customer.name || "—"}</div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Mobile</span><span className="font-semibold">{customer.phone || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Area</span><span className="font-semibold">{customer.address || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Outstanding</span><span className="font-bold">{fmt(ph.balance)}</span></div>
                    </div>
                    <div className="border-t border-slate-100 my-3" />
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Sale (Annual)</span><span className="font-semibold">0</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Last Sale</span><span className="font-semibold">{lastSale ? dmy(lastSale) : "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Last Receipt</span><span className="font-semibold">—</span></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Collection Days</div>
                  <div className="bg-blue-50 text-[#1b4985] font-bold text-center py-2 rounded-lg">All Days</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* F-key bar */}
        <div className="bg-white border-t border-slate-200 px-6 py-2 flex items-center gap-3 text-sm text-slate-500 shrink-0">
          {[["F2", "New"], ["F3", "Edit"], ["F4", "Ledger"], ["F6", "PDC"], ["F7", "All"], ["F8", "O/S"], ["F10", "Balance"], ["?", "Search"], ["Alt+S", "Filter"]].map(([k, l]) => (
            <span key={k}><span className="font-bold text-[#1b4985] bg-slate-100 px-1.5 py-0.5 rounded">{k}</span> {l}</span>
          ))}
          <span className="ml-auto">Esc <span className="text-slate-400">= step back</span></span>
        </div>
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
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md cursor-pointer transition"
            >
              <Printer className="w-4.5 h-4.5" />
              Print / Save PDF
              <span className="text-[10px] font-normal opacity-90 ml-1">(Enter)</span>
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
