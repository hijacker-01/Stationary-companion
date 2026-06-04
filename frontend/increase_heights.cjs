const fs = require('fs');
let code = fs.readFileSync('src/pages/Billing.jsx', 'utf8');

const startIdx = code.indexOf('if (view === "create") {');
let endIdx = -1;
let openBrackets = 0;
for (let i = startIdx; i < code.length; i++) {
  if (code[i] === '{') openBrackets++;
  if (code[i] === '}') openBrackets--;
  if (openBrackets === 0) {
    endIdx = i;
    break;
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  let block = code.substring(startIdx, endIdx + 1);

  // Replace text sizes
  block = block.replace(/text-\[10px\]/g, 'text-[12px]');
  block = block.replace(/text-\[11px\]/g, 'text-[13px]');
  block = block.replace(/text-\[9px\]/g, 'text-[10px]');
  
  // Replace input paddings
  block = block.replace(/py-0\.5/g, 'py-1');
  
  // Replace outer paddings for more breathing room
  block = block.replace(/p-1/g, 'p-1.5');

  // Make empty row taller
  block = block.replace(/h-\[21px\]/g, 'h-[30px]');
  
  code = code.substring(0, startIdx) + block + code.substring(endIdx + 1);
  fs.writeFileSync('src/pages/Billing.jsx', code);
  console.log('Increased UI heights successfully.');
} else {
  console.log('Failed to find create view block.');
}
