import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const inventoryData = [
  { id: 1, desc: '10+2 INDIA SUGER ROZZANA', packing: '1 X 12 X 10', stock: 8.00,
    purRate: 120.00, cost: 120.00, marginPct: 25.00, woDeal: 150.00, marginPct2: 20.00, purDeal: 110.00, purDisc: 8.33,
    mrp: 180.00, rate: 150.00, taxT: 5.00, cgss: 2.50, fRate: 150.00, dealF: 0.00, excise: 0.00,
    company: 'INDIA SUGAR MFG CO.', hsn: '17019910', mfr: 'INDIA SUGAR MFG CO.', rack: 'A-01-01', conv: '1 BOX = 12 PCS', batch: '90021', batchQty: '8:00' },
  { id: 2, desc: '10+2 LADIES HAND BAG', packing: '1 X 10 X 12', stock: 15.00,
    purRate: 250.00, cost: 250.00, marginPct: 40.00, woDeal: 350.00, marginPct2: 28.57, purDeal: 230.00, purDisc: 8.00,
    mrp: 499.00, rate: 350.00, taxT: 18.00, cgss: 9.00, fRate: 350.00, dealF: 0.00, excise: 0.00,
    company: 'FASHION BAGS PVT LTD', hsn: '42022210', mfr: 'FASHION BAGS PVT LTD', rack: 'C-03-05', conv: '1 BOX = 10 PCS', batch: '88140', batchQty: '15:00' },
  { id: 3, desc: '100 BOX/300PC ATTRO COPPER', packing: '1 X 100 X 300', stock: 23.00,
    purRate: 85.00, cost: 85.00, marginPct: 17.65, woDeal: 100.00, marginPct2: 15.00, purDeal: 80.00, purDisc: 5.88,
    mrp: 120.00, rate: 100.00, taxT: 12.00, cgss: 6.00, fRate: 100.00, dealF: 0.00, excise: 0.00,
    company: 'ATTRO INDUSTRIES', hsn: '74181090', mfr: 'ATTRO INDUSTRIES', rack: 'D-01-02', conv: '1 BOX = 300 PCS', batch: '77502', batchQty: '23:00' },
  { id: 4, desc: '100 UNIT ASSO 6PC SET MILTON', packing: '1 X 100 X 6', stock: 12.00,
    purRate: 320.00, cost: 320.00, marginPct: 21.88, woDeal: 390.00, marginPct2: 17.95, purDeal: 300.00, purDisc: 6.25,
    mrp: 450.00, rate: 390.00, taxT: 18.00, cgss: 9.00, fRate: 390.00, dealF: 0.00, excise: 0.00,
    company: 'HAMILTON HOUSEWARES', hsn: '39241090', mfr: 'MILTON INDUSTRIES LTD', rack: 'D-02-08', conv: '1 SET = 6 PCS', batch: '66310', batchQty: '12:00' },
  { id: 5, desc: '12 PCS GLASS BOWL SET DELI', packing: '1 X 12 SET', stock: 6.00,
    purRate: 410.00, cost: 410.00, marginPct: 19.51, woDeal: 490.00, marginPct2: 16.33, purDeal: 395.00, purDisc: 3.66,
    mrp: 599.00, rate: 490.00, taxT: 18.00, cgss: 9.00, fRate: 490.00, dealF: 0.00, excise: 0.00,
    company: 'DELI GLASSWARE LTD', hsn: '70134990', mfr: 'DELI GLASSWARE LTD', rack: 'D-04-01', conv: '1 SET = 12 PCS', batch: '55201', batchQty: '6:00' },
  { id: 6, desc: '250ML HAND SANITIZER BOTTLE', packing: '1 X 50 X 250ML', stock: 120.00,
    purRate: 45.00, cost: 45.00, marginPct: 33.33, woDeal: 60.00, marginPct2: 25.00, purDeal: 42.00, purDisc: 6.67,
    mrp: 80.00, rate: 60.00, taxT: 18.00, cgss: 9.00, fRate: 60.00, dealF: 0.00, excise: 0.00,
    company: 'CLEANWELL PHARMA', hsn: '38089490', mfr: 'CLEANWELL PHARMA', rack: 'A-05-03', conv: '1 BOX = 50 BOTTLES', batch: '44109', batchQty: '120:00' },
  { id: 7, desc: '500MG PARACETAMOL TABLET', packing: '10 X 10 X 10', stock: 2350.00,
    purRate: 12.50, cost: 12.50, marginPct: 28.00, woDeal: 16.00, marginPct2: 21.88, purDeal: 11.50, purDisc: 8.00,
    mrp: 22.00, rate: 16.00, taxT: 12.00, cgss: 6.00, fRate: 16.00, dealF: 0.00, excise: 0.00,
    company: 'CIPLA LTD.', hsn: '30049099', mfr: 'CIPLA LTD.', rack: 'B-01-01', conv: '1 BOX = 10 STRIPS', batch: '33087', batchQty: '2350:00' },
  { id: 8, desc: 'AMOXICILLIN 500MG CAPSULE', packing: '10 X 10 X 10', stock: 1850.00,
    purRate: 28.00, cost: 28.00, marginPct: 25.00, woDeal: 35.00, marginPct2: 20.00, purDeal: 26.00, purDisc: 7.14,
    mrp: 48.00, rate: 35.00, taxT: 12.00, cgss: 6.00, fRate: 35.00, dealF: 0.00, excise: 0.00,
    company: 'SUN PHARMA LTD.', hsn: '30041011', mfr: 'SUN PHARMA LTD.', rack: 'B-01-04', conv: '1 BOX = 10 STRIPS', batch: '22015', batchQty: '1850:00' },
  { id: 9, desc: 'AZITHROMYCIN 500MG TABLET', packing: '10 X 1 X 10', stock: 4.50,
    purRate: 38.57, cost: 38.57, marginPct: 30.02, woDeal: 50.14, marginPct2: 23.07, purDeal: 36.60, purDisc: 5.10,
    mrp: 65.00, rate: 50.00, taxT: 12.00, cgss: 6.00, fRate: 50.00, dealF: 0.00, excise: 0.00,
    company: 'MANKIND PHARMA LTD.', hsn: '30049069', mfr: 'MANKIND PHARMA LTD.', rack: 'B-02-03', conv: '1 BOX = 10 STRIPS', batch: '29115', batchQty: '4:50' },
  { id: 10, desc: 'CALCIUM CARBONATE 500MG TAB', packing: '10 X 10 X 10', stock: 1560.00,
    purRate: 22.00, cost: 22.00, marginPct: 27.27, woDeal: 28.00, marginPct2: 21.43, purDeal: 20.50, purDisc: 6.82,
    mrp: 38.00, rate: 28.00, taxT: 12.00, cgss: 6.00, fRate: 28.00, dealF: 0.00, excise: 0.00,
    company: 'ABBOTT INDIA LTD.', hsn: '30049099', mfr: 'ABBOTT INDIA LTD.', rack: 'B-03-01', conv: '1 BOX = 10 STRIPS', batch: '18203', batchQty: '1560:00' },
  { id: 11, desc: 'DICLOFENAC SODIUM 50MG TAB', packing: '10 X 10 X 10', stock: 2420.00,
    purRate: 8.50, cost: 8.50, marginPct: 29.41, woDeal: 11.00, marginPct2: 22.73, purDeal: 7.80, purDisc: 8.24,
    mrp: 15.00, rate: 11.00, taxT: 12.00, cgss: 6.00, fRate: 11.00, dealF: 0.00, excise: 0.00,
    company: 'NOVARTIS INDIA LTD.', hsn: '30049039', mfr: 'NOVARTIS INDIA LTD.', rack: 'B-03-06', conv: '1 BOX = 10 STRIPS', batch: '17440', batchQty: '2420:00' },
  { id: 12, desc: 'VITAMIN C 500MG TABLET', packing: '10 X 15 X 10', stock: 980.00,
    purRate: 18.00, cost: 18.00, marginPct: 22.22, woDeal: 22.00, marginPct2: 18.18, purDeal: 16.50, purDisc: 8.33,
    mrp: 30.00, rate: 22.00, taxT: 12.00, cgss: 6.00, fRate: 22.00, dealF: 0.00, excise: 0.00,
    company: 'LIMCEE PHARMA', hsn: '30049099', mfr: 'LIMCEE PHARMA', rack: 'B-04-02', conv: '1 BOX = 15 STRIPS', batch: '16305', batchQty: '980:00' },
];

export default function ClosingStock() {
  const [selectedRow, setSelectedRow] = useState(9);
  const [filters, setFilters] = useState({
    dateFrom: '2026-05-29',
    dateTo: '2026-05-29',
    godown: 'MAIN GODOWN',
    group: 'ALL GROUP',
    category: 'ALL CATEGORY',
    item: 'ALL ITEMS',
  });

  const selected = inventoryData.find(r => r.id === selectedRow) || inventoryData[0];

  const DetailItem = ({ label, value, suffix = '' }) => (
    <div className="flex items-center justify-between py-1 font-bold">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900">{typeof value === 'number' ? value.toFixed(2) : value}{suffix}</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#e5e5e5] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">

          {/* Page Title Bar */}
          <div className="bg-[#1b4985] text-white px-6 py-3 flex items-center justify-between shadow-md">
            <div>
              <h1 className="text-lg font-bold tracking-wide">CLOSING STOCK</h1>
              <p className="text-xs text-blue-200 opacity-80">Stock Unit Packing · As on {filters.dateTo}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-white/10 px-3 py-1 rounded">USER: ADMIN</span>
              <button className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors font-semibold">
                F8 Change
              </button>
            </div>
          </div>

          {/* Filter Strip */}
          <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center gap-6 text-xs shadow-sm">
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
                <option>ALL GROUP</option><option>PHARMA</option><option>FMCG</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500 font-medium">Category</label>
              <select value={filters.category} onChange={e => setFilters(p => ({...p, category: e.target.value}))}
                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1b4985]">
                <option>ALL CATEGORY</option><option>TABLETS</option><option>CAPSULES</option>
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
                  <th className="w-44 py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Packing</th>
                  <th className="w-32 py-2 px-3 text-right text-xs font-semibold text-gray-500 uppercase">MRP</th>
                  <th className="w-36 py-2 px-3 text-right text-xs font-semibold text-gray-500 uppercase">Stock (Pcs)</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((row) => (
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
                    <td className="py-1.5 px-3 text-gray-500">{row.packing}</td>
                    <td className="py-1.5 px-3 text-right font-semibold text-gray-700">₹{row.mrp.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-right">
                      <span className={`font-bold ${row.stock < 10 ? 'text-red-600' : 'text-green-700'}`}>
                        {row.stock.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Detail Panel — full width, sectioned horizontally */}
          <div className="bg-white border-t-2 border-[#1b4985] flex-shrink-0">

            {/* Selected item name strip */}
            <div className="bg-[#1b4985] text-white px-5 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-widest text-blue-200">Selected:</span>
                <span className="text-sm font-bold">{selected.desc}</span>
                <span className="text-xs text-blue-200">({selected.packing})</span>
              </div>
              <span className={`text-base font-extrabold ${selected.stock < 10 ? 'text-red-300' : 'text-green-300'}`}>
                Stock: {selected.stock.toFixed(2)}
              </span>
            </div>

            {/* 5-column detail grid */}
            <div className="grid grid-cols-5 divide-x divide-gray-200 text-sm">

              {/* Pricing */}
              <div className="px-5 py-4">
                <p className="text-[11px] uppercase tracking-widest text-[#1b4985] mb-2 font-black border-b border-gray-100 pb-1">Pricing</p>
                <DetailItem label="M.R.P." value={selected.mrp} />
                <DetailItem label="Rate" value={selected.rate} />
                <DetailItem label="Pur Rate" value={selected.purRate} />
                <DetailItem label="Cost" value={selected.cost} />
                <DetailItem label="F.Rate" value={selected.fRate} />
                <DetailItem label="Deal [F]" value={selected.dealF} />
              </div>

              {/* Margins */}
              <div className="px-5 py-4">
                <p className="text-[11px] uppercase tracking-widest text-[#1b4985] mb-2 font-black border-b border-gray-100 pb-1">Margins & Deals</p>
                <DetailItem label="Margin %" value={selected.marginPct} suffix=" %" />
                <DetailItem label="W/o Deal" value={selected.woDeal} />
                <DetailItem label="Margin (Deal)" value={selected.marginPct2} suffix=" %" />
                <DetailItem label="Pur Deal" value={selected.purDeal} />
                <DetailItem label="Pur Disc" value={selected.purDisc} suffix=" %" />
              </div>

              {/* Tax */}
              <div className="px-5 py-4">
                <p className="text-[11px] uppercase tracking-widest text-[#1b4985] mb-2 font-black border-b border-gray-100 pb-1">Tax</p>
                <DetailItem label="Tax Type" value={selected.taxT} suffix=" %" />
                <DetailItem label="CGST/SGST" value={selected.cgss} suffix=" %" />
                <DetailItem label="Excise" value={selected.excise} suffix=" %" />
              </div>

              {/* Product Info */}
              <div className="px-5 py-4">
                <p className="text-[11px] uppercase tracking-widest text-[#1b4985] mb-2 font-black border-b border-gray-100 pb-1">Product Info</p>
                <DetailItem label="Company" value={selected.company} />
                <DetailItem label="HSN/SAC" value={selected.hsn} />
                <DetailItem label="Mfr." value={selected.mfr} />
                <DetailItem label="Rack No." value={selected.rack} />
                <DetailItem label="Conv." value={selected.conv} />
              </div>

              {/* Batch */}
              <div className="px-5 py-4">
                <p className="text-[11px] uppercase tracking-widest text-[#1b4985] mb-2 font-black border-b border-gray-100 pb-1">Batch Detail</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-center text-sm font-bold text-gray-900">
                    {selected.batch}
                  </div>
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-center text-sm font-bold text-gray-900">
                    {selected.batchQty}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Shortcut Bar */}
          <div className="bg-gray-100 border-t border-gray-200 px-6 py-2.5 flex items-center gap-6 text-xs text-gray-600 font-bold flex-shrink-0 shadow-inner">
            <span><span className="text-[#1b4985] font-black mr-1">F3</span> Edit</span>
            <span><span className="text-[#1b4985] font-black mr-1">F5</span> Index</span>
            <span><span className="text-red-600 font-black mr-1">Enter</span> Register</span>
            <span><span className="text-[#1b4985] font-black mr-1">F6</span> Calculate Total</span>
            <span><span className="text-[#1b4985] font-black mr-1">F10</span> Filter</span>
            <span><span className="text-red-600 font-black mr-1">Alt+P</span> Print</span>
            <span><span className="text-red-500 font-bold">Ctrl+F1</span> Ageing</span>
            <div className="ml-auto text-gray-400">SUBHASH MEDICOSE · GSTIN: 08ABFCS9604F1ZK</div>
          </div>

        </main>
      </div>
    </div>
  );
}
