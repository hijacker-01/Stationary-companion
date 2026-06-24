import { useEffect, useState, Fragment, useRef } from "react";
import { advanceFocusFrom, focusFirstField } from "../utils/focusHelpers";
import axios from "../api/axios";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import {
  Plus,
  Printer,
  ArrowLeft,
  FileText,
  IndianRupee,
  AlertCircle,
  Check,
  Tag,
  ChevronDown,
  ChevronUp,
  Package,
  X,
} from "lucide-react";
import { useConfirm } from "../hooks/useConfirm";
import SmartSelect from "../components/SmartSelect";
import { useDocumentKeyboard } from "../hooks/useDocumentKeyboard";
import PartyHistoryModal from "../components/PartyHistoryModal";

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

const fmt = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SalesChallan() {
  const [bills, setBills] = useState([]);
  const [items, setItems] = useState([]);
  const [view, setView] = useState("list"); // list | create | preview
  const [rows, setRows] = useState(Array(8).fill(null).map(() => ({ ...emptyRow })));
  const [customer, setCustomer] = useState({
    name: "", phone: "", address: "", dlNumber: "", gstNumber: "",
    transportDetails: "Hand Delivery", dueDate: "",
  });
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [activeBill, setActiveBill] = useState(null);
  const [rowSchemes, setRowSchemes] = useState({});
  const [allSchemes, setAllSchemes] = useState([]);
  const [settings, setSettings] = useState({});
  const [customers, setCustomers] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [selectedSalesman, setSelectedSalesman] = useState({ id: "", name: "" });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownIndex, setDropdownIndex] = useState(0);
  // Wizard: 1 New · 2 Select Party · 3 Party Status · 4 Bill Entry
  const [step, setStep] = useState(1);
  const [partySearch, setPartySearch] = useState("");
  const [partyIndex, setPartyIndex] = useState(0);
  const [listFilter, setListFilter] = useState("All");
  const [showDebtorsModal, setShowDebtorsModal] = useState(false);
  const [debtorsConfig, setDebtorsConfig] = useState({
    asOnDate: '2026-07-11', series: '[ALL]', negativeAmount: 'No',
    pdCheque: 'With', woRepl: 'T-All', loadCash: 'No',
    partyCategory: 'All', remark: '', moreOptions: 'No',
  });
  const { confirm, ConfirmModalComponent } = useConfirm();
  const handleSaveBillRef = useRef(null);
  
  useEffect(() => { handleSaveBillRef.current = handleSaveBill; });

  const [filters, setFilters] = useState({
    dateFrom: new Date().toISOString().slice(0, 10),
    dateTo: new Date().toISOString().slice(0, 10),
    godown: 'MAIN GODOWN', group: 'ALL GROUP',
    category: 'ALL CATEGORY', item: 'ALL ITEMS',
  });

  // F-key listener for create view
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (view === 'list') { setView('create'); setStep(1); }
        else if (view === 'create') setStep(1);
      }
      if (view !== "create") return;
      if (e.key === "F3") { e.preventDefault(); setStep(2); }
      if (e.key === "F8") { e.preventDefault(); setShowDebtorsModal(true); }
      if (e.key === "F10") { e.preventDefault(); handleSaveBillRef.current?.(); }
      if (e.key === "Escape") {
        if (e.defaultPrevented) return; // useEscReverse / dropdown already handled it
        if (showDebtorsModal) { e.preventDefault(); setShowDebtorsModal(false); return; }
        // Wizard: step one back (4→3→2→1); from step 1 leave to the list.
        e.preventDefault();
        if (step > 1) setStep((s) => s - 1);
        else resetForm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, showDebtorsModal, step]);

  // Reset the wizard to step 1 whenever the create view opens.
  useEffect(() => {
    if (view === 'create') {
      setStep(1);
      setPartySearch("");
      setPartyIndex(0);
    }
  }, [view]);

  // Focus the right control as the wizard advances, so Enter always advances
  // the flow without the user having to click first ("default selection").
  useEffect(() => {
    if (view !== 'create') return;
    const focusId = (id) => setTimeout(() => document.getElementById(id)?.focus(), 60);
    if (step === 1) focusId('select-party-btn');   // Enter → Select Party
    if (step === 2) focusId('party-search');        // type/↑↓/Enter → pick party
    if (step === 3) focusId('proceed-billing');     // Enter → Proceed to Billing
    if (step === 4) focusId('search-product-0');    // Enter through product rows
  }, [view, step]);

  // Shift+Enter to finish/save, Enter on preview to print
  useDocumentKeyboard({
    view,
    onFinish: () => handleSaveBillRef.current?.(),
    onPrint: () => window.print()
  });

  const toggleRow = (id) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedRows(newSet);
  };

  const fetchBills = () => axios.get("/sales-challan").then((res) => setBills(res.data?.data || res.data?.rows || res.data || []));
  const fetchItems = () => axios.get("/items").then((res) => setItems(res.data?.rows || res.data?.items || res.data?.data || res.data || []));
  const fetchSchemes = () => axios.get("/schemes").then((res) => setAllSchemes(res.data?.data || res.data?.rows || res.data?.items || res.data || []));
  const fetchCustomers = () => axios.get("/customers").then((res) => setCustomers(res.data?.data || res.data?.rows || res.data?.items || res.data || []));
  const fetchSalesmen = () => axios.get("/salesman").then((res) => setSalesmen(res.data?.data || res.data?.rows || res.data?.items || res.data || []));
  const fetchSettings = () => axios.get("/settings").then((res) => setSettings(res.data || {}));

  const [partyHistory, setPartyHistory] = useState(null);
  const showPartyHistory = async (cust) => {
    if (!cust?.id) { setTimeout(() => document.getElementById('search-product-0')?.focus(), 50); return; }
    setPartyHistory({ loading: true, customer: cust, entries: [], balance: cust.balance || 0 });
    try {
      const res = await axios.get(`/customers/${cust.id}/ledger`);
      setPartyHistory({ loading: false, customer: res.data?.customer || cust, entries: res.data?.entries || [], balance: res.data?.finalBalance ?? cust.balance ?? 0 });
    } catch {
      setPartyHistory({ loading: false, customer: cust, entries: [], balance: cust.balance || 0, error: true });
    }
  };
  const closePartyHistory = () => { setPartyHistory(null); setTimeout(() => document.getElementById('search-product-0')?.focus(), 50); };

  // ── Wizard helpers ──
  // Select a party (step 2 → 3): set the customer and load their status/history.
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
  // Step 3 → 4: into product entry.
  const proceedToBilling = () => { setStep(4); setTimeout(() => document.getElementById('search-product-0')?.focus(), 80); };

  const handleCustomerSelect = (name) => {
    const found = customers.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (found) {
      const days = found.creditDays || 30;
      const due = new Date(); due.setDate(due.getDate() + days);
      setCustomer({ name: found.name, phone: found.phone || "", address: found.address || "",
        dlNumber: found.dlNumber || "", gstNumber: found.gstNumber || "",
        dueDate: due.toISOString().split("T")[0], transportDetails: customer.transportDetails || "Hand Delivery",
      });
    } else {
      setCustomer((prev) => ({ ...prev, name }));
    }
  };

  useEffect(() => { fetchBills(); fetchItems(); fetchSchemes(); fetchSettings(); fetchCustomers(); fetchSalesmen(); }, []);

  const checkScheme = async (index, itemName, qty) => {
    if (!itemName) { setRowSchemes((prev) => { const n = { ...prev }; delete n[index]; return n; }); return; }
    try {
      const res = await axios.get(`/schemes/check`, { params: { itemName, qty },  });
      setRowSchemes((prev) => ({ ...prev, [index]: res.data || [] }));
    } catch { setRowSchemes((prev) => { const n = { ...prev }; delete n[index]; return n; }); }
  };

  const handleItemSelect = (index, searchStr) => {
    const updated = [...rows];
    updated[index].searchStr = searchStr;
    const [namePart, batchPart] = searchStr.split(" | Batch: ");
    const name = namePart?.trim();
    const batch = batchPart?.trim();
    const found = items.find((i) => i.name === name && (batch ? i.batch === batch : true));
    if (found) {
      if (found.expiry && new Date(found.expiry) < new Date()) 
      if (found.schedule && found.schedule !== "None") 
      updated[index] = { ...updated[index], name: found.name, batch: found.batch || "", hsn: found.hsn || "",
        pack: found.pack || "", expiry: found.expiry || "", mrp: found.mrp || "",
        selling_price: found.selling_price || found.mrp || "", unit: found.unit || "strips",
        availableQty: found.stock_qty, availableSchemeQty: found.scheme_qty,
        amount: calculateAmount(found.selling_price || found.mrp, updated[index].qty, updated[index].gst),
      };
      checkScheme(index, found.name, updated[index].qty);
    } else {
      updated[index].name = name || searchStr; updated[index].batch = "";
      updated[index].availableQty = null; updated[index].availableSchemeQty = null;
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
    if (field === "qty") checkScheme(index, updated[index].name, value);
  };

  const addRow = () => setRows([...rows, { ...emptyRow }]);
  const removeRow = (i) => { setRows(rows.filter((_, idx) => idx !== i)); setRowSchemes((prev) => { const n = { ...prev }; delete n[i]; return n; }); };

  const subtotal = rows.reduce((s, r) => s + parseFloat(r.selling_price || r.mrp || 0) * parseInt(r.qty || 1), 0);
  const gstAmount = rows.reduce((s, r) => { const base = parseFloat(r.selling_price || r.mrp || 0) * parseInt(r.qty || 1); return s + (base * r.gst) / 100; }, 0);
  const total = subtotal + gstAmount - parseFloat(discount || 0);

  const handleSaveBill = async () => {
    if (!customer.name) return 
    if (rows.every((r) => !r.name)) return 
    for (const row of rows.filter((r) => r.name)) {
      const totalAvailable = (row.availableQty || 0) + (row.availableSchemeQty || 0);
      const totalRequested = parseInt(row.qty || 0) + parseInt(row.schemeQty || 0);
      if (row.availableQty !== null && totalRequested > totalAvailable) return 
    }
    const payload = { customerName: customer.name, customerPhone: customer.phone, customerAddress: customer.address,
      customerDl: customer.dlNumber, customerGst: customer.gstNumber, dueDate: customer.dueDate || null,
      transportDetails: customer.transportDetails, salesmanId: selectedSalesman.id || null, salesmanName: selectedSalesman.name || "",
      items: rows.filter((r) => r.name).map(r => ({
        ...r,
        qty: parseInt(r.qty) || 1,
        schemeQty: parseInt(r.schemeQty) || 0,
        discount: parseFloat(r.discount) || 0,
        gst: parseFloat(r.gst) || 0,
        amount: parseFloat(r.amount) || 0,
        mrp: parseFloat(r.mrp) || 0,
        selling_price: parseFloat(r.selling_price) || 0,
      })), subtotal: parseFloat(subtotal.toFixed(2)) || 0, gstAmount: parseFloat(gstAmount.toFixed(2)) || 0,
      discount: parseFloat(parseFloat(discount || 0).toFixed(2)), total: parseFloat(total.toFixed(2)), paymentMode, status: "paid",
    };
    try {
      const res = await axios.post("/sales-challan", payload);
      setActiveBill(res.data); setView("preview"); fetchBills(); fetchItems();
    } catch (err) {  }
  };

  const handleConvertToInvoice = async (id) => {
    const pm = window.prompt("Enter Payment Mode (cash / credit / upi / bank):", "cash");
    if (!pm) return;
    try {
      await axios.post(`/sales-challan/${id}/invoice`, { paymentMode: pm, status: "unpaid" });
       fetchBills();
    } catch (e) {  }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: "Delete Bill",
      message: "Are you sure you want to delete this bill?",
      confirmText: "Delete",
      confirmStyle: "bg-red-600 hover:bg-red-700"
    });
    if (!isConfirmed) return;
    await axios.delete(`/sales-challan/${id}`);
    fetchBills(); fetchItems();
  };

  const resetForm = () => {
    setRows([{ ...emptyRow }]); setCustomer({ name: "", phone: "", address: "", dlNumber: "", gstNumber: "", transportDetails: "Hand Delivery", dueDate: "" });
    setDiscount(0); setPaymentMode("cash"); setSelectedSalesman({ id: "", name: "" }); setActiveBill(null); setRowSchemes({}); setView("list");
  };

  // Number to Words converter
  const numberToWords = (num) => {
    const a = ["","One ","Two ","Three ","Four ","Five ","Six ","Seven ","Eight ","Nine ","Ten ","Eleven ","Twelve ","Thirteen ","Fourteen ","Fifteen ","Sixteen ","Seventeen ","Eighteen ","Nineteen "];
    const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
    if ((num = num.toString()).length > 9) return "overflow";
    let n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; let str = "";
    str += n[1] != 0 ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Crore " : "";
    str += n[2] != 0 ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Lakh " : "";
    str += n[3] != 0 ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Thousand " : "";
    str += n[4] != 0 ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "Hundred " : "";
    str += n[5] != 0 ? (str != "" ? "and " : "") + (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) + "Only" : "";
    return str || "Zero";
  };

  // ── Computed totals for create view ──
  const grossAmount = rows.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  const sgstAmount = rows.reduce((sum, r) => { const a = parseFloat(r.amount || 0); const g = parseFloat(r.gst || 0); return sum + (a * g / 100) / 2; }, 0);
  const cgstAmount = sgstAmount;
  const finalAmount = grossAmount - parseFloat(discount || 0) + sgstAmount + cgstAmount;
  const roundOff = (Math.round(finalAmount) - finalAmount).toFixed(2);
  const grandTotal = Math.round(finalAmount);
  const totalQty = rows.reduce((sum, r) => sum + parseInt(r.qty || 0), 0);
  const totalFree = rows.reduce((sum, r) => sum + parseInt(r.schemeQty || 0), 0);

  // Active row for item info panel
  const activeRowData = rows[activeRowIndex] || rows[0] || {};

  // ── LIST VIEW ──
  if (view === "list") return (
    <div className="flex h-screen bg-[#e5e5e5] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          <div className="bg-[#1b4985] text-white px-6 py-3 flex items-center justify-between shadow-md flex-shrink-0">
            <div>
              <h1 className="text-lg font-bold tracking-wide">SALES CHALLANS (DELIVERY MEMOS)</h1>
              <p className="text-xs text-blue-200 opacity-80">Generate bills, track payments, manage invoices</p>
            </div>
            <button onClick={() => setView("create")}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded text-xs font-bold transition-colors">
              <Plus className="w-3.5 h-3.5" /> New Sale Entry
            </button>
          </div>

          {/* Summary Strip */}
          <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-6 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <FileText className="w-3.5 h-3.5 text-[#1b4985]" />
              <span className="text-gray-500">Total:</span>
              <span className="font-bold text-gray-800">{bills.length}</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2 text-xs">
              <IndianRupee className="w-3.5 h-3.5 text-green-600" />
              <span className="text-gray-500">Revenue:</span>
              <span className="font-bold text-gray-800">₹{fmt(bills.reduce((s, b) => s + b.total, 0))}</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-gray-500">Unpaid:</span>
              <span className="font-bold text-red-600">{bills.filter((b) => b.status === "unpaid").length}</span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              {['All','Today','Unpaid'].map(f => (
                <button key={f} onClick={() => setListFilter(f)}
                  className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${listFilter === f ? 'bg-[#1b4985] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f}</button>
              ))}
            </div>
          </div>

          {/* Bills Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 border-b-2 border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="w-8 py-2 px-3"></th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Bill No</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase w-28">Date</th>
                  <th className="py-2 px-3 text-right text-xs font-semibold text-gray-500 uppercase w-28">Total</th>
                  <th className="py-2 px-3 text-center text-xs font-semibold text-gray-500 uppercase w-24">Payment</th>
                  <th className="py-2 px-3 text-center text-xs font-semibold text-gray-500 uppercase w-24">Status</th>
                  <th className="py-2 px-3 text-right text-xs font-semibold text-gray-500 uppercase w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.filter(bill => {
                  if (listFilter === 'Today') { const t = new Date().toISOString().split('T')[0]; return bill.createdAt?.startsWith(t); }
                  if (listFilter === 'Unpaid') return bill.status === 'unpaid';
                  return true;
                }).map((bill) => (
                  <Fragment key={bill.id}>
                    <tr onClick={() => toggleRow(bill.id)}
                      className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50
                        ${expandedRows.has(bill.id) ? 'bg-blue-50 border-l-4 border-l-[#1b4985]' : 'border-l-4 border-l-transparent'}`}>
                      <td className="py-1.5 px-3 text-center text-gray-400">
                        {expandedRows.has(bill.id) ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                      </td>
                      <td className="py-1.5 px-3 font-mono font-bold text-[#1b4985]">{bill.billNo}</td>
                      <td className="py-1.5 px-3 font-medium text-gray-800">{bill.customerName}</td>
                      <td className="py-1.5 px-3 text-gray-500">{new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="py-1.5 px-3 text-right font-bold text-gray-800">₹{fmt(bill.total)}</td>
                      <td className="py-1.5 px-3 text-center"><span className="text-[10px] font-bold uppercase bg-gray-100 px-2 py-0.5 rounded">{bill.paymentMode}</span></td>
                      <td className="py-1.5 px-3 text-center">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          bill.status === "invoiced" ? "bg-purple-100 text-purple-700" :
                          bill.status === "paid" ? "bg-green-100 text-green-700" :
                          "bg-red-100 text-red-700"}`}>{bill.status}</span>
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); setActiveBill(bill); setView("preview"); }}
                            className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">View</button>
                          {bill.status !== "invoiced" && bill.status !== "cancelled" && (
                            <button onClick={(e) => { e.stopPropagation(); handleConvertToInvoice(bill.id); }}
                              className="text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-700 rounded hover:bg-green-100">Invoice</button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(bill.id); }}
                            className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-700 rounded hover:bg-red-100">Del</button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows.has(bill.id) && (
                      <tr className="bg-gray-50"><td colSpan={8} className="px-6 py-3">
                        <div className="grid grid-cols-3 gap-3">
                          {bill.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                              <div><span className="text-xs font-bold text-gray-800">{item.name}</span>
                                <span className="text-[10px] text-gray-400 ml-2">Batch: {item.batch || 'N/A'}</span></div>
                              <div className="text-right"><span className="text-xs font-bold">x{item.qty}</span>
                                <div className="text-[10px] font-bold text-[#1b4985]">₹{fmt(item.amount)}</div></div>
                            </div>
                          ))}
                        </div>
                      </td></tr>
                    )}
                  </Fragment>
                ))}
                {bills.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">No bills found. Create a new sale entry.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-100 border-t border-gray-200 px-6 py-1 flex items-center gap-4 text-[10px] text-gray-500 font-medium flex-shrink-0">
            <span><span className="text-[#1b4985] font-bold">F2</span> New Entry</span>
            <span><span className="text-[#1b4985] font-bold">F5</span> Search</span>
            <span><span className="text-[#1b4985] font-bold">F10</span> Filter</span>
            <div className="ml-auto text-gray-400">SUBHASH MEDICOSE · GSTIN: 08ABFCS9604F1ZK</div>
          </div>
        </main>
        <ConfirmModalComponent />
      </div>
    </div>
  );

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

    return (
      <div className="flex h-screen flex-col bg-slate-100 font-sans overflow-hidden">
        {/* Top bar */}
        <div className="bg-[#1b4985] text-white px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white text-[#1b4985] rounded-lg flex items-center justify-center font-extrabold text-lg">S</div>
            <div>
              <div className="font-bold leading-tight">Subhash Medicose</div>
              <div className="text-xs text-blue-200">Sale Challan Entry · Silver-2</div>
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
          <span className="ml-auto text-sm text-slate-400">Challan <span className="font-bold text-[#1b4985]">{activeBill?.billNo || "NEW"}</span></span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6" data-form-scope>
          {/* STEP 1 (New) + STEP 4 (Bill Entry) share the bill canvas */}
          {(step === 1 || step === 4) && (
            <div className="flex gap-6">
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                {/* Party name card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Party Name</div>
                    <div className={`text-xl font-bold ${customer.name ? "text-slate-900" : "text-slate-300"}`}>{customer.name || "No party selected"}</div>
                  </div>
                  <button id="select-party-btn" onClick={() => setStep(2)} className="flex items-center gap-2 bg-[#1b4985] hover:bg-[#163a6b] text-white px-5 py-2.5 rounded-lg font-semibold cursor-pointer">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">?</span> Select Party
                  </button>
                </div>

                {/* Product grid */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="grid grid-cols-[2fr_1fr_1.2fr_0.8fr_0.8fr_1fr_0.8fr_1.2fr] bg-[#1b4985] text-white text-sm font-semibold">
                    <div className="px-4 py-2.5">PRODUCT</div><div className="px-2 py-2.5">PACK</div><div className="px-2 py-2.5">BATCH</div>
                    <div className="px-2 py-2.5 text-right">QTY</div><div className="px-2 py-2.5 text-right">FREE</div><div className="px-2 py-2.5 text-right">RATE</div>
                    <div className="px-2 py-2.5 text-right">GST %</div><div className="px-2 py-2.5 text-right">AMOUNT</div>
                  </div>
                  {step === 1 ? (
                    <div className="px-4 py-3 text-[#1b4985] bg-blue-50/60 text-sm">Select a party to begin adding products…</div>
                  ) : (
                    rows.map((row, i) => {
                      const searchVal = row.searchStr !== undefined ? row.searchStr : row.name;
                      const filtered = items.filter((it) => !searchVal || it.name.toLowerCase().includes(searchVal.toLowerCase()));
                      return (
                        <div key={i} data-billrow className="grid grid-cols-[2fr_1fr_1.2fr_0.8fr_0.8fr_1fr_0.8fr_1.2fr] items-center border-b border-slate-100 hover:bg-slate-50 text-base" onFocus={() => setActiveRowIndex(i)}>
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
                          <div className="px-2 py-1.5 text-slate-600">{row.batch || "—"}</div>
                          <div className="px-1 py-1.5"><input data-qty type="number" min="1" value={row.qty} onChange={(e) => handleRowChange(i, "qty", e.target.value)} className="w-full text-right bg-transparent outline-none font-bold" /></div>
                          <div className="px-1 py-1.5"><input type="number" min="0" value={row.schemeQty} onChange={(e) => handleRowChange(i, "schemeQty", e.target.value)} className="w-full text-right bg-transparent outline-none text-emerald-700 font-bold" /></div>
                          <div className="px-1 py-1.5"><input type="number" value={row.selling_price} onChange={(e) => handleRowChange(i, "selling_price", e.target.value)} className="w-full text-right bg-transparent outline-none" /></div>
                          <div className="px-1 py-1.5"><input type="number" value={row.gst} onChange={(e) => handleRowChange(i, "gst", e.target.value)} className="w-full text-right bg-transparent outline-none" /></div>
                          <div className="px-2 py-1.5 text-right font-bold">{row.name ? fmt(row.amount) : ""}</div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selected line + totals */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="text-sm font-semibold text-slate-400 uppercase mb-2">Selected Line</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Item</span><span className="font-semibold">{activeRowData.name || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Batch</span><span className="font-semibold">{activeRowData.batch || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Expiry</span><span className="font-semibold">{activeRowData.expiry ? new Date(activeRowData.expiry).toLocaleDateString("en-GB") : "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Stock</span><span className="font-semibold">{activeRowData.availableQty ?? "—"}</span></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Value of Goods</span><span className="font-semibold">{fmt(grossAmount)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-semibold">{fmt(discount)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">GST</span><span className="font-semibold">{fmt(sgstAmount + cgstAmount)}</span></div>
                      <div className="border-t pt-2 flex justify-between items-center"><span className="font-bold text-[#1b4985]">CHALLAN VALUE</span><span className="text-3xl font-extrabold text-[#1b4985]">{fmt(grandTotal)}</span></div>
                    </div>
                    {step === 4 && (
                      <button onClick={() => handleSaveBillRef.current?.()} className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold cursor-pointer">Finish Challan (Shift + Enter)</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right info panel */}
              <div className="w-72 shrink-0">
                <div className="bg-[#0e2440] text-white rounded-xl p-5">
                  <div className="font-bold text-blue-200 uppercase text-sm mb-2">{step === 4 ? "Bill Entry" : "New Challan"}</div>
                  <p className="text-sm text-blue-100/80 mb-4">{step === 4 ? "Type a product, Enter to move across, Shift+Enter to finish." : "Date is set to today. Press ? or use the button to pick a party from your ledgers, then start scanning products."}</p>
                  <div className="space-y-2 text-sm border-t border-white/10 pt-3">
                    <div className="flex justify-between"><span className="text-blue-300">Date</span><span>{now.toLocaleDateString("en-GB")}</span></div>
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

              {/* Highlighted party panel */}
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
                      {[["Sale (Annual)", "0"], ["Sale (Month)", "0"], ["Credit Limit", fmt(ph.customer?.creditLimit)], ["Balance", fmt(ph.balance)], ["Last Receipt", "—"], ["Last Sale", lastSale ? new Date(lastSale).toLocaleDateString("en-GB") : "—"], ["P.D.C.", "Nil"], ["Collection Days", "All Days"]].map(([k, v]) => (
                        <div key={k} className="flex justify-between"><span className="text-slate-500">{k}</span><span className="font-bold text-slate-800">{v}</span></div>
                      ))}
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-4 text-xs font-semibold text-slate-400 border-b border-slate-200 pb-2"><span>BILL</span><span>DATE</span><span className="text-right">AMOUNT</span><span className="text-right">DAYS</span></div>
                      {phInvoices.length ? phInvoices.slice().reverse().slice(0, 8).map((e, i) => (
                        <div key={i} className="grid grid-cols-4 text-sm py-1.5 border-b border-slate-50"><span className="font-mono">{e.ref}</span><span>{new Date(e.date).toLocaleDateString("en-GB")}</span><span className="text-right font-semibold">{fmt(e.debit)}</span><span className="text-right">—</span></div>
                      )) : <div className="py-10 text-center text-slate-400">No outstanding bills</div>}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button id="proceed-billing" onClick={proceedToBilling} className="bg-[#1b4985] hover:bg-[#163a6b] text-white px-6 py-3 rounded-lg font-bold cursor-pointer">Proceed to Billing →</button>
                </div>
              </div>
              {/* Customer status panel */}
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

  // ── PREVIEW VIEW ──
  if (view === "preview" && activeBill) {
    const totalGst = activeBill.gstAmount || 0;
    const previewCgst = totalGst / 2;
    const previewSgst = totalGst / 2;
    const previewRoundOff = (Math.round(activeBill.total) - activeBill.total).toFixed(2);
    const previewGrandTotal = Math.round(activeBill.total);

    return (
      <div className="flex h-screen bg-[#e5e5e5] font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-100 p-6 print:p-0 print:bg-white">
            <div className="flex items-center justify-between mb-4 max-w-[210mm] mx-auto print:hidden">
              <button onClick={resetForm} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to List
              </button>
              <button onClick={() => window.print()}
                className="flex items-center gap-2 bg-[#1b4985] hover:bg-blue-800 text-white px-4 py-1.5 rounded text-xs font-bold transition">
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>

            <div id="invoice" className="bg-white border border-gray-200 rounded max-w-[210mm] mx-auto p-8 print:border-0 shadow-md text-xs text-gray-800">
              {/* Invoice Header */}
              <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
                <h1 className="text-2xl font-extrabold uppercase text-gray-900">{settings.companyName || "PHARMA DISTRIBUTORS"}</h1>
                <p className="text-gray-500 text-sm mt-1">{settings.companyAddress || "123, Wholesale Market, Mumbai, MH"}</p>
                <div className="flex justify-center gap-6 mt-2 text-gray-600 font-semibold text-[11px]">
                  <p>Phone: {settings.companyPhone || "+91-XXXXXXXXXX"}</p>
                  <p>DL No: {settings.dlNumber || "MH-MZ3-123456"}</p>
                  <p>GSTIN: {settings.gstNumber || "27AAAAA0000A1Z5"}</p>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-6 border-b border-gray-300 pb-3 mb-4">
                <div className="pr-4 border-r border-gray-200">
                  <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-1">Billed To</p>
                  <p className="font-bold uppercase text-gray-900 text-sm">{activeBill.customerName}</p>
                  <p className="text-gray-600 mt-1">{activeBill.customerAddress || "Walk-in Customer"}</p>
                  <p className="text-gray-600">Phone: {activeBill.customerPhone || "N/A"}</p>
                  <p className="mt-1 font-semibold">DL No: {activeBill.customerDl || "N/A"}</p>
                  {activeBill.customerGst && <p className="font-semibold">GSTIN: {activeBill.customerGst}</p>}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600"><span className="font-bold">Invoice No:</span><span className="font-mono font-semibold">{activeBill.billNo}</span></div>
                  <div className="flex justify-between text-gray-600"><span className="font-bold">Date:</span><span className="font-semibold">{new Date(activeBill.createdAt).toLocaleDateString("en-IN")}</span></div>
                  <div className="flex justify-between text-gray-600"><span className="font-bold">Due Date:</span><span className="font-semibold">{activeBill.dueDate ? new Date(activeBill.dueDate).toLocaleDateString("en-IN") : "N/A"}</span></div>
                  <div className="flex justify-between text-gray-600"><span className="font-bold">Transport:</span><span className="font-semibold">{activeBill.transportDetails || "Hand Delivery"}</span></div>
                  <div className="flex justify-between text-gray-600"><span className="font-bold">Payment:</span><span className="uppercase font-semibold">{activeBill.paymentMode}</span></div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-[10px] mb-4 border border-gray-300 border-collapse">
                <thead className="bg-gray-50 border-b border-gray-300">
                  <tr>
                    <th className="border-r border-gray-300 p-2 text-center w-8">S.No</th>
                    <th className="border-r border-gray-300 p-2 text-left">Product Name</th>
                    <th className="border-r border-gray-300 p-2 text-center">HSN</th>
                    <th className="border-r border-gray-300 p-2 text-center">Pack</th>
                    <th className="border-r border-gray-300 p-2 text-center">Batch</th>
                    <th className="border-r border-gray-300 p-2 text-center">Exp</th>
                    <th className="border-r border-gray-300 p-2 text-center">Qty</th>
                    <th className="border-r border-gray-300 p-2 text-center">Free</th>
                    <th className="border-r border-gray-300 p-2 text-right">MRP</th>
                    <th className="border-r border-gray-300 p-2 text-right">Rate</th>
                    <th className="border-r border-gray-300 p-2 text-center">GST%</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBill.items?.map((item, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="border-r border-gray-300 p-2 text-center text-gray-400">{i+1}</td>
                      <td className="border-r border-gray-300 p-2 font-bold uppercase text-gray-900">{item.name}</td>
                      <td className="border-r border-gray-300 p-2 text-center text-gray-600">{item.hsn || "—"}</td>
                      <td className="border-r border-gray-300 p-2 text-center text-gray-600">{item.pack || "—"}</td>
                      <td className="border-r border-gray-300 p-2 text-center font-mono font-semibold">{item.batch || "—"}</td>
                      <td className="border-r border-gray-300 p-2 text-center text-gray-600">{item.expiry ? new Date(item.expiry).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) : "—"}</td>
                      <td className="border-r border-gray-300 p-2 text-center font-bold">{item.qty}</td>
                      <td className="border-r border-gray-300 p-2 text-center text-gray-600">{item.schemeQty || 0}</td>
                      <td className="border-r border-gray-300 p-2 text-right text-gray-600">{parseFloat(item.mrp || 0).toFixed(2)}</td>
                      <td className="border-r border-gray-300 p-2 text-right font-bold">{parseFloat(item.selling_price || 0).toFixed(2)}</td>
                      <td className="border-r border-gray-300 p-2 text-center">{item.gst}%</td>
                      <td className="p-2 text-right font-bold">₹{fmt(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <div className="w-2/3 p-4 border-r border-gray-300 space-y-3">
                  <div>
                    <p className="font-bold text-gray-500 uppercase tracking-wider text-[9px] mb-0.5">Rupees in Words</p>
                    <p className="italic font-bold text-gray-900 text-xs">{numberToWords(previewGrandTotal)}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-500 uppercase tracking-wider text-[9px] mb-0.5">Bank Details</p>
                    <p className="whitespace-pre-wrap text-gray-700 font-semibold text-[10px]">{settings.bankDetails || "Bank: XYZ Bank\nA/C: 0000000000\nIFSC: XYZ0000000"}</p>
                  </div>
                </div>
                <div className="w-1/3 text-xs divide-y divide-gray-200">
                  <div className="flex justify-between p-2.5 text-gray-500"><span>Subtotal:</span><span>₹{fmt(activeBill.subtotal)}</span></div>
                  <div className="flex justify-between p-2.5 text-gray-500"><span>Discount:</span><span>₹{fmt(activeBill.discount)}</span></div>
                  <div className="flex justify-between p-2.5 text-gray-500"><span>SGST:</span><span>₹{fmt(previewSgst)}</span></div>
                  <div className="flex justify-between p-2.5 text-gray-500"><span>CGST:</span><span>₹{fmt(previewCgst)}</span></div>
                  <div className="flex justify-between p-2.5 text-gray-500"><span>Round Off:</span><span>₹{previewRoundOff}</span></div>
                  <div className="flex justify-between p-3 bg-gray-50 font-extrabold text-base text-gray-900"><span>GRAND TOTAL:</span><span className="text-green-700">₹{fmt(previewGrandTotal)}</span></div>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-end">
                <p className="text-[9px] text-gray-400 italic">Authenticated computer generated tax invoice.</p>
                <div className="text-center w-52 border-t border-gray-800 pt-1.5 mt-8">
                  <p className="font-bold text-[10px]">For {settings.companyName || "PHARMA DISTRIBUTORS"}</p>
                  <p className="text-[9px] mt-1 text-gray-400">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
}
