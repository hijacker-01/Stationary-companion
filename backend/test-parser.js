const fs = require("fs");
const path = require("path");
const text = fs.readFileSync(path.join(__dirname, "debug_ocr.txt"), "utf8");
const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

let headerIdx = -1;
let footerIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/(?:HSN|Product|Pack|Qty|Free|Batch|Exp|MRP|Rate)/i)) {
    headerIdx = i;
  }
  if (lines[i].match(/(?:SUB TOTAL|Discount|GRAND TOTAL|Terms)/i) && footerIdx === -1 && headerIdx !== -1) {
    footerIdx = i;
  }
}

const itemLines = lines.slice(headerIdx + 1, footerIdx);
const items = [];

for (const line of itemLines) {
  const cleanLine = line.replace(/[|[\]\\/{}’]/g, " ").replace(/\s+/g, " ").trim();
  
  if (cleanLine.match(/(?:TOTAL|CA\d+|RT TGR)/i)) continue;
  if (cleanLine.length < 10) continue;

  const tokens = cleanLine.split(" ");
  const numTokens = tokens.filter(t => !isNaN(t.replace(/[^\d.-]/g, "")));
  
  if (numTokens.length >= 3) {
    const sNo = !isNaN(tokens[0]) ? tokens[0] : "";
    const hsn = tokens[1] && tokens[1].match(/^\d{4}$/) ? tokens[1] : "3004";
    
    // Find Expiry token (token containing /)
    const expIdx = tokens.findIndex(t => t.includes("/"));
    
    let exp = "12/27";
    let batch = "BATCH";
    let qty = 1;
    let free = 0;
    let mrp = 100;
    let rate = 80;
    let sgst = 2.5;
    let cgst = 2.5;
    let amount = 0;

    const len = tokens.length;
    
    // Last token is usually Amount
    amount = parseFloat(tokens[len - 1].replace(/[^\d.]/g, "")) || 0;
    
    // If we have an expiry token index:
    if (expIdx !== -1) {
      exp = tokens[expIdx];
      batch = tokens[expIdx - 1] || "BATCH";
      free = parseFloat(tokens[expIdx - 2]) || 0;
      qty = parseFloat(tokens[expIdx - 3]) || 1;
      
      // Values after expiry: MRP, Rate, DIS, SCH, SGST, CGST
      mrp = parseFloat(tokens[expIdx + 1]) || 100;
      rate = parseFloat(tokens[expIdx + 2]) || mrp;
      
      // CGST and SGST are usually at the end before amount
      cgst = parseFloat(tokens[len - 2]) || 2.5;
      sgst = parseFloat(tokens[len - 3]) || 2.5;
      if (cgst > 30) cgst = 2.5; // sanitize
      if (sgst > 30) sgst = 2.5;
    } else {
      // Fallback right-to-left
      cgst = parseFloat(tokens[len - 2]) || 2.5;
      sgst = parseFloat(tokens[len - 3]) || 2.5;
      rate = parseFloat(tokens[len - 6]) || parseFloat(tokens[len - 7]) || 100;
      mrp = parseFloat(tokens[len - 7]) || parseFloat(tokens[len - 8]) || rate;
      qty = parseFloat(tokens[len - 10]) || 1;
      batch = tokens[len - 9] || "BATCH";
    }

    if (cgst > 30) cgst = 2.5;
    if (sgst > 30) sgst = 2.5;

    // Product name is between HSN (index 1) and either pack or qty
    // Let's assume name is tokens from index 2 up to index of qty or batch
    const nameEndIdx = expIdx !== -1 ? expIdx - 4 : len - 11;
    const prodStart = sNo ? 2 : 1;
    const name = tokens.slice(prodStart, nameEndIdx > prodStart ? nameEndIdx : prodStart + 2).join(" ");

    items.push({ sNo, hsn, name, qty, free, batch, exp, mrp, rate, sgst, cgst, amount });
  }
}

console.log("Parsed Items:");
console.log(items.map(it => `${it.sNo || "-"} | ${it.name} | Qty: ${it.qty} | Batch: ${it.batch} | Exp: ${it.exp} | Rate: ${it.rate} | Amt: ${it.amount}`));
