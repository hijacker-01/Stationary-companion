const fs = require('fs');
const path = 'C:/Bpartner/marg-erp-clone/frontend/src/pages/Billing.jsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Find the start line for 'if (view === "create") {' and the matching end '}'
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
                    <div>$\{(activeCustomerData.creditLimit || 12).toFixed(2)}</div>
                    <div>-$\{(activeCustomerData.openingBalance || 0).toFixed(2)}</div>
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
                   <tr key={i} className={\`border-b border-slate-300 text-black \${i%2===0?'bg-[#e6f0fa]':'bg-white'}\`}>
                     <td className="px-1 border-r border-slate-300 text-center">{i+1}</td>
                     <td className="px-1 border-r border-slate-300 flex items-center justify-between">
                       <input list={\`item-list-\${i}\`} value={row.searchStr !== undefined ? row.searchStr : row.name} onChange={(e) => handleItemSelect(i, e.target.value)} className="bg-transparent outline-none w-full text-black" />
                       <datalist id={\`item-list-\${i}\`}>{items.map(it => <option key={it.id} value={\`\${it.name}\${it.batch ? ' | B: ' + it.batch : ''}\`} />)}</datalist>
                       {isNearExpiry && !isLowStock && <span className="bg-[#ff9900] text-black font-bold px-1 py-0.5 ml-1 text-[9px] shrink-0">Near Expiry</span>}
                       {isLowStock && <span className="bg-[#cc0000] text-white font-bold px-1 py-0.5 ml-1 text-[9px] shrink-0">Low Stock</span>}
                     </td>
                     <td className="px-1 border-r border-slate-300 text-left">{row.batch || "000001"}</td>
                     <td className="px-1 border-r border-slate-300 text-left">{row.expiry ? new Date(row.expiry).toLocaleDateString('en-GB').replace(/\\//g,'-') : '05-01-2023'}</td>
                     <td className="px-1 border-r border-slate-300 text-right"><input type="number" min="1" value={row.qty} onChange={e => handleRowChange(i, "qty", e.target.value)} className="w-full text-right bg-transparent outline-none text-black" /></td>
                     <td className="px-1 border-r border-slate-300 text-right"><input type="number" min="0" value={row.schemeQty} onChange={e => handleRowChange(i, "schemeQty", e.target.value)} className="w-full text-right bg-transparent outline-none text-black" /></td>
                     <td className="px-1 border-r border-slate-300 text-right">{parseFloat(row.mrp||100).toFixed(2)}</td>
                     <td className="px-1 border-r border-slate-300 text-right"><input type="number" value={row.selling_price} onChange={e => handleRowChange(i, "selling_price", e.target.value)} className="w-full text-right bg-transparent outline-none text-black" /></td>
                     <td className="px-1 text-right">{(parseFloat(row.amount||0)).toFixed(2)}</td>
                   </tr>
                 )})}
                 {emptyRows.map((_, i) => (
                    <tr key={\`empty-\${i}\`} className={\`border-b border-slate-300 \${(i+rows.length)%2===0?'bg-[#e6f0fa]':'bg-white'} h-[21px]\`}>
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
`;

if (startIdx !== -1 && endIdx !== -1) {
  const newContent = [...lines.slice(0, startIdx), snippet, ...lines.slice(endIdx + 1)].join('\n');
  fs.writeFileSync(path, newContent);
  console.log("Replaced exactly from line", startIdx, "to", endIdx);
} else {
  console.log("Could not find start/end lines.");
}
