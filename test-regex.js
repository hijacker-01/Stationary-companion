
const text = `
SUBHASH MEDICOSE
MANNAT COMPLEX, GADARWARA
ADIST. NARSINGHPUR (M.P.) 23-MADHYA PRADESH
PHONE PE NO.8770602705
GST INVOICE
GSTIN : 23ARGPG5466K1ZN TIN No : 23029029529
M/s SUBHASH MEDICAL STORE          Invoice No. : CR000468 Date : 16/05/2026
33 3004 RA-THERMOSEAL 100GM *12 *12 2.00 0.00 C25807 11/26 144.07 109.79 0.00 0.00 2.50 2.50 219.58
34 3004 GLYCOMET-GP-1MG 15*10 15*10 10.00 0.00 60002820 12/27 123.28 93.93 0.00 0.00 2.50 2.50 939.30
35 3004 TRIGLYNASE-2MG 10TAB*10 10TAB*10 20.00 0.00 28027815 6/27 93.52 71.26 0.00 0.00 2.50 2.50 1425.20
36 3004 ECOSPRIN AV-75 15CAP*10 15CAP*10 10.00 0.00 APA26041 8/26 61.22 48.97 0.00 0.00 2.50 2.50 489.70
37 3004 ACITROM-3 TAB 30TAB 30TAB 1.00 0.00 5003 5/28 705.00 503.69 0.00 0.00 2.50 2.50 503.69
`;

const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
let items = [];

for (const line of lines) {
  if (line.match(/\d{1,2}[/-]\d{2,4}/)) {
    const tokens = line.split(/\s+/);
    const expIdx = tokens.findIndex(t => t.match(/^\d{1,2}[/-]\d{2,4}$/));
    if (expIdx >= 5 && tokens.length > expIdx + 6) {
      console.log("Matched token line:", line);
      items.push({ name: tokens.slice(2, expIdx - 4).join(" "), sNo: tokens[0] });
    } else {
        console.log("Failed token length:", line, "expIdx:", expIdx, "len:", tokens.length);
    }
  }
}
console.log(items);

