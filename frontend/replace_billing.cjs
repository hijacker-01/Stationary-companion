const fs = require('fs');
const path = 'C:/Bpartner/marg-erp-clone/frontend/src/pages/Billing.jsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

let startIdx = lines.findIndex(l => l.includes('if (view === "create") {'));
let endIdx = -1;
let openBrackets = 0;
for (let i = startIdx; i < lines.length; i++) {
  if (lines[i].includes('{')) openBrackets += (lines[i].match(/\{/g) || []).length;
  if (lines[i].includes('}')) openBrackets -= (lines[i].match(/\}/g) || []).length;
  if (openBrackets === 0) {
    endIdx = i;
    break;
  }
}

const snippet = `  if (view === "create") {
    // Advanced GST Computation Engine
    const totals = rows.reduce((acc, r) => {
       const amount = parseFloat(r.amount || 0);
       const gstRate = parseFloat(r.gst || 0);
       const gstValue = amount * (gstRate / 100);
       acc.gross += amount;
       acc.totalGst += gstValue;
       if (gstRate === 5) acc.gst5 += gstValue;
       else if (gstRate === 12) acc.gst12 += gstValue;
       else if (gstRate === 18) acc.gst18 += gstValue;
       else if (gstRate === 28) acc.gst28 += gstValue;
       else if (gstRate === 0) acc.gst0 += gstValue;
       return acc;
    }, { gross: 0, totalGst: 0, gst5: 0, gst12: 0, gst18: 0, gst28: 0, gst0: 0 });

    const finalAmount = totals.gross - parseFloat(discount || 0) + totals.totalGst;
    const grandTotal = Math.round(finalAmount);
    const totalQty = rows.reduce((sum, r) => sum + parseInt(r.qty || 0), 0);
    const totalFree = rows.reduce((sum, r) => sum + parseInt(r.schemeQty || 0), 0);

    const activeCustomerData = customers.find(c => c.name.toLowerCase() === (customer?.name || "").toLowerCase()) || {};
    
    // Fill empty rows for visual structure
    const MIN_ROWS = 15;
    const emptyRowsCount = Math.max(0, MIN_ROWS - rows.length);
    const emptyRows = Array.from({ length: emptyRowsCount });

    // Auto-spawn new row when the last row has data
    const lastRow = rows[rows.length - 1];
    if (lastRow && lastRow.name) {
      setTimeout(() => setRows([...rows, { ...emptyRow }]), 0);
    }

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
                <div className="relative w-full">
                  <input list="customer-list" value={customer.name} onChange={e => handleCustomerSelect(e.target.value)} className="bg-white text-black px-1 py-0.5 outline-none w-full font-bold" placeholder="Search Customer..." />
                  <datalist id="customer-list">{customers.map(c => <option key={c.id} value={c.name} />)}</datalist>
                </div>
                
                <label className="text-[10px]">Customer ID</label>
                <input value={activeCustomerData.id || ""} readOnly className="bg-[#e6f0fa] text-black px-1 py-0.5 outline-none w-full" />
                
                <label className="text-[10px]">Address</label>
                <input value={activeCustomerData.address || ""} readOnly className="bg-[#e6f0fa] text-black px-1 py-0.5 outline-none w-full h-8" />
                
                <label className="text-[10px]">Phone Contact</label>
                <input value={activeCustomerData.phone || ""} readOnly className="bg-[#e6f0fa] text-black px-1 py-0.5 outline-none w-full" />
                
                <label className="text-[10px]">GST Number</label>
                <input value={activeCustomerData.gstNumber || ""} readOnly className="bg-[#e6f0fa] text-black px-1 py-0.5 outline-none w-full" />
                
                <label className="text-[10px]">DL Number</label>
                <input value={activeCustomerData.dlNumber || ""} readOnly className="bg-[#e6f0fa] text-black px-1 py-0.5 outline-none w-full" />
              </div>
            </div>

            {/* Column 2: Shop Details */}
            <div className="w-[38%] border border-slate-500 p-1">
              <h3 className="font-bold border-b border-slate-500 pb-1 mb-1">Transaction Details</h3>
              <div className="grid grid-cols-[90px_1fr] gap-y-1">
                <label className="text-[10px] mt-0.5">Salesman</label>
                <select value={selectedSalesman.name} onChange={e => {
                  const found = salesmen.find(s => s.name === e.target.value);
                  setSelectedSalesman(found ? { id: found.id, name: found.name } : { id: '', name: '' });
                }} className="bg-white text-black px-1 py-0.5 outline-none w-full">
                  <option value="">Direct/None</option>
                  {salesmen.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                
                <label className="text-[10px] mt-0.5">Available Schemes</label>
                <select size="4" className="bg-[#e6f0fa] text-black px-1 py-0.5 outline-none w-full text-[10px]">
                  {allSchemes.length > 0 ? allSchemes.map((s, idx) => <option key={idx} disabled>{s.name} (Buy {s.buy_qty} Get {s.free_qty})</option>) : <option disabled>No Active Schemes</option>}
                </select>
                
                <label className="text-[10px] mt-1">Payment Mode</label>
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="bg-white text-black px-1 py-0.5 outline-none w-full mt-1">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="credit">Credit</option>
                </select>
                
                <label className="text-[10px] mt-0.5">Transport</label>
                <input value={customer.transportDetails} onChange={e => setCustomer({...customer, transportDetails: e.target.value})} className="bg-white text-black px-1 py-0.5 outline-none w-full mt-0.5" />
                
                <label className="text-[10px] mt-0.5">Due Date</label>
                <input type="date" value={customer.dueDate} onChange={e => setCustomer({...customer, dueDate: e.target.value})} className="bg-white text-black px-1 py-0.5 outline-none w-full mt-0.5" />
              </div>
            </div>

            {/* Column 3: Key Info */}
            <div className="flex-1 border border-slate-500 p-1 flex flex-col">
              <h3 className="font-bold border-b border-slate-500 pb-1 mb-1">Key Info</h3>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px]">Date</span>
                <input value={new Date().toLocaleDateString('en-GB')} className="bg-[#a8c6e6] text-black px-1 py-0.5 outline-none w-24 text-right" readOnly />
              </div>
              <div className="text-[10px] mb-1">Account Balances</div>
              
              <div className="flex justify-between mb-2">
                 <span className="text-[10px] w-20 leading-tight">Credit Limit<br/>Available</span>
                 <div className="w-24 bg-[#ffcc99] text-black text-center text-[10px] font-bold py-1 border border-slate-600">
                    <div>₹{(activeCustomerData.creditLimit || 0).toFixed(2)}</div>
                    <div>-₹{(activeCustomerData.openingBalance || 0).toFixed(2)}</div>
                 </div>
              </div>
              <div className="flex justify-between">
                 <span className="text-[10px] w-20 leading-tight">Current Dues<br/>Pending</span>
                 <div className="w-24 bg-[#cc0000] text-white text-center text-[10px] font-bold py-1 border border-slate-600">
                    <div>₹{(activeCustomerData.openingBalance || 0).toFixed(2)}</div>
                    <div>₹0.00</div>
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
                   <th className="px-1 border-r border-slate-400 text-center w-16">GST %</th>
                   <th className="px-1 text-center w-20">Net</th>
                 </tr>
                 <tr className="bg-slate-200 text-black border-b border-slate-400">
                   <td className="border-r border-slate-400"></td>
                   <td className="px-0.5 border-r border-slate-400">
                     <div className="flex bg-[#e6f0fa] border border-slate-400 items-center px-1 text-slate-500 text-[10px]">Start typing item name... <span className="ml-auto">🔍</span></div>
                   </td>
                   <td className="px-0.5 border-r border-slate-400"><div className="flex bg-[#e6f0fa] border border-slate-400 items-center px-1 text-slate-500 justify-between text-[10px]">Batch <span>▼</span></div></td>
                   <td className="px-0.5 border-r border-slate-400"><div className="flex bg-[#e6f0fa] border border-slate-400 items-center px-1 text-slate-500 justify-between text-[10px]">Expiry <span>▼</span></div></td>
                   <td className="border-r border-slate-400"></td><td className="border-r border-slate-400"></td><td className="border-r border-slate-400"></td><td className="border-r border-slate-400"></td><td className="border-r border-slate-400"></td><td></td>
                 </tr>
               </thead>
               <tbody>
                 {rows.map((row, i) => {
                   const isLowStock = row.name && row.availableQty !== null && (row.availableQty + (row.availableSchemeQty || 0)) <= (row.reorderPoint ?? 10);
                   let isNearExpiry = false;
                   if (row.name && row.expiry) {
                     const expDate = new Date(row.expiry);
                     const diffTime = expDate - new Date();
                     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                     isNearExpiry = diffDays > 0 && diffDays <= 60;
                   }
                   return (
                   <tr key={i} className={\`border-b border-slate-300 text-black \${i%2===0?'bg-[#e6f0fa]':'bg-white'}\`}>
                     <td className="px-1 border-r border-slate-300 text-center font-bold text-slate-500">{i+1}</td>
                     <td className="px-1 border-r border-slate-300 flex items-center justify-between group">
                       <input list={\`item-list-\${i}\`} value={row.searchStr !== undefined ? row.searchStr : row.name} onChange={(e) => handleItemSelect(i, e.target.value)} className="bg-transparent outline-none w-full text-black font-bold" placeholder={i === rows.length-1 ? "Type to add item..." : ""} />
                       <datalist id={\`item-list-\${i}\`}>{items.map(it => <option key={it.id} value={\`\${it.name}\${it.batch ? ' | B: ' + it.batch : ''}\`} />)}</datalist>
                       {isNearExpiry && !isLowStock && <span className="bg-[#ff9900] text-black font-bold px-1 py-0.5 ml-1 text-[9px] shrink-0 border border-slate-500">Near Expiry</span>}
                       {isLowStock && <span className="bg-[#cc0000] text-white font-bold px-1 py-0.5 ml-1 text-[9px] shrink-0 border border-slate-500">Low Stock</span>}
                       {row.name && <button onClick={() => removeRow(i)} className="text-red-500 opacity-0 group-hover:opacity-100 ml-1 px-1 hover:bg-red-200">✕</button>}
                     </td>
                     <td className="px-1 border-r border-slate-300 text-left text-slate-600">{row.batch || ""}</td>
                     <td className="px-1 border-r border-slate-300 text-left text-slate-600">{row.expiry ? new Date(row.expiry).toLocaleDateString('en-GB').replace(/\\//g,'-') : ''}</td>
                     <td className="px-1 border-r border-slate-300 text-right"><input type="number" min="1" value={row.qty || ""} onChange={e => handleRowChange(i, "qty", e.target.value)} className="w-full text-right bg-transparent outline-none text-black font-bold" /></td>
                     <td className="px-1 border-r border-slate-300 text-right"><input type="number" min="0" value={row.schemeQty || ""} onChange={e => handleRowChange(i, "schemeQty", e.target.value)} className="w-full text-right bg-transparent outline-none text-black text-green-700 font-bold" /></td>
                     <td className="px-1 border-r border-slate-300 text-right text-slate-500">{row.name ? parseFloat(row.mrp||0).toFixed(2) : ''}</td>
                     <td className="px-1 border-r border-slate-300 text-right"><input type="number" value={row.selling_price || ""} onChange={e => handleRowChange(i, "selling_price", e.target.value)} className="w-full text-right bg-transparent outline-none text-black" /></td>
                     <td className="px-1 border-r border-slate-300 text-right text-slate-500">{row.name ? (parseFloat(row.gst||0).toFixed(2) + '%') : ''}</td>
                     <td className="px-1 text-right font-bold">{row.name ? (parseFloat(row.amount||0)).toFixed(2) : ''}</td>
                   </tr>
                 )})}
                 {emptyRows.map((_, i) => (
                    <tr key={\`empty-\${i}\`} className={\`border-b border-slate-300 \${(i+rows.length)%2===0?'bg-[#e6f0fa]':'bg-white'} h-[21px]\`}>
                      <td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td></td>
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
                   <div className="flex justify-between items-center mb-0.5"><span>Base Total</span><input readOnly value={totals.gross.toFixed(2)} className="w-20 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center mb-0.5"><span>GST Total</span><input readOnly value={totals.totalGst.toFixed(2)} className="w-20 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center mb-0.5"><span>Discount</span><input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="w-20 text-right text-black bg-white px-1 outline-none border border-slate-400" /></div>
                   <div className="flex justify-between items-center mb-0.5"><span>Total Qty</span><input readOnly value={totalQty} className="w-20 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center font-bold text-yellow-300"><span className="text-white">Grand Total</span><input readOnly value={grandTotal.toFixed(2)} className="w-20 text-right text-black bg-[#ffcc99] font-bold px-1 outline-none border border-slate-500" /></div>
                </div>
                {/* Col 2 */}
                <div className="border-r border-white/20 p-1">
                   <div className="flex justify-between items-center mb-0.5"><span className="text-slate-300">GST 5%</span><input readOnly value={totals.gst5.toFixed(2)} className="w-16 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center mb-0.5"><span className="text-slate-300">GST 12%</span><input readOnly value={totals.gst12.toFixed(2)} className="w-16 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center mb-0.5"><span className="text-slate-300">GST 18%</span><input readOnly value={totals.gst18.toFixed(2)} className="w-16 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center mb-0.5"><span className="text-slate-300">GST 28%</span><input readOnly value={totals.gst28.toFixed(2)} className="w-16 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                   <div className="flex justify-between items-center"><span className="text-slate-300">GST 0%</span><input readOnly value={totals.gst0.toFixed(2)} className="w-16 text-right text-black bg-[#e6f0fa] px-1 outline-none" /></div>
                </div>
                {/* Col 3 */}
                <div className="border-r border-white/20 p-1 flex items-center justify-center">
                   <div className="text-center text-slate-300">
                     <div className="font-bold mb-1">Automated Tax Engine</div>
                     <div>Synced to HSN/SAC</div>
                     <div className="text-yellow-400 mt-2 font-bold">{totalFree > 0 && \`+\${totalFree} Free Items!\`}</div>
                   </div>
                </div>
                {/* Col 4 */}
                <div className="p-1">
                   <div className="flex justify-between items-center mb-0.5"><span className="text-slate-300">Round Off</span><span className="w-20 text-right text-[#a8c6e6]">{(grandTotal - finalAmount).toFixed(2)}</span></div>
                   <div className="flex justify-between items-center mb-0.5"><span className="text-slate-300">Total Free Qty</span><span className="w-20 text-right text-[#a8c6e6]">{totalFree}</span></div>
                   <div className="flex justify-between items-center mb-0.5"><span className="text-slate-300">Total Items</span><span className="w-20 text-right text-[#a8c6e6]">{rows.filter(r=>r.name).length}</span></div>
                   <div className="flex justify-between items-center mb-0.5"><span className="text-slate-300">Status</span><span className="w-20 text-right text-green-400 font-bold uppercase">Valid</span></div>
                   <div className="flex justify-between items-center font-bold"><span className="text-slate-300">Net Payable</span><span className="w-20 text-right text-white text-[12px]">₹{grandTotal.toFixed(2)}</span></div>
                </div>
             </div>
          </div>

          {/* BOTTOM BUTTONS */}
          <div className="flex justify-between bg-[#1b4985] p-1 gap-1 shrink-0">
             <div className="flex gap-1 flex-1">
               <button onClick={handleSaveBill} className="bg-[#1b4985] text-white border border-white hover:bg-[#255b9e] text-[10px] w-12 text-center py-0.5 leading-tight font-bold">F10<br/>Save</button>
               <button className="bg-[#1b4985] text-white border border-slate-500 hover:bg-[#255b9e] text-[10px] w-12 text-center py-0.5 leading-tight opacity-50 cursor-not-allowed">F11<br/>Mover</button>
               <button className="bg-[#1b4985] text-white border border-slate-500 hover:bg-[#255b9e] text-[10px] w-12 text-center py-0.5 leading-tight opacity-50 cursor-not-allowed">F12<br/>Fast</button>
               <button onClick={resetForm} className="bg-[#1b4985] text-white border border-white hover:bg-[#255b9e] text-[10px] w-12 text-center py-0.5 leading-tight">F13<br/>Clear</button>
               <button className="bg-[#1b4985] text-white border border-slate-500 hover:bg-[#255b9e] text-[10px] w-14 text-center py-0.5 leading-tight opacity-50 cursor-not-allowed">F14<br/>Shortcut</button>
               <button className="bg-[#1b4985] text-white border border-slate-500 hover:bg-[#255b9e] text-[10px] w-16 text-center py-0.5 leading-tight opacity-50 cursor-not-allowed">F15<br/>Shortcuts</button>
               <button className="bg-[#1b4985] text-white border border-slate-500 hover:bg-[#255b9e] text-[10px] w-12 text-center py-0.5 leading-tight opacity-50 cursor-not-allowed">F17<br/>Count</button>
             </div>
             <div className="flex gap-1">
               <button onClick={() => setView('list')} className="bg-[#1b4985] text-white border border-white hover:bg-[#255b9e] text-[10px] w-12 text-center py-0.5 leading-tight flex items-center justify-center">Close</button>
             </div>
          </div>
        </main>
      </div>
    );
  }
`;

if (startIdx !== -1 && endIdx !== -1) {
  const newContent = [...lines.slice(0, startIdx), snippet, ...lines.slice(endIdx + 1)].join('\n');
  fs.writeFileSync(path, newContent);
  console.log("Replaced exactly from line", startIdx, "to", endIdx);
} else {
  console.log("Could not find start/end lines.");
}
