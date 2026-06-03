const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Billing.jsx', 'utf8');

// Replace standard texts
code = code.replace(/export default function Billing\(\) \{/g, 'export default function SalesChallan() {');
code = code.replace(/Billing & Invoices/g, 'Sales Challans (Delivery Memos)');
code = code.replace(/Create Invoice/g, 'Create Delivery Memo');
code = code.replace(/Save & Generate Invoice/g, 'Save Delivery Memo');
code = code.replace(/TAX INVOICE/g, 'DELIVERY MEMO');

// Replace API endpoints
code = code.replace(/\/api\/billing/g, '/api/sales-challan');

// Inject the convert to invoice function
const convertFunc = `
  const handleConvertToInvoice = async (id) => {
    const paymentMode = window.prompt("Enter Payment Mode (cash / credit / upi / bank):", "cash");
    if (!paymentMode) return;
    try {
      await axios.post(
        \`http://localhost:5000/api/sales-challan/\${id}/invoice\`,
        { paymentMode, status: "unpaid" },
        { headers: headers() }
      );
      alert("Converted to Invoice successfully! You can view it in the Billing module.");
      fetchBills();
    } catch (e) {
      alert(e.response?.data?.error || "Error converting to invoice");
    }
  };
`;
code = code.replace(/const handleDelete = async/g, convertFunc + '\n  const handleDelete = async');

// Add the button to the glassmorphic table actions
const buttonHtml = `
                            <button onClick={() => { setActiveBill(bill); setView("preview"); }} className="bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer">View</button>
                            {bill.status !== "invoiced" && bill.status !== "cancelled" && (
                              <button onClick={() => handleConvertToInvoice(bill.id)} className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer">Convert to Bill</button>
                            )}
`;
code = code.replace(/<button onClick=\{\(\) => \{ setActiveBill\(bill\); setView\("preview"\); \}\} className="bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer">View<\/button>/g, buttonHtml);

// Update status colors for 'invoiced'
code = code.replace(
  /bill\.status === "paid" \? "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200" :/g,
  `bill.status === "invoiced" ? "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200" :\n                            bill.status === "paid" ? "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200" :`
);

// Save to SalesChallan.jsx
fs.writeFileSync('frontend/src/pages/SalesChallan.jsx', code);
console.log('Successfully ported Billing.jsx to SalesChallan.jsx');
