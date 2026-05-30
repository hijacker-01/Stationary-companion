const sequelize = require("../config/db");
const Item = require("../models/Item");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Bill = require("../models/Bill");
const GSTCategory = require("../models/GSTCategory");
const EInvoiceLog = require("../models/EInvoiceLog");
const ComplianceRule = require("../models/ComplianceRule");

// Random data generators
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const pharmaItems = [
  { name: "Augmentin 625 Duo Tablet", company: "GSK", hsn: "3004", schedule: "H", mrp: 204.0, cost: 160.0, gst: 12 },
  { name: "Dolo 650 Tablet", company: "Micro Labs", hsn: "3004", schedule: "None", mrp: 30.0, cost: 20.0, gst: 12 },
  { name: "Pan 40 Tablet", company: "Alkem", hsn: "3004", schedule: "None", mrp: 155.0, cost: 120.0, gst: 12 },
  { name: "Thyronorm 50mcg Tablet", company: "Abbott", hsn: "3004", schedule: "H", mrp: 180.0, cost: 140.0, gst: 12 },
  { name: "Azee 500 Tablet", company: "Cipla", hsn: "3004", schedule: "H", mrp: 120.0, cost: 95.0, gst: 12 },
  { name: "Calpol 500 Tablet", company: "GSK", hsn: "3004", schedule: "None", mrp: 15.0, cost: 10.0, gst: 12 },
  { name: "Allegra 120mg Tablet", company: "Sanofi", hsn: "3004", schedule: "None", mrp: 200.0, cost: 160.0, gst: 12 },
  { name: "Ketamine Injection", company: "Neon Labs", hsn: "3004", schedule: "X", mrp: 450.0, cost: 380.0, gst: 18 },
  { name: "Morphine Sulphate 10mg", company: "Rusan", hsn: "3004", schedule: "X", mrp: 250.0, cost: 200.0, gst: 18 },
  { name: "Fentanyl Patch", company: "J&J", hsn: "3004", schedule: "X", mrp: 1200.0, cost: 950.0, gst: 18 },
  { name: "Shelcal 500 Tablet", company: "Torrent", hsn: "3004", schedule: "None", mrp: 110.0, cost: 85.0, gst: 12 },
  { name: "Telma 40 Tablet", company: "Glenmark", hsn: "3004", schedule: "H", mrp: 220.0, cost: 175.0, gst: 12 },
  { name: "Rosuvas 10 Tablet", company: "Sun Pharma", hsn: "3004", schedule: "H", mrp: 300.0, cost: 240.0, gst: 12 },
  { name: "Voveran SR 100 Tablet", company: "Novartis", hsn: "3004", schedule: "H", mrp: 150.0, cost: 110.0, gst: 12 },
  { name: "Dexorange Syrup", company: "Franco-Indian", hsn: "3004", schedule: "None", mrp: 160.0, cost: 125.0, gst: 12 },
  { name: "Betadine Ointment", company: "Win-Medicare", hsn: "3004", schedule: "None", mrp: 100.0, cost: 75.0, gst: 12 },
  { name: "Volini Gel", company: "Sun Pharma", hsn: "3004", schedule: "None", mrp: 120.0, cost: 90.0, gst: 12 },
  { name: "Ecosprin 75 Tablet", company: "USV", hsn: "3004", schedule: "None", mrp: 5.0, cost: 3.5, gst: 12 },
  { name: "Levipil 500 Tablet", company: "Sun Pharma", hsn: "3004", schedule: "H", mrp: 400.0, cost: 320.0, gst: 12 },
  { name: "Surgical Spirit", company: "Local", hsn: "2207", schedule: "None", mrp: 50.0, cost: 30.0, gst: 18 }, // High GST
  { name: "N95 Mask", company: "3M", hsn: "6307", schedule: "None", mrp: 150.0, cost: 90.0, gst: 5 }, // Low GST
];

// Generate more to reach ~50
for (let i = 22; i <= 50; i++) {
  pharmaItems.push({
    name: `Generic Pharma Item ${i}`, company: "Generic Labs", hsn: "3004", schedule: randomChoice(["None", "H", "H1"]),
    mrp: randomInt(50, 500), cost: randomInt(30, 400), gst: 12
  });
}

const states = ["07", "24", "27", "29", "33"]; // Delhi, Gujarat, Maha, Karnataka, TN

const seedDatabase = async () => {
  console.log("🚀 Starting Enterprise Database Seeder...");

  // WIPE DATA (Careful with foreign keys, disable checks if necessary depending on DB dialect. Assuming simple destruction for now)
  console.log("🧹 Wiping existing data...");
  await EInvoiceLog.destroy({ where: {} });
  await Bill.destroy({ where: {} });
  await Item.destroy({ where: {} });
  await Customer.destroy({ where: {} });
  await Supplier.destroy({ where: {} });
  await GSTCategory.destroy({ where: {} });

  // 1. GST Categories
  console.log("🌱 Seeding GST Categories...");
  const categories = await GSTCategory.bulkCreate([
    { hsnCode: "3004", description: "Medicaments", cgstRate: 6, sgstRate: 6, igstRate: 12 },
    { hsnCode: "2207", description: "Ethyl Alcohol", cgstRate: 9, sgstRate: 9, igstRate: 18 },
    { hsnCode: "6307", description: "Made up articles", cgstRate: 2.5, sgstRate: 2.5, igstRate: 5 }
  ]);

  const catMap = { 12: categories[0].id, 18: categories[1].id, 5: categories[2].id };

  // 2. Items
  console.log("🌱 Seeding 50 Items...");
  const createdItems = await Item.bulkCreate(pharmaItems.map((p, i) => ({
    name: p.name,
    batch: `B${randomInt(1000, 9999)}`,
    company: p.company,
    hsn: p.hsn,
    pack: "10s",
    stock_qty: randomInt(100, 5000),
    scheme_qty: randomInt(0, 50),
    mrp: p.mrp,
    selling_price: p.mrp * 0.9,
    cost_price: p.cost,
    schedule: p.schedule,
    taxCategoryId: catMap[p.gst],
    expiry: randomDate(new Date(2025, 0, 1), new Date(2028, 11, 31)).toISOString().split('T')[0]
  })));

  // Make 2 items expired for compliance alerts
  await createdItems[0].update({ expiry: "2023-01-01" });
  await createdItems[1].update({ expiry: "2023-05-01" });

  // 3. Customers
  console.log("🌱 Seeding 20 Customers...");
  const customers = [];
  for (let i = 1; i <= 20; i++) {
    const st = randomChoice(states);
    customers.push({
      name: `Apollo Pharmacy Branch ${i}`,
      legalName: `Apollo Hospitals Enterprise Ltd`,
      phone: `98765${randomInt(10000, 99999)}`,
      stateCode: st,
      gstNumber: `${st}AAACA${randomInt(1000, 9999)}A1Z5`,
      registrationType: "regular",
      creditLimit: randomInt(100000, 1000000)
    });
  }
  const createdCustomers = await Customer.bulkCreate(customers);

  // 4. Suppliers
  console.log("🌱 Seeding 10 Suppliers...");
  const suppliers = [];
  for (let i = 1; i <= 10; i++) {
    const st = randomChoice(states);
    suppliers.push({
      name: `Mega Pharma Distributors ${i}`,
      legalName: `Mega Pharma Ltd`,
      stateCode: st,
      gstNumber: `${st}BBBCB${randomInt(1000, 9999)}B1Z5`
    });
  }
  await Supplier.bulkCreate(suppliers);

  // 5. Bills (100 historical transactions)
  console.log("🌱 Seeding 100 Sales Bills (generating realistic GST & ITC data)...");
  const myStateCode = "27"; // Assume our ERP is in Maharashtra
  const billsToCreate = [];

  for (let i = 1; i <= 100; i++) {
    const cust = randomChoice(createdCustomers);
    const isInterState = cust.stateCode !== myStateCode;
    
    // Pick 1-5 random items
    const numItems = randomInt(1, 5);
    const billItems = [];
    let subtotal = 0, cgstTotal = 0, sgstTotal = 0, igstTotal = 0;

    for (let j = 0; j < numItems; j++) {
      const item = randomChoice(createdItems);
      const qty = randomInt(10, 100);
      const price = item.selling_price;
      const amt = qty * price;
      
      let cgst = 0, sgst = 0, igst = 0;
      const rate = item.taxCategoryId === categories[0].id ? 12 : (item.taxCategoryId === categories[1].id ? 18 : 5);
      
      if (isInterState) {
        igst = amt * (rate / 100);
      } else {
        cgst = amt * ((rate / 2) / 100);
        sgst = amt * ((rate / 2) / 100);
      }

      subtotal += amt;
      cgstTotal += cgst;
      sgstTotal += sgst;
      igstTotal += igst;

      billItems.push({
        name: item.name,
        batch: item.batch,
        qty, price, hsn: item.hsn, schedule: item.schedule
      });
    }

    const total = subtotal + cgstTotal + sgstTotal + igstTotal;

    billsToCreate.push({
      billNo: `INV-2526-${String(i).padStart(4, "0")}`,
      customerName: cust.name,
      customerGst: cust.gstNumber,
      items: billItems,
      subtotal,
      cgstAmount: cgstTotal,
      sgstAmount: sgstTotal,
      igstAmount: igstTotal,
      total,
      status: randomChoice(["paid", "unpaid", "partial"]),
      createdAt: randomDate(new Date(2025, 4, 1), new Date()) // Last 3 months
    });
  }

  const createdBills = await Bill.bulkCreate(billsToCreate);

  // 6. E-Invoice Logs (for high value bills > 50,000)
  console.log("🌱 Generating E-Invoice Logs for high-value bills...");
  const eInvoiceLogs = [];
  for (const bill of createdBills) {
    if (bill.total > 50000) {
      eInvoiceLogs.push({
        billId: bill.id,
        environment: "sandbox",
        isMock: true,
        irn: require("crypto").randomBytes(32).toString("hex"),
        ackNo: String(Math.floor(100000000000000 + Math.random() * 900000000000000)),
        status: "generated",
        createdAt: bill.createdAt
      });
    }
  }
  await EInvoiceLog.bulkCreate(eInvoiceLogs);

  console.log("✅ Enterprise Seeding Complete! Enjoy the rich data.");
};

// If run directly via node
if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seedDatabase;
