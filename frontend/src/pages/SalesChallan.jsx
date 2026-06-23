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
        if (view === 'list') setView('create');
        else if (view === 'create') document.getElementById('search-product-0')?.focus();
      }
      if (view !== "create") return;
      if (e.key === "F3") { e.preventDefault(); document.getElementById('search-customer')?.focus(); }
      if (e.key === "F8") { e.preventDefault(); setShowDebtorsModal(true); }
      if (e.key === "F10") { e.preventDefault(); handleSaveBillRef.current?.(); }
      if (e.key === "Escape") {
        if (e.defaultPrevented) return; // useEscReverse / dropdown already handled it
        if (showDebtorsModal) { e.preventDefault(); setShowDebtorsModal(false); return; }
        // Boundary: from the first input, step the view back to the list; on the
        // list let the global handler navigate to the previous page.
        if (view !== "list") { e.preventDefault(); resetForm(); return; }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, showDebtorsModal]);

  useEffect(() => {
    if (view === 'create') {
      focusFirstField('#search-customer, [placeholder="Search..."]');
    }
  }, [view]);

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
  if (view === "create") return (
    <div className="flex h-screen bg-[#e5e5e5] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 relative">

          {/* Title Bar */}
          <div className="bg-[#1b4985] text-white px-6 py-2.5 flex items-center justify-between shadow-md flex-shrink-0">
            <div>
              <h1 className="text-base font-bold tracking-wide">SALE ENTRY — {new Date().toLocaleDateString('en-GB')}</h1>
              <p className="text-[11px] text-blue-200 opacity-80">SALE ENTRY</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-white/10 px-3 py-1 rounded">USER: ADMIN</span>
              <button onClick={() => setShowDebtorsModal(true)}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors font-semibold">F8 Change</button>
            </div>
          </div>

          {/* Filter Strip */}
          <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-5 text-xs shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2">
              <label className="text-gray-500 font-medium">From</label>
              <input type="date" value={filters.dateFrom} onChange={e => setFilters(p => ({...p, dateFrom: e.target.value}))}
                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1b4985]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500 font-medium">To</label>
              <input type="date" value={filters.dateTo} onChange={e => setFilters(p => ({...p, dateTo: e.target.value}))}
                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1b4985]" />
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <label className="text-gray-500 font-medium">Godown</label>
              <SmartSelect
                value={filters.godown || 'MAIN GODOWN'}
                onChange={e => setFilters(p => ({...p, godown: e.target.value}))}
                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1b4985]"
                options={[
                  { value: 'MAIN GODOWN', label: 'MAIN GODOWN' },
                  { value: 'WAREHOUSE 2', label: 'WAREHOUSE 2' }
                ]}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500 font-medium">Group</label>
              <SmartSelect
                value={filters.group || 'ALL GROUP'}
                onChange={e => setFilters(p => ({...p, group: e.target.value}))}
                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1b4985]"
                options={[
                  { value: 'ALL GROUP', label: 'ALL GROUP' }
                ]}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500 font-medium">Category</label>
              <SmartSelect
                value={filters.category || 'ALL CATEGORY'}
                onChange={e => setFilters(p => ({...p, category: e.target.value}))}
                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1b4985]"
                options={[
                  { value: 'ALL CATEGORY', label: 'ALL CATEGORY' }
                ]}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500 font-medium">Item</label>
              <SmartSelect
                value={filters.item || 'ALL ITEMS'}
                onChange={e => setFilters(p => ({...p, item: e.target.value}))}
                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1b4985]"
                options={[
                  { value: 'ALL ITEMS', label: 'ALL ITEMS' }
                ]}
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm font-semibold border-collapse">
              <thead className="bg-[#1b4985] text-white sticky top-0 z-10">
                <tr>
                  <th className="w-8 py-2 px-2 text-center border-r border-blue-800">#</th>
                  <th className="py-2 px-2 text-left border-r border-blue-800">PRODUCT [F2]</th>
                  <th className="py-2 px-2 text-center border-r border-blue-800 w-20">PACK</th>
                  <th className="py-2 px-2 text-center border-r border-blue-800 w-32">BATCH</th>
                  <th className="py-2 px-2 text-right border-r border-blue-800 w-20">QTY</th>
                  <th className="py-2 px-2 text-right border-r border-blue-800 w-20 text-green-300">FREE</th>
                  <th className="py-2 px-2 text-right border-r border-blue-800 w-24">RATE</th>
                  <th className="py-2 px-2 text-right border-r border-blue-800 w-20">DIS%</th>
                  <th className="py-2 px-2 text-right w-32 font-bold">AMOUNT</th>
                  <th className="w-8 py-2 px-2 text-center">X</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} onFocusCapture={() => setActiveRowIndex(i)} onClick={() => setActiveRowIndex(i)} className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                    <td className="py-1.5 px-2 text-center text-gray-400 font-medium">{i+1}</td>
                    <td className="py-1.5 px-2 border-r border-gray-100 relative">
                      <input id={`search-product-${i}`}
                        value={row.searchStr !== undefined ? row.searchStr : row.name}
                        onChange={(e) => handleItemSelect(i, e.target.value)}
                        onFocus={() => { setActiveDropdown(`item-${i}`); setDropdownIndex(0); }}
                        onBlur={() => setTimeout(() => setActiveDropdown(prev => prev === `item-${i}` ? null : prev), 200)}
                        aria-expanded={activeDropdown === `item-${i}` ? 'true' : 'false'}
                        onKeyDown={(e) => {
                          if (activeDropdown === `item-${i}`) {
                            const s = row.searchStr !== undefined ? row.searchStr : row.name;
                            const filtered = items.filter(it => !s || it.name.toLowerCase().includes(s.toLowerCase()));
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              e.stopPropagation();
                              setDropdownIndex(prev => Math.min(prev + 1, filtered.length - 1));
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              e.stopPropagation();
                              setDropdownIndex(prev => Math.max(prev - 1, 0));
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                              if (filtered[dropdownIndex]) {
                                const it = filtered[dropdownIndex];
                                handleItemSelect(i, `${it.name}${it.batch ? ' | Batch: ' + it.batch : ''}`);
                              } else {
                                handleItemSelect(i, e.target.value);
                              }
                              setActiveDropdown(null);
                              setTimeout(() => {
                                const el = document.getElementById(`search-product-${i}`);
                                if (el) advanceFocusFrom(el);
                              }, 0);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setActiveDropdown(null);
                            }
                          }
                        }}
                        className="w-full bg-transparent outline-none font-bold text-gray-800 uppercase placeholder:text-gray-300"
                        placeholder="Search product..." />
                      {activeDropdown === `item-${i}` && (
                        <ul className="absolute left-0 top-full mt-0.5 w-[400px] bg-white border border-gray-400 shadow-xl z-50 max-h-48 overflow-y-auto">
                          {items.filter(it => !(row.searchStr !== undefined ? row.searchStr : row.name) || it.name.toLowerCase().includes((row.searchStr !== undefined ? row.searchStr : row.name).toLowerCase())).map((it, idx) => (
                            <li key={it.id || idx} className={`px-2 py-1 cursor-pointer text-xs text-black border-b border-gray-100 last:border-0 ${dropdownIndex === idx ? 'bg-blue-200' : 'hover:bg-blue-50'}`}
                              onMouseDown={() => {
                                handleItemSelect(i, `${it.name}${it.batch ? ' | Batch: ' + it.batch : ''}`);
                                setTimeout(() => {
                                  const el = document.getElementById(`search-product-${i}`);
                                  if (el) advanceFocusFrom(el);
                                }, 0);
                              }}>
                              <div className="flex justify-between font-bold"><span>{it.name}</span><span className="text-green-700">₹{it.selling_price || it.mrp || 0}</span></div>
                              <div className="flex justify-between text-[10px] text-gray-500"><span>Batch: {it.batch || '-'}</span><span>Stock: {it.stock_qty || 0}</span></div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-center text-gray-500 border-r border-gray-100">{row.unit || 'STRIP'}</td>
                    <td className="py-1.5 px-2 text-center font-mono font-bold text-gray-700 border-r border-gray-100">{row.batch}</td>
                    <td className="py-1.5 px-2 border-r border-gray-100 bg-yellow-50/50">
                      <input type="number" min="1" value={row.qty} onChange={e => handleRowChange(i, "qty", e.target.value)}
                        className="w-full text-right bg-transparent outline-none font-bold text-gray-800" />
                    </td>
                    <td className="py-1.5 px-2 border-r border-gray-100 bg-green-50/30">
                      <input type="number" min="0" value={row.schemeQty} onChange={e => handleRowChange(i, "schemeQty", e.target.value)}
                        className="w-full text-right bg-transparent outline-none font-bold text-green-700" />
                    </td>
                    <td className="py-1.5 px-2 border-r border-gray-100">
                      <input type="number" value={row.selling_price} onChange={e => handleRowChange(i, "selling_price", e.target.value)}
                        className="w-full text-right bg-transparent outline-none font-bold text-gray-800" />
                    </td>
                    <td className="py-1.5 px-2 border-r border-gray-100 text-center">
                      <SmartSelect 
                        value={row.gst} 
                        onChange={e => handleRowChange(i, "gst", e.target.value)}
                        className="bg-transparent outline-none font-bold text-gray-700 w-full text-center cursor-pointer"
                        options={GST_RATES.map(r => ({ value: r, label: `${r}%` }))}
                      />
                    </td>
                    <td className="py-1.5 px-2 text-right font-bold text-gray-900 bg-gray-50/50">₹{fmt(row.amount)}</td>
                    <td className="py-1.5 px-2 text-center">
                      {rows.length > 1 && <button onClick={() => removeRow(i)} className="text-red-400 font-bold hover:text-red-600">×</button>}
                    </td>
                  </tr>
                ))}
                {/* Add Row */}
                <tr className="border-b border-gray-200">
                  <td colSpan={10} className="py-1 px-2">
                    <button onClick={addRow} className="text-[10px] font-bold text-[#1b4985] hover:text-blue-700 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quick Info Bar for Active Row */}
          <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-2 flex items-center gap-6 text-[11px] text-yellow-800 font-bold shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <span className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded text-yellow-900"><AlertCircle className="w-3.5 h-3.5" /> F5 - Apply Scheme</span>
            <span className="flex items-center gap-1"><span className="text-yellow-600/70 font-medium">Margin:</span> 12.5%</span>
            <span className="flex items-center gap-1"><span className="text-yellow-600/70 font-medium">PTR:</span> ₹45.00</span>
            <span className="flex items-center gap-1"><span className="text-yellow-600/70 font-medium">PTS:</span> ₹52.00</span>
            <span className="flex items-center gap-1"><span className="text-yellow-600/70 font-medium">Location:</span> RACK-A-12</span>
            {rowSchemes[activeRowIndex] && rowSchemes[activeRowIndex].length > 0 && (
              <div className="ml-auto text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                <Package className="w-3.5 h-3.5"/> Scheme Active: {rowSchemes[activeRowIndex][0]?.min_qty}+{rowSchemes[activeRowIndex][0]?.free_qty} Free
              </div>
            )}
          </div>

          {/* Bottom Panel: Item Info + Totals */}
          <div className="bg-white border-t-2 border-[#1b4985] flex-shrink-0">
            <div className="grid grid-cols-5 divide-x divide-gray-200 text-sm">

              {/* Item Info */}
              <div className="px-5 py-4">
                <p className="text-[11px] uppercase tracking-widest text-[#1b4985] mb-2 font-black border-b border-gray-100 pb-1">Item Info</p>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold"><span className="text-gray-500">Item:</span><span className="text-gray-900 truncate ml-1">{activeRowData.name || '—'}</span></div>
                  <div className="flex justify-between font-bold"><span className="text-gray-500">Batch:</span><span className="text-gray-900">{activeRowData.batch || '—'}</span></div>
                  <div className="flex justify-between font-bold"><span className="text-gray-500">Stock:</span><span className={` ${(activeRowData.availableQty || 0) < 10 ? 'text-red-600' : 'text-green-700'}`}>{activeRowData.availableQty ?? '—'}</span></div>
                  <div className="flex justify-between font-bold"><span className="text-gray-500">MRP:</span><span className="text-gray-900">₹{fmt(activeRowData.mrp)}</span></div>
                </div>
              </div>

              {/* Customer */}
              <div className="px-5 py-4">
                <p className="text-[11px] uppercase tracking-widest text-[#1b4985] mb-2 font-black border-b border-gray-100 pb-1">Customer [F3]</p>
                <input id="search-customer" type="text" list="customer-list" value={customer.name}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); document.getElementById('search-product-0')?.focus(); } }}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-black bg-yellow-50 focus:outline-none focus:border-[#1b4985] mb-2" placeholder="Search..." />
                <datalist id="customer-list">{customers.map(c => <option key={c.id} value={c.name} />)}</datalist>
                <div className="flex justify-between font-bold mt-1"><span className="text-gray-500">Phone:</span><span className="text-gray-900">{customer.phone || '—'}</span></div>
                <div className="flex justify-between font-bold mt-1"><span className="text-gray-500">GSTIN:</span><span className="text-gray-900 text-[11px]">{customer.gstNumber || '—'}</span></div>
              </div>

              {/* GST Summary */}
              <div className="px-5 py-4">
                <p className="text-[11px] uppercase tracking-widest text-[#1b4985] mb-2 font-black border-b border-gray-100 pb-1">GST</p>
                <div className="flex justify-between py-1 font-bold"><span className="text-gray-500">Taxable:</span><span className="text-gray-900">₹{fmt(grossAmount)}</span></div>
                <div className="flex justify-between py-1 font-bold"><span className="text-gray-500">SGST:</span><span className="text-gray-900">₹{fmt(sgstAmount)}</span></div>
                <div className="flex justify-between py-1 font-bold"><span className="text-gray-500">CGST:</span><span className="text-gray-900">₹{fmt(cgstAmount)}</span></div>
              </div>

              {/* Value / Discount */}
              <div className="px-5 py-4">
                <p className="text-[11px] uppercase tracking-widest text-[#1b4985] mb-2 font-black border-b border-gray-100 pb-1">Value</p>
                <div className="flex justify-between py-1 font-bold"><span className="text-gray-500">Items/Qty:</span><span className="text-gray-900">{rows.length} | {totalQty} + {totalFree}F</span></div>
                <div className="flex justify-between py-1 font-bold items-center"><span className="text-gray-500">Discount:</span>
                  <input type="number" value={discount} onChange={e => setDiscount(e.target.value)}
                    className="w-20 text-right font-black text-red-600 bg-red-50 border border-red-200 outline-none px-1 py-0.5 rounded" />
                </div>
                <div className="flex justify-between py-1 font-bold"><span className="text-gray-500">Round Off:</span><span className="text-gray-900">₹{roundOff}</span></div>
              </div>

              {/* Grand Total */}
              <div className="px-5 py-4 bg-green-50 flex flex-col justify-center">
                <p className="text-[12px] uppercase tracking-widest text-green-700 mb-1 font-black border-b border-green-200 pb-1">GRAND TOTAL</p>
                <div className="text-4xl font-black text-green-700 mt-1 mb-2 tracking-tighter">₹{grandTotal.toLocaleString('en-IN')}</div>
                <div className="mt-auto flex gap-2 flex-col">
                  <button
                    onClick={handleSaveBill}
                    tabIndex={-1}
                    className="w-full bg-emerald-600 text-white font-black text-[13px] px-3 py-2.5 rounded hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    ✓ Finish Challan
                    <span className="text-[10px] font-normal opacity-90 ml-auto">Shift + Enter</span>
                  </button>
                  <button onClick={handleSaveBill}
                    className="w-full bg-[#1b4985] text-white font-black text-[13px] px-3 py-2.5 rounded hover:bg-blue-800 transition-colors flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Save Bill [F10]
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Shortcut Bar */}
          <div className="bg-gray-100 border-t border-gray-200 px-6 py-2.5 flex items-center gap-6 text-xs text-gray-600 font-bold flex-shrink-0 shadow-inner">
            <span><span className="text-[#1b4985] font-black mr-1">Alt+F1</span> Others</span>
            <span><span className="text-[#1b4985] font-black mr-1">F3</span> Edit</span>
            <span><span className="text-red-600 font-black mr-1">Enter</span> Register</span>
            <span><span className="text-[#1b4985] font-black mr-1">F3</span> Bank Reco</span>
            <span><span className="text-[#1b4985] font-black mr-1">F10</span> Filter</span>
            <span><span className="text-[#1b4985] font-black mr-1">F8</span> PDC Issue</span>
            <span><span className="text-red-600 font-black mr-1">Ctrl+F1</span> Summary</span>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-gray-500 font-bold bg-white px-3 py-1 rounded border border-gray-200">Last Bill: {bills[0]?.billNo || '—'}</span>
            </div>
          </div>

          {/* Debtors Modal */}
          {showDebtorsModal && (
            <div className="absolute inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowDebtorsModal(false)}>
              <div className="bg-white rounded-lg shadow-2xl border border-gray-300 w-[380px]" onClick={e => e.stopPropagation()}>
                <div className="bg-[#1b4985] text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
                  <span className="text-sm font-bold">DEBTORS: WHOLE</span>
                  <button onClick={() => setShowDebtorsModal(false)}><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-2.5 text-xs">
                  {[
                    { label: 'As On Date', key: 'asOnDate', type: 'date' },
                    { label: 'Series', key: 'series', type: 'text' },
                    { label: 'Negative Amount', key: 'negativeAmount', type: 'select', options: ['No', 'Yes'] },
                    { label: 'P.D.Cheque', key: 'pdCheque', type: 'select', options: ['With', 'Without'] },
                    { label: 'W/o Repl./Adv.', key: 'woRepl', type: 'select', options: ['T-All', 'T-Yes', 'T-No'] },
                    { label: 'Load Cash', key: 'loadCash', type: 'select', options: ['No', 'Yes'] },
                    { label: 'Party Category', key: 'partyCategory', type: 'select', options: ['All', 'Retail', 'Wholesale'] },
                    { label: 'Remark', key: 'remark', type: 'text' },
                    { label: 'More Options', key: 'moreOptions', type: 'select', options: ['No', 'Yes'] },
                  ].map(field => (
                    <div key={field.key} className="flex items-center justify-between">
                      <label className="text-gray-600 font-medium w-36">{field.label}</label>
                      {field.type === 'select' ? (
                        <SmartSelect value={debtorsConfig[field.key]} onChange={e => setDebtorsConfig(p => ({...p, [field.key]: e.target.value}))}
                          className="border border-gray-300 rounded px-2 py-1 text-xs flex-1 ml-2 focus:outline-none focus:border-[#1b4985]"
                          options={field.options.map(o => ({ value: o, label: o }))}
                        />
                      ) : (
                        <input type={field.type} value={debtorsConfig[field.key]} onChange={e => setDebtorsConfig(p => ({...p, [field.key]: e.target.value}))}
                          className="border border-gray-300 rounded px-2 py-1 text-xs flex-1 ml-2 focus:outline-none focus:border-[#1b4985]" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
                  <button onClick={() => setShowDebtorsModal(false)}
                    className="px-4 py-1.5 bg-[#1b4985] text-white text-xs font-bold rounded hover:bg-blue-800 transition-colors">Ok</button>
                  <button onClick={() => setShowDebtorsModal(false)}
                    className="px-4 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded hover:bg-gray-300 transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );

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
