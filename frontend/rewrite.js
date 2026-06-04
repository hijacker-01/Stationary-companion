const fs = require('fs');

let content = fs.readFileSync('src/pages/SalesChallan.jsx', 'utf8');

// 1. Component Name and Titles
content = content.replace(/SalesChallan/g, 'PurchaseChallan');
content = content.replace(/SALES CHALLANS \(DELIVERY MEMOS\)/g, 'PURCHASE CHALLANS (GOODS RECEIPT)');
content = content.replace(/SALE ENTRY/g, 'PURCHASE ENTRY');
content = content.replace(/New Sale Entry/g, 'New Purchase Entry');
content = content.replace(/sales-challan/g, 'purchase-challan');

// 2. Customers -> Suppliers
content = content.replace(/Customer \[F3\]/g, 'Supplier [F3]');
content = content.replace(/customer/g, 'supplier');
content = content.replace(/Customer/g, 'Supplier');
content = content.replace(/customers/g, 'suppliers');
content = content.replace(/Customers/g, 'Suppliers');

// 3. Grid Columns (RATE -> P.RATE)
content = content.replace(/RATE<\/th>/g, 'P.RATE</th>');

// 4. selling_price -> rate in state and logic
content = content.replace(/selling_price: /g, 'rate: ');
content = content.replace(/selling_price/g, 'rate');

// 5. Active row mapping adjustments
// ensure rate is handled correctly in handleItemSelect
// "rate: found.rate || found.mrp || "", " is what it will become.
// Wait, we still need mrp.
// The script will do a decent 80% job, I'll fix the rest manually.

fs.writeFileSync('src/pages/PurchaseChallan.jsx', content);
console.log("Rewritten to PurchaseChallan.jsx");
