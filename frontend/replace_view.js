const snippet = `  // 🟢 CREATE VIEW 🟢
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
    const roundOff = (Math.round(finalAmount) - finalAmount).toFixed(2);
    const grandTotal = Math.round(finalAmount);
    const totalQty = rows.reduce((sum, r) => sum + parseInt(r.qty || 0), 0);
    const totalFree = rows.reduce((sum, r) => sum + parseInt(r.schemeQty || 0), 0);

    const activeCustomerData = customers.find(c => c.name.toLowerCase() === customer.name.toLowerCase()) || {};
    
    return (
      <div className="flex min-h-screen bg-white font-sans text-xs">
        <Sidebar />
        <main className="flex-1 p-1 overflow-y-hidden max-h-screen flex flex-col border-l border-slate-300">
          <div className="flex mb-1 shrink-0 bg-white border border-[#1b4985]">
            <div className="flex-1 p-1 grid grid-cols-5 gap-1 items-center border-r border-slate-300">
              <div className="col-span-2">
                <label className="text-[10px] text-[#1b4985] font-bold uppercase tracking-tight block">Customer / Shop Name [F3]</label>
                <input id="search-customer" type="text" list="customer-list" value={customer.name} onChange={(e) => handleCustomerSelect(e.target.value)} className="w-full border border-slate-300 focus:border-[#1b4985] outline-none py-0.5 px-1 bg-[#f0f4f8] font-bold text-[#1b4985] uppercase" placeholder="SEARCH CUST..." />
                <datalist id="customer-list">{customers.map(c => <option key={c.id} value={c.name} />)}</datalist>
              </div>
              <div>
                <label className="text-[10px] text-[#1b4985] font-bold uppercase tracking-tight block">Phone</label>
                <input type="text" value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})} className="w-full border border-slate-300 outline-none py-0.5 px-1 font-mono uppercase" />
              </div>
              <div>
                <label className="text-[10px] text-[#1b4985] font-bold uppercase tracking-tight block">GSTIN</label>
                <input type="text" value={customer.gstNumber} onChange={(e) => setCustomer({...customer, gstNumber: e.target.value})} className="w-full border border-slate-300 outline-none py-0.5 px-1 font-mono uppercase" />
              </div>
              <div>
                <label className="text-[10px] text-[#1b4985] font-bold uppercase tracking-tight block">DL No</label>
                <input type="text" value={customer.dlNumber} onChange={(e) => setCustomer({...customer, dlNumber: e.target.value})} className="w-full border border-slate-300 outline-none py-0.5 px-1 font-mono uppercase" />
              </div>
            </div>
            <div className="w-[350px] p-1 flex flex-col justify-center bg-[#f8f9fa]">
               <div className="flex justify-between items-center text-[10px] border-b border-slate-300 pb-0.5 mb-0.5">
                  <span className="text-[#1b4985] font-bold uppercase">Credit Details</span>
                  <span className={\`font-bold \${activeCustomerData.openingBalance > 0 ? "text-red-700" : "text-green-700"}\`}>Bal: ₹{(activeCustomerData.openingBalance || 0).toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-600 font-bold uppercase">Limit: ₹{(activeCustomerData.creditLimit || 0).toFixed(2)}</span>
                  <span className="text-slate-600 font-bold uppercase">Days: {activeCustomerData.creditDays || 30}</span>
               </div>
               <div className="mt-1 text-[9px] text-[#1b4985] font-bold bg-[#e6f0fa] px-1 py-0.5 border border-[#1b4985] whitespace-nowrap overflow-hidden text-ellipsis">
                 ACTIVE SCHEMES: {allSchemes.filter(s => s.isActive).map(s => s.name).join(", ") || "NONE"}
               </div>
            </div>
            <div className="w-[300px] p-1 grid grid-cols-2 gap-1 items-center bg-[#1b4985] text-white">
                 <div className="flex justify-between border-b border-[#305f99] pb-0.5"><span className="text-[#a8c6e6] font-bold text-[10px]">ENTRY NO</span><span className="font-bold text-yellow-300 text-[10px]">NEW</span></div>
                 <div className="flex justify-between border-b border-[#305f99] pb-0.5"><span className="text-[#a8c6e6] font-bold text-[10px]">DATE</span><span className="font-bold text-white text-[10px]">{new Date().toLocaleDateString('en-GB')}</span></div>
                 <div className="flex justify-between items-center"><span className="text-[#a8c6e6] font-bold text-[10px]">DUE</span><input type="date" value={customer.dueDate} onChange={e => setCustomer({...customer, dueDate: e.target.value})} className="w-20 outline-none text-right font-bold bg-transparent text-[10px] text-white" /></div>
                 <div className="flex justify-between items-center"><span className="text-[#a8c6e6] font-bold text-[10px]">SALESMAN</span><select value={selectedSalesman.name} onChange={e => { const found = salesmen.find(s => s.name === e.target.value); setSelectedSalesman(found ? { id: found.id, name: found.name } : { id: '', name: '' }); }} className="w-20 outline-none text-right bg-transparent font-bold text-[10px] text-white"><option value="" className="text-black">Direct</option>{salesmen.map(s => <option key={s.id} value={s.name} className="text-black">{s.name}</option>)}</select></div>
            </div>
          </div>

          <div className="flex-1 border border-[#1b4985] flex flex-col min-h-0 bg-white">
             <div className="overflow-auto flex-1">
               <table className="w-full text-left border-collapse whitespace-nowrap">
                 <thead className="sticky top-0 bg-[#f0f4f8] text-[#1b4985] z-10 text-[10px] uppercase font-black border-b-2 border-[#1b4985]">
                   <tr>
                     <th className="px-1 py-1 border-r border-slate-300 w-8 text-center">S.N</th>
                     <th className="px-1 py-1 border-r border-slate-300 w-1/3">Product Name [F2]</th>
                     <th className="px-1 py-1 border-r border-slate-300 text-center w-14">Pack</th>
                     <th className="px-1 py-1 border-r border-slate-300 text-center w-20">Batch</th>
                     <th className="px-1 py-1 border-r border-slate-300 text-center w-16">Expiry</th>
                     <th className="px-1 py-1 border-r border-slate-300 text-right w-16">Stock</th>
                     <th className="px-1 py-1 border-r border-slate-300 text-right w-16 text-[#1b4985]">Qty</th>
                     <th className="px-1 py-1 border-r border-slate-300 text-right w-12 text-[#1b4985]">Free</th>
                     <th className="px-1 py-1 border-r border-slate-300 text-right w-16">MRP</th>
                     <th className="px-1 py-1 border-r border-slate-300 text-right w-16">Rate</th>
                     <th className="px-1 py-1 border-r border-slate-300 text-center w-12">GST%</th>
                     <th className="px-1 py-1 text-right w-20">Amount</th>
                     <th className="px-1 py-1 text-center w-8">X</th>
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
                     <tr key={i} className="border-b border-slate-200 hover:bg-[#e6f0fa] focus-within:bg-[#e6f0fa]">
                       <td className="px-1 py-0.5 text-center text-slate-500 font-bold">{i+1}</td>
                       <td className="px-1 py-0.5 border-r border-slate-300 relative">
                         <div className="flex items-center gap-1">
                           <input id={\`search-product-\${i}\`} list={\`item-list-\${i}\`} value={row.searchStr !== undefined ? row.searchStr : row.name} onChange={(e) => handleItemSelect(i, e.target.value)} className="w-full bg-transparent outline-none font-bold text-slate-900 uppercase" placeholder="Search Item..." />
                           {isNearExpiry && <span className="bg-orange-100 text-orange-800 text-[9px] px-1 font-bold border border-orange-300 shrink-0">NEAR EXP</span>}
                         </div>
                         <datalist id={\`item-list-\${i}\`}>{items.map(it => <option key={it.id} value={\`\${it.name}\${it.batch ? ' | B: ' + it.batch : ''}\`} />)}</datalist>
                       </td>
                       <td className="px-1 py-0.5 border-r border-slate-300 text-center font-bold">{row.unit || 'STRIP'}</td>
                       <td className="px-1 py-0.5 border-r border-slate-300 text-center font-mono font-bold text-slate-700">{row.batch}</td>
                       <td className="px-1 py-0.5 border-r border-slate-300 text-center text-[#1b4985] font-bold">{row.expiry ? new Date(row.expiry).toLocaleDateString('en-GB').substring(0,5) : ''}</td>
                       <td className={\`px-1 py-0.5 border-r border-slate-300 text-right font-bold flex justify-end gap-1 items-center \${isLowStock ? 'text-red-700 bg-red-50' : 'text-[#1b4985]'}\`}>
                         {isLowStock && <span className="text-[9px] bg-red-100 text-red-800 border border-red-300 px-0.5 leading-none">LOW</span>}
                         {row.availableQty !== null ? row.availableQty : ''}
                       </td>
                       <td className="px-1 py-0.5 border-r border-slate-300 bg-[#f0f4f8]">
                         <input type="number" min="1" value={row.qty} onChange={e => handleRowChange(i, "qty", e.target.value)} className="w-full text-right bg-transparent outline-none font-black text-[#1b4985]" />
                       </td>
                       <td className="px-1 py-0.5 border-r border-slate-300 bg-[#f0f4f8]">
                         <input type="number" min="0" value={row.schemeQty} onChange={e => handleRowChange(i, "schemeQty", e.target.value)} className="w-full text-right bg-transparent outline-none font-black text-emerald-700" />
                       </td>
                       <td className="px-1 py-0.5 border-r border-slate-300 text-right font-bold text-slate-600">{parseFloat(row.mrp||0).toFixed(2)}</td>
                       <td className="px-1 py-0.5 border-r border-slate-300">
                         <input type="number" value={row.selling_price} onChange={e => handleRowChange(i, "selling_price", e.target.value)} className="w-full text-right bg-transparent outline-none font-bold text-slate-900" />
                       </td>
                       <td className="px-1 py-0.5 border-r border-slate-300 text-center">
                         <select value={row.gst} onChange={e => handleRowChange(i, "gst", e.target.value)} className="bg-transparent outline-none appearance-none text-center font-bold text-slate-700 w-full cursor-pointer">
                           {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                         </select>
                       </td>
                       <td className="px-1 py-0.5 font-bold text-right text-[#1b4985] bg-[#f0f4f8]">{(parseFloat(row.amount||0)).toFixed(2)}</td>
                       <td className="px-1 py-0.5 text-center bg-white">
                         {rows.length > 1 && <button onClick={() => removeRow(i)} className="text-red-600 font-bold hover:bg-red-100 border border-transparent hover:border-red-300 px-1 leading-none text-sm">×</button>}
                       </td>
                     </tr>
                   )})}
                 </tbody>
               </table>
             </div>
          </div>

          <div className="mt-1 flex shrink-0 h-[65px] border border-[#1b4985] bg-white">
             <div className="w-1/4 bg-[#1b4985] text-white p-1 text-[9px] flex flex-col justify-between border-r border-[#1b4985]">
               <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                 <span className="flex justify-between items-center"><span className="text-[#a8c6e6]">SEARCH ITEM</span><span className="font-mono text-yellow-300 font-bold">F2</span></span>
                 <span className="flex justify-between items-center"><span className="text-[#a8c6e6]">SEARCH CUST</span><span className="font-mono text-yellow-300 font-bold">F3</span></span>
                 <span className="flex justify-between items-center"><span className="text-[#a8c6e6]">SAVE BILL</span><span className="font-mono text-yellow-300 font-bold">F10</span></span>
                 <span className="flex justify-between items-center"><span className="text-[#a8c6e6]">EXIT ENTRY</span><span className="font-mono text-rose-300 font-bold">ESC</span></span>
               </div>
             </div>

             <div className="w-1/4 p-1 flex items-center justify-center border-r border-slate-300 bg-[#f0f4f8]">
               <table className="w-full text-right text-[10px]">
                 <tbody>
                   <tr><td className="text-slate-500 font-bold uppercase w-1/2">Taxable</td><td className="font-black text-[#1b4985]">{grossAmount.toFixed(2)}</td></tr>
                   <tr><td className="text-slate-500 font-bold uppercase">SGST</td><td className="font-black text-[#1b4985]">{sgstAmount.toFixed(2)}</td></tr>
                   <tr><td className="text-slate-500 font-bold uppercase">CGST</td><td className="font-black text-[#1b4985]">{cgstAmount.toFixed(2)}</td></tr>
                 </tbody>
               </table>
             </div>

             <div className="flex-1 p-1 flex">
                <div className="flex-1 grid grid-cols-2 gap-y-0.5 pr-2 items-center pl-1 text-[10px]">
                   <span className="text-slate-500 font-bold uppercase">Items / Qty</span>
                   <span className="font-black text-right text-[#1b4985]">{rows.length} <span className="text-slate-400 mx-0.5">|</span> {totalQty}</span>
                   
                   <span className="text-slate-500 font-bold uppercase">Gross Amt</span>
                   <span className="font-black text-right text-[#1b4985]">{grossAmount.toFixed(2)}</span>
                   
                   <span className="text-slate-500 font-bold uppercase">Discount [-]</span>
                   <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="text-right font-black text-red-700 border-b border-slate-300 outline-none w-16 justify-self-end bg-transparent" />
                </div>
                <div className="w-48 flex flex-col justify-center items-end bg-[#e6f0fa] border border-[#1b4985] p-2 ml-2">
                   <span className="text-[#1b4985] font-bold uppercase tracking-widest text-[9px] mb-0.5">Grand Total</span>
                   <span className="text-3xl font-black text-[#1b4985] tracking-tighter leading-none mb-1">₹{grandTotal}</span>
                   <button onClick={handleSaveBill} className="bg-[#1b4985] text-white font-bold uppercase text-[10px] px-2 py-0.5 border border-[#1b4985] hover:bg-[#123666] w-full text-center">Save [F10]</button>
                </div>
             </div>
          </div>
        </main>
      </div>
    );
  }
\`;

const fs = require('fs');
const path = 'C:/Bpartner/marg-erp-clone/frontend/src/pages/Billing.jsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\\n');
const newContent = [...lines.slice(0, 646), snippet, ...lines.slice(868)].join('\\n');
fs.writeFileSync(path, newContent);
console.log("Replaced successfully!");
