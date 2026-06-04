import { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const accountsData = [
  {
    id: 1, desc: 'AXIS BANK', acNo: '', debit: 0, credit: 1529603.77,
    address: ['AXIS BANK LTD', 'CIVIL LINES BRANCH', 'GADARWARA, MP 487551'],
    phone: '0755-2345678',
    accountNo: '917020043210987',
    totalAmt: '1529603.77 Cr',
    opening: 1529603.77, openingType: 'Cr',
    debitAmt: 0.00, creditAmt: 0.00, balance: 1529603.77, balanceType: 'Cr',
    pdc: 0.00, net: 1529603.77, netType: 'Cr',
    type: 1529603.77, typeLabel: 'Cr',
    nameQ: 'AXIS BANK'
  },
  {
    id: 2, desc: 'CASH', acNo: '', debit: 0, credit: 121500.00,
    address: ['CASH ACCOUNT', 'MAIN COUNTER', 'GADARWARA'],
    phone: '',
    accountNo: 'CASH-001',
    totalAmt: '121500.00 Cr',
    opening: 121500.00, openingType: 'Cr',
    debitAmt: 0.00, creditAmt: 0.00, balance: 121500.00, balanceType: 'Cr',
    pdc: 0.00, net: 121500.00, netType: 'Cr',
    type: 121500.00, typeLabel: 'Cr',
    nameQ: 'CASH'
  },
  {
    id: 3, desc: 'CASH [MARGPAY PENDING]', acNo: 'GADARWARA', debit: 31203495.00, credit: 0,
    address: ['MARGPAY PENDING A/C', 'DIGITAL PAYMENTS', 'GADARWARA'],
    phone: '',
    accountNo: 'MARGPAY-PND-001',
    totalAmt: '31203495.00 Dr',
    opening: 0.00, openingType: 'Dr',
    debitAmt: 31203495.00, creditAmt: 0.00, balance: 31203495.00, balanceType: 'Dr',
    pdc: 0.00, net: 31203495.00, netType: 'Dr',
    type: 31203495.00, typeLabel: 'Dr',
    nameQ: 'CASH [MARGPAY PENDING]'
  },
  {
    id: 4, desc: 'ICICI BANK', acNo: '', debit: 0, credit: 9209.72,
    address: ['ICICI BANK LTD', 'M.G. ROAD BRANCH', 'GADARWARA, MP 487551'],
    phone: '0755-9876543',
    accountNo: '004401502189',
    totalAmt: '9209.72 Cr',
    opening: 9209.72, openingType: 'Cr',
    debitAmt: 0.00, creditAmt: 0.00, balance: 9209.72, balanceType: 'Cr',
    pdc: 0.00, net: 9209.72, netType: 'Cr',
    type: 9209.72, typeLabel: 'Cr',
    nameQ: 'ICICI BANK'
  },
  {
    id: 5, desc: 'KOTAK MAHINDRA BANK', acNo: 'GADARWARA', debit: 31203495.00, credit: 0,
    address: ['KOTAK MAHINDRA BANK', 'GADARWARA'],
    phone: '',
    accountNo: '00023111268001',
    totalAmt: '29533995.18 Dr',
    opening: 9186.33, openingType: 'Cr',
    debitAmt: 0.00, creditAmt: 0.00, balance: 9186.33, balanceType: 'Cr',
    pdc: 0.00, net: 9186.33, netType: 'Cr',
    type: 9186.33, typeLabel: 'Cr',
    nameQ: 'KOTAK MAHINDRA BANK'
  },
  {
    id: 6, desc: 'MARGPAY [UN-REGISTERED]', acNo: '', debit: 0, credit: 0,
    address: ['MARGPAY', 'UN-REGISTERED ACCOUNT', 'GADARWARA'],
    phone: '',
    accountNo: 'MARGPAY-UNREG',
    totalAmt: '0.00',
    opening: 0.00, openingType: '',
    debitAmt: 0.00, creditAmt: 0.00, balance: 0.00, balanceType: '',
    pdc: 0.00, net: 0.00, netType: '',
    type: 0.00, typeLabel: '',
    nameQ: 'MARGPAY [UN-REGISTERED]'
  },
  {
    id: 7, desc: 'RIOPAY [UN-REGISTERED]', acNo: '', debit: 0, credit: 0,
    address: ['RIOPAY', 'UN-REGISTERED ACCOUNT', 'GADARWARA'],
    phone: '',
    accountNo: 'RIOPAY-UNREG',
    totalAmt: '0.00',
    opening: 0.00, openingType: '',
    debitAmt: 0.00, creditAmt: 0.00, balance: 0.00, balanceType: '',
    pdc: 0.00, net: 0.00, netType: '',
    type: 0.00, typeLabel: '',
    nameQ: 'RIOPAY [UN-REGISTERED]'
  },
];

const fmt = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CashBook() {
  const [selectedRow, setSelectedRow] = useState(5);
  const [filters, setFilters] = useState({
    dateFrom: '2026-05-29',
    dateTo: '2026-05-29',
    godown: 'MAIN GODOWN',
    group: 'ALL GROUP',
    category: 'ALL CATEGORY',
    item: 'ALL ITEMS',
  });

  const selected = accountsData.find(r => r.id === selectedRow) || accountsData[0];

  const totalDebit = accountsData.reduce((s, r) => s + r.debit, 0);
  const totalCredit = accountsData.reduce((s, r) => s + r.credit, 0);

  const DetailItem = ({ label, value, suffix = '', bold = false, color = '' }) => (
    <div className="flex items-center justify-between py-[3px]">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`text-xs ${bold ? 'font-bold' : 'font-semibold'} ${color || 'text-gray-800'}`}>
        {value}{suffix}
      </span>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#e5e5e5] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">

          {/* Page Title Bar */}
          <div className="bg-[#1b4985] text-white px-6 py-3 flex items-center justify-between shadow-md flex-shrink-0">
            <div>
              <h1 className="text-lg font-bold tracking-wide">CASH & BANK BOOKS</h1>
              <p className="text-xs text-blue-200 opacity-80">Cash & Bank Books · As on {filters.dateTo}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-white/10 px-3 py-1 rounded">USER: ADMIN</span>
              <button className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors font-semibold">
                F8 Change
              </button>
            </div>
          </div>

          {/* Filter Strip */}
          <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center gap-6 text-xs shadow-sm flex-shrink-0">
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
              <select value={filters.godown} onChange={e => setFilters(p => ({...p, godown: e.target.value}))}
                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1b4985]">
                <option>MAIN GODOWN</option><option>WAREHOUSE 2</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500 font-medium">Group</label>
              <select value={filters.group} onChange={e => setFilters(p => ({...p, group: e.target.value}))}
                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1b4985]">
                <option>ALL GROUP</option><option>BANKS</option><option>CASH</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500 font-medium">Category</label>
              <select value={filters.category} onChange={e => setFilters(p => ({...p, category: e.target.value}))}
                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1b4985]">
                <option>ALL CATEGORY</option><option>SAVINGS</option><option>CURRENT</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500 font-medium">Item</label>
              <select value={filters.item} onChange={e => setFilters(p => ({...p, item: e.target.value}))}
                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1b4985]">
                <option>ALL ITEMS</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 border-b-2 border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="w-10 py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="w-40 py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">A/C No.</th>
                  <th className="w-44 py-2 px-3 text-right text-xs font-semibold text-gray-500 uppercase">Debit</th>
                  <th className="w-44 py-2 px-3 text-right text-xs font-semibold text-gray-500 uppercase">Credit</th>
                </tr>
              </thead>
              <tbody>
                {accountsData.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRow(row.id)}
                    className={`border-b border-gray-100 cursor-pointer transition-colors
                      ${selectedRow === row.id
                        ? 'bg-blue-50 border-l-4 border-l-[#1b4985]'
                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                      }`}
                  >
                    <td className="py-1.5 px-3 text-gray-400 text-xs">{row.id}</td>
                    <td className="py-1.5 px-3 font-medium text-gray-800">{row.desc}</td>
                    <td className="py-1.5 px-3 text-gray-500">{row.acNo}</td>
                    <td className="py-1.5 px-3 text-right font-semibold text-gray-700">
                      {row.debit > 0 ? `₹${fmt(row.debit)}` : ''}
                    </td>
                    <td className="py-1.5 px-3 text-right font-semibold text-gray-700">
                      {row.credit > 0 ? `₹${fmt(row.credit)}` : ''}
                    </td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="bg-gray-100 border-t-2 border-gray-300">
                  <td className="py-2 px-3" colSpan={3}>
                    <span className="text-sm font-bold text-gray-700">Total : 29533995.18 Dr</span>
                  </td>
                  <td className="py-2 px-3 text-right text-sm font-extrabold text-gray-800">₹{fmt(totalDebit)}</td>
                  <td className="py-2 px-3 text-right text-sm font-extrabold text-gray-800">₹{fmt(totalCredit)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Detail Panel — full width, 4 columns */}
          <div className="bg-white border-t-2 border-[#1b4985] flex-shrink-0">

            {/* Selected account strip */}
            <div className="bg-[#1b4985] text-white px-5 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-widest text-blue-200">Selected:</span>
                <span className="text-sm font-bold">{selected.desc}</span>
              </div>
              <span className={`text-base font-extrabold ${selected.balanceType === 'Dr' ? 'text-red-300' : 'text-green-300'}`}>
                Balance: ₹{fmt(selected.balance)} {selected.balanceType}
              </span>
            </div>

            {/* 4-column detail grid */}
            <div className="grid grid-cols-4 divide-x divide-gray-200 text-xs">

              {/* Address */}
              <div className="px-4 py-2">
                <p className="text-[9px] uppercase tracking-widest text-[#1b4985] mb-1.5 font-bold border-b border-gray-100 pb-1">Address</p>
                {selected.address.map((line, i) => (
                  <p key={i} className="text-xs text-gray-700 leading-relaxed">{line}</p>
                ))}
                {selected.phone && (
                  <div className="mt-1.5">
                    <DetailItem label="Phone" value={selected.phone} />
                  </div>
                )}
              </div>

              {/* Account Summary */}
              <div className="px-4 py-2">
                <p className="text-[9px] uppercase tracking-widest text-[#1b4985] mb-1.5 font-bold border-b border-gray-100 pb-1">Account Summary</p>
                <DetailItem label="Opening" value={`₹${fmt(selected.opening)}`} suffix={` ${selected.openingType}`} bold color={selected.openingType === 'Dr' ? 'text-red-600' : 'text-green-700'} />
                <DetailItem label="Debit" value={`₹${fmt(selected.debitAmt)}`} suffix=" Dr" />
                <DetailItem label="Credit" value={`₹${fmt(selected.creditAmt)}`} suffix=" Cr" />
                <DetailItem label="Balance" value={`₹${fmt(selected.balance)}`} suffix={` ${selected.balanceType}`} bold color={selected.balanceType === 'Dr' ? 'text-red-600' : 'text-green-700'} />
              </div>

              {/* PDC & Net */}
              <div className="px-4 py-2">
                <p className="text-[9px] uppercase tracking-widest text-[#1b4985] mb-1.5 font-bold border-b border-gray-100 pb-1">PDC & Net</p>
                <DetailItem label="P.D.C." value={`₹${fmt(selected.pdc)}`} />
                <DetailItem label="Net" value={`₹${fmt(selected.net)}`} suffix={` ${selected.netType}`} bold color={selected.netType === 'Dr' ? 'text-red-600' : 'text-green-700'} />
                <DetailItem label="Type" value={`₹${fmt(selected.type)}`} suffix={` ${selected.typeLabel}`} bold color={selected.typeLabel === 'Dr' ? 'text-red-600' : 'text-green-700'} />
                <DetailItem label="Name ?" value={selected.nameQ} />
              </div>

              {/* Identity */}
              <div className="px-4 py-2">
                <p className="text-[9px] uppercase tracking-widest text-[#1b4985] mb-1.5 font-bold border-b border-gray-100 pb-1">Identity</p>
                <DetailItem label="A/c No." value={selected.accountNo} />
                <DetailItem label="Total" value={selected.totalAmt} bold />
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-center text-xs font-semibold text-gray-800">
                    {selected.accountNo}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Shortcut Bar */}
          <div className="bg-gray-100 border-t border-gray-200 px-6 py-1 flex items-center gap-4 text-[10px] text-gray-500 font-medium flex-shrink-0">
            <span><span className="text-[#1b4985] font-bold">Alt+F1</span> Others</span>
            <span><span className="text-[#1b4985] font-bold">F3</span> Edit</span>
            <span><span className="text-red-500 font-bold">Enter</span> Register</span>
            <span><span className="text-[#1b4985] font-bold">F3</span> Bank Reconciliation</span>
            <span><span className="text-[#1b4985] font-bold">F10</span> Filter</span>
            <span><span className="text-[#1b4985] font-bold">F8</span> PDC Issue</span>
            <span><span className="text-red-500 font-bold">Ctrl+F1</span> Summary</span>
            <div className="ml-auto text-gray-400">SUBHASH MEDICOSE · GSTIN: 08ABFCS9604F1ZK</div>
          </div>

        </main>
      </div>
    </div>
  );
}
