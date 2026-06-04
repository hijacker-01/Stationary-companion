import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { Search } from "lucide-react";

const fmt = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const customersData = [
  {
    id: 1, name: 'AADI SHARTH MEDICAL STORE', location: 'GADARWARA',
    ledger: [
      { date: '01/07/2026', voucher: 'SI-000123', type: 'SI', particulars: 'SALES INVOICE', debit: 4458.00, credit: 0.00, balance: '4458.00 Dr' },
      { date: '03/07/2026', voucher: 'SI-000145', type: 'SI', particulars: 'SALES INVOICE', debit: 6084.00, credit: 0.00, balance: '10542.00 Dr' },
      { date: '05/07/2026', voucher: 'RC-000067', type: 'RC', particulars: 'RECEIPT', debit: 0.00, credit: 5000.00, balance: '5542.00 Dr' },
      { date: '07/07/2026', voucher: 'SI-000178', type: 'SI', particulars: 'SALES INVOICE', debit: 2796.00, credit: 0.00, balance: '8338.00 Dr' },
      { date: '09/07/2026', voucher: 'RC-000073', type: 'RC', particulars: 'RECEIPT', debit: 0.00, credit: 2254.00, balance: '6084.00 Dr' },
      { date: '11/07/2026', voucher: 'SI-000201', type: 'SI', particulars: 'SALES INVOICE', debit: 0.00, credit: 0.00, balance: '6084.00 Dr' },
    ],
    opening: 0.00, openingType: 'Dr', totalDebit: 13338.00, totalCredit: 7254.00, balance: 6084.00, balanceType: 'Dr',
    summary: 0.00, mot: 0.00, overdue: 6084.00, futureAmt: 0.00,
    creditLimit: 0.00, availableLimit: 0.00, type: 'SUNDRY DEBTOR',
    lastSale: '11/07/2026', lastReceipt: '09/07/2026', creditDays: 0, creditDaysUsed: 0, creditDaysBal: 0,
    priceLevel: 'PL-1', salesman: 'NA',
  },
  {
    id: 2, name: 'AARKHTI GENERAL STORES', location: 'NARSINGHPUR',
    ledger: [
      { date: '02/07/2026', voucher: 'SI-000130', type: 'SI', particulars: 'SALES INVOICE', debit: 8920.00, credit: 0.00, balance: '8920.00 Dr' },
      { date: '06/07/2026', voucher: 'RC-000070', type: 'RC', particulars: 'RECEIPT', debit: 0.00, credit: 5000.00, balance: '3920.00 Dr' },
    ],
    opening: 0.00, openingType: 'Dr', totalDebit: 8920.00, totalCredit: 5000.00, balance: 3920.00, balanceType: 'Dr',
    summary: 0.00, mot: 0.00, overdue: 3920.00, futureAmt: 0.00,
    creditLimit: 10000.00, availableLimit: 6080.00, type: 'SUNDRY DEBTOR',
    lastSale: '02/07/2026', lastReceipt: '06/07/2026', creditDays: 30, creditDaysUsed: 15, creditDaysBal: 15,
    priceLevel: 'PL-1', salesman: 'RAMESH',
  },
  {
    id: 3, name: 'AARAV PHARMACY', location: 'GADARWARA',
    ledger: [
      { date: '04/07/2026', voucher: 'SI-000155', type: 'SI', particulars: 'SALES INVOICE', debit: 15200.00, credit: 0.00, balance: '15200.00 Dr' },
      { date: '08/07/2026', voucher: 'SI-000185', type: 'SI', particulars: 'SALES INVOICE', debit: 3400.00, credit: 0.00, balance: '18600.00 Dr' },
      { date: '10/07/2026', voucher: 'RC-000080', type: 'RC', particulars: 'RECEIPT', debit: 0.00, credit: 10000.00, balance: '8600.00 Dr' },
    ],
    opening: 0.00, openingType: 'Dr', totalDebit: 18600.00, totalCredit: 10000.00, balance: 8600.00, balanceType: 'Dr',
    summary: 0.00, mot: 0.00, overdue: 0.00, futureAmt: 8600.00,
    creditLimit: 25000.00, availableLimit: 16400.00, type: 'SUNDRY DEBTOR',
    lastSale: '08/07/2026', lastReceipt: '10/07/2026', creditDays: 45, creditDaysUsed: 10, creditDaysBal: 35,
    priceLevel: 'PL-2', salesman: 'SURESH',
  },
  {
    id: 4, name: 'AAROGYA MEDICAL AND GENRAL', location: 'GADARWARA',
    ledger: [
      { date: '05/07/2026', voucher: 'SI-000160', type: 'SI', particulars: 'SALES INVOICE', debit: 4500.00, credit: 0.00, balance: '4500.00 Dr' },
    ],
    opening: 0.00, openingType: 'Dr', totalDebit: 4500.00, totalCredit: 0.00, balance: 4500.00, balanceType: 'Dr',
    summary: 0.00, mot: 0.00, overdue: 4500.00, futureAmt: 0.00,
    creditLimit: 5000.00, availableLimit: 500.00, type: 'SUNDRY DEBTOR',
    lastSale: '05/07/2026', lastReceipt: '', creditDays: 15, creditDaysUsed: 20, creditDaysBal: -5,
    priceLevel: 'PL-1', salesman: 'NA',
  },
  {
    id: 5, name: 'ABIA PHARMA', location: 'BILASPUR (C.G.)',
    ledger: [
      { date: '01/07/2026', voucher: 'SI-000121', type: 'SI', particulars: 'SALES INVOICE', debit: 22450.00, credit: 0.00, balance: '22450.00 Dr' },
      { date: '05/07/2026', voucher: 'RC-000065', type: 'RC', particulars: 'RECEIPT', debit: 0.00, credit: 15000.00, balance: '7450.00 Dr' },
      { date: '09/07/2026', voucher: 'SI-000190', type: 'SI', particulars: 'SALES INVOICE', debit: 9800.00, credit: 0.00, balance: '17250.00 Dr' },
    ],
    opening: 0.00, openingType: 'Dr', totalDebit: 32250.00, totalCredit: 15000.00, balance: 17250.00, balanceType: 'Dr',
    summary: 0.00, mot: 0.00, overdue: 7450.00, futureAmt: 9800.00,
    creditLimit: 50000.00, availableLimit: 32750.00, type: 'SUNDRY DEBTOR',
    lastSale: '09/07/2026', lastReceipt: '05/07/2026', creditDays: 60, creditDaysUsed: 25, creditDaysBal: 35,
    priceLevel: 'PL-2', salesman: 'DINESH',
  },
  {
    id: 6, name: 'ADARSH MEDICAL SIHORA', location: 'SIHORA',
    ledger: [
      { date: '03/07/2026', voucher: 'SI-000140', type: 'SI', particulars: 'SALES INVOICE', debit: 3200.00, credit: 0.00, balance: '3200.00 Dr' },
    ],
    opening: 0.00, openingType: 'Dr', totalDebit: 3200.00, totalCredit: 0.00, balance: 3200.00, balanceType: 'Dr',
    summary: 0.00, mot: 0.00, overdue: 3200.00, futureAmt: 0.00,
    creditLimit: 0.00, availableLimit: 0.00, type: 'SUNDRY DEBTOR',
    lastSale: '03/07/2026', lastReceipt: '', creditDays: 0, creditDaysUsed: 0, creditDaysBal: 0,
    priceLevel: 'PL-1', salesman: 'NA',
  },
  {
    id: 7, name: 'ADS PHARMA', location: '',
    ledger: [],
    opening: 0.00, openingType: '', totalDebit: 0.00, totalCredit: 0.00, balance: 0.00, balanceType: '',
    summary: 0.00, mot: 0.00, overdue: 0.00, futureAmt: 0.00,
    creditLimit: 0.00, availableLimit: 0.00, type: 'SUNDRY DEBTOR',
    lastSale: '', lastReceipt: '', creditDays: 0, creditDaysUsed: 0, creditDaysBal: 0,
    priceLevel: 'PL-1', salesman: 'NA',
  },
  {
    id: 8, name: 'ADDITIONAL TAX ON SALES', location: '',
    ledger: [],
    opening: 0.00, openingType: '', totalDebit: 0.00, totalCredit: 0.00, balance: 0.00, balanceType: '',
    summary: 0.00, mot: 0.00, overdue: 0.00, futureAmt: 0.00,
    creditLimit: 0.00, availableLimit: 0.00, type: 'SUNDRY DEBTOR',
    lastSale: '', lastReceipt: '', creditDays: 0, creditDaysUsed: 0, creditDaysBal: 0,
    priceLevel: 'PL-1', salesman: 'NA',
  },
  {
    id: 9, name: 'ADS PHARMA', location: 'JABALPUR',
    ledger: [
      { date: '06/07/2026', voucher: 'SI-000170', type: 'SI', particulars: 'SALES INVOICE', debit: 5600.00, credit: 0.00, balance: '5600.00 Dr' },
    ],
    opening: 0.00, openingType: 'Dr', totalDebit: 5600.00, totalCredit: 0.00, balance: 5600.00, balanceType: 'Dr',
    summary: 0.00, mot: 0.00, overdue: 5600.00, futureAmt: 0.00,
    creditLimit: 10000.00, availableLimit: 4400.00, type: 'SUNDRY DEBTOR',
    lastSale: '06/07/2026', lastReceipt: '', creditDays: 30, creditDaysUsed: 12, creditDaysBal: 18,
    priceLevel: 'PL-1', salesman: 'RAMESH',
  },
  {
    id: 10, name: 'AGRADEN KIRANA STORES', location: 'GADARWARA',
    ledger: [
      { date: '02/07/2026', voucher: 'SI-000132', type: 'SI', particulars: 'SALES INVOICE', debit: 1800.00, credit: 0.00, balance: '1800.00 Dr' },
      { date: '08/07/2026', voucher: 'RC-000078', type: 'RC', particulars: 'RECEIPT', debit: 0.00, credit: 1800.00, balance: '0.00' },
    ],
    opening: 0.00, openingType: 'Dr', totalDebit: 1800.00, totalCredit: 1800.00, balance: 0.00, balanceType: '',
    summary: 0.00, mot: 0.00, overdue: 0.00, futureAmt: 0.00,
    creditLimit: 5000.00, availableLimit: 5000.00, type: 'SUNDRY DEBTOR',
    lastSale: '02/07/2026', lastReceipt: '08/07/2026', creditDays: 15, creditDaysUsed: 0, creditDaysBal: 15,
    priceLevel: 'PL-1', salesman: 'SURESH',
  },
  {
    id: 11, name: 'AGRAWAL DISTRIBUTORS', location: 'INDORE',
    ledger: [
      { date: '01/07/2026', voucher: 'SI-000120', type: 'SI', particulars: 'SALES INVOICE', debit: 45000.00, credit: 0.00, balance: '45000.00 Dr' },
      { date: '07/07/2026', voucher: 'RC-000075', type: 'RC', particulars: 'RECEIPT', debit: 0.00, credit: 20000.00, balance: '25000.00 Dr' },
    ],
    opening: 0.00, openingType: 'Dr', totalDebit: 45000.00, totalCredit: 20000.00, balance: 25000.00, balanceType: 'Dr',
    summary: 0.00, mot: 0.00, overdue: 25000.00, futureAmt: 0.00,
    creditLimit: 100000.00, availableLimit: 75000.00, type: 'SUNDRY DEBTOR',
    lastSale: '01/07/2026', lastReceipt: '07/07/2026', creditDays: 45, creditDaysUsed: 18, creditDaysBal: 27,
    priceLevel: 'PL-3', salesman: 'DINESH',
  },
];

export default function DebtorsBoard() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(1);
  const [search, setSearch] = useState("");
  const [ledgerStatus, setLedgerStatus] = useState("ALL");

  const filtered = customersData.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = customersData.find(c => c.id === selectedId) || customersData[0];

  const DetailItem = ({ label, value, bold = false, color = '' }) => (
    <div className="flex items-center justify-between py-[3px]">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`text-xs ${bold ? 'font-bold' : 'font-semibold'} ${color || 'text-gray-800'}`}>{value}</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#e5e5e5] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">

          {/* Title Bar */}
          <div className="bg-[#1b4985] text-white px-6 py-2.5 flex items-center justify-between shadow-md flex-shrink-0">
            <div>
              <h1 className="text-base font-bold tracking-wide">ACCOUNTS RECEIVABLE — SUBHASH MEDICOSE — SM001</h1>
              <p className="text-[11px] text-blue-200 opacity-80">UPTO : 11/07/2026</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 rounded px-2 py-1">
                <span className="text-[10px] text-blue-200">SHOW</span>
                <select value={ledgerStatus} onChange={e => setLedgerStatus(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer">
                  <option value="ALL" className="text-gray-800">ALL</option>
                  <option value="ACTIVE" className="text-gray-800">ACTIVE</option>
                  <option value="INACTIVE" className="text-gray-800">INACTIVE</option>
                </select>
              </div>
              <button className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors font-semibold">
                Refresh
              </button>
            </div>
          </div>

          {/* Search Strip */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search customer name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1b4985]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-medium">LEDGER STATUS</span>
              <select value={ledgerStatus} onChange={e => setLedgerStatus(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1b4985]">
                <option>ALL</option><option>ACTIVE</option><option>INACTIVE</option>
              </select>
            </div>
            <div className="ml-auto text-xs text-gray-400 font-medium">
              TOTAL CUSTOMERS : <span className="text-gray-700 font-bold">{filtered.length}</span>
            </div>
          </div>

          {/* Split Panel: Customer List + Ledger */}
          <div className="flex-1 flex overflow-hidden">

            {/* Left: Customer List */}
            <div className="w-[320px] flex-shrink-0 border-r border-gray-200 overflow-y-auto bg-white">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-gray-100 border-b-2 border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Customer Name</th>
                    <th className="py-2 px-3 text-left text-[10px] font-semibold text-gray-500 uppercase w-28">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={`cursor-pointer transition-colors border-b border-gray-50
                        ${selectedId === c.id
                          ? 'bg-blue-50 border-l-[3px] border-l-[#1b4985] font-bold'
                          : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                        }`}
                    >
                      <td className="py-1.5 px-3 text-gray-800">{c.name}</td>
                      <td className="py-1.5 px-3 text-gray-500">{c.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right: Ledger + Current Status */}
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* Ledger Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-1.5 flex-shrink-0">
                <span className="text-xs text-gray-400 font-medium">LEDGER : </span>
                <span className="text-xs font-bold text-[#1b4985]">{selected.name}</span>
              </div>

              {/* Ledger Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-gray-100 border-b-2 border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-1.5 px-3 text-left text-[10px] font-semibold text-gray-500 uppercase w-24">Date</th>
                      <th className="py-1.5 px-3 text-left text-[10px] font-semibold text-gray-500 uppercase w-28">Voucher</th>
                      <th className="py-1.5 px-3 text-left text-[10px] font-semibold text-gray-500 uppercase w-12">Type</th>
                      <th className="py-1.5 px-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Particulars</th>
                      <th className="py-1.5 px-3 text-right text-[10px] font-semibold text-gray-500 uppercase w-28">Debit</th>
                      <th className="py-1.5 px-3 text-right text-[10px] font-semibold text-gray-500 uppercase w-28">Credit</th>
                      <th className="py-1.5 px-3 text-right text-[10px] font-semibold text-gray-500 uppercase w-32">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.ledger.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-gray-400">No ledger entries</td></tr>
                    ) : (
                      selected.ledger.map((entry, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-1.5 px-3 text-gray-600">{entry.date}</td>
                          <td className="py-1.5 px-3 text-gray-700 font-medium">{entry.voucher}</td>
                          <td className="py-1.5 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold
                              ${entry.type === 'SI' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {entry.type}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-gray-700">{entry.particulars}</td>
                          <td className="py-1.5 px-3 text-right font-semibold text-gray-700">
                            {entry.debit > 0 ? fmt(entry.debit) : ''}
                          </td>
                          <td className="py-1.5 px-3 text-right font-semibold text-gray-700">
                            {entry.credit > 0 ? fmt(entry.credit) : ''}
                          </td>
                          <td className="py-1.5 px-3 text-right font-bold text-gray-800">{entry.balance}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Current Status Box */}
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 flex-shrink-0">
                <p className="text-[9px] uppercase tracking-widest text-[#1b4985] font-bold mb-1">Current Status</p>
                <div className="grid grid-cols-4 gap-6 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Opening</span>
                    <span className={`font-bold ${selected.openingType === 'Dr' ? 'text-red-600' : 'text-green-700'}`}>
                      {fmt(selected.opening)} {selected.openingType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Debit</span>
                    <span className="font-semibold text-gray-800">{fmt(selected.totalDebit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Credit</span>
                    <span className="font-semibold text-gray-800">{fmt(selected.totalCredit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Balance</span>
                    <span className={`font-bold ${selected.balanceType === 'Dr' ? 'text-red-600' : 'text-green-700'}`}>
                      {fmt(selected.balance)} {selected.balanceType}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Detail Panel */}
          <div className="bg-white border-t-2 border-[#1b4985] flex-shrink-0">
            <div className="grid grid-cols-4 divide-x divide-gray-200 text-xs">

              {/* Summary */}
              <div className="px-4 py-2">
                <p className="text-[9px] uppercase tracking-widest text-[#1b4985] mb-1.5 font-bold border-b border-gray-100 pb-1">Summary</p>
                <DetailItem label="Summary" value={fmt(selected.summary)} />
                <DetailItem label="MOT" value={fmt(selected.mot)} />
                <DetailItem label="Overdue" value={fmt(selected.overdue)} bold color={selected.overdue > 0 ? 'text-red-600' : ''} />
                <DetailItem label="Future Amount" value={fmt(selected.futureAmt)} />
              </div>

              {/* Credit Info */}
              <div className="px-4 py-2">
                <p className="text-[9px] uppercase tracking-widest text-[#1b4985] mb-1.5 font-bold border-b border-gray-100 pb-1">Credit Info</p>
                <DetailItem label="Credit Limit" value={fmt(selected.creditLimit)} />
                <DetailItem label="Available Limit" value={fmt(selected.availableLimit)} bold color={selected.availableLimit > 0 ? 'text-green-700' : 'text-red-600'} />
                <DetailItem label="Type" value={selected.type} />
              </div>

              {/* Sales Info */}
              <div className="px-4 py-2">
                <p className="text-[9px] uppercase tracking-widest text-[#1b4985] mb-1.5 font-bold border-b border-gray-100 pb-1">Sales Info</p>
                <DetailItem label="Last Sale" value={selected.lastSale || '—'} />
                <DetailItem label="Last Receipt" value={selected.lastReceipt || '—'} />
                <DetailItem label="Salesman" value={selected.salesman} />
                <DetailItem label="Price Level" value={selected.priceLevel} />
              </div>

              {/* Credit Days */}
              <div className="px-4 py-2">
                <p className="text-[9px] uppercase tracking-widest text-[#1b4985] mb-1.5 font-bold border-b border-gray-100 pb-1">Credit Days</p>
                <DetailItem label="Credit Days" value={selected.creditDays} />
                <DetailItem label="Days Used" value={selected.creditDaysUsed} />
                <DetailItem label="Days Balance" value={selected.creditDaysBal} bold color={selected.creditDaysBal < 0 ? 'text-red-600' : 'text-green-700'} />
              </div>

            </div>
          </div>

          {/* Shortcut Bar */}
          <div className="bg-gray-100 border-t border-gray-200 px-6 py-1 flex items-center gap-4 text-[10px] text-gray-500 font-medium flex-shrink-0">
            <span><span className="text-red-500 font-bold">F1</span> HELP</span>
            <span><span className="text-[#1b4985] font-bold">F2</span> DETAIL</span>
            <span><span className="text-[#1b4985] font-bold">F3</span> EDIT</span>
            <span><span className="text-[#1b4985] font-bold">F4</span> LEDGER</span>
            <span><span className="text-[#1b4985] font-bold">F5</span> AGEING</span>
            <span><span className="text-[#1b4985] font-bold">F6</span> PDC</span>
            <span><span className="text-[#1b4985] font-bold">F8</span> STATEMENT</span>
            <span><span className="text-[#1b4985] font-bold">F9</span> REPORTS</span>
            <span><span className="text-[#1b4985] font-bold">F10</span> EXPORT</span>
            <span><span className="text-[#1b4985] font-bold">F11</span> PRINT</span>
            <span><span className="text-[#1b4985] font-bold">F12</span> OPTIONS</span>
            <span><span className="text-red-500 font-bold">ESC</span> EXIT</span>
            <div className="ml-auto text-gray-400">COMPANY : SUBHASH MEDICOSE · USER : ADMIN · FY : 01/04/2026 to 31/03/2027</div>
          </div>

        </main>
      </div>
    </div>
  );
}
