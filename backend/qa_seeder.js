require("dotenv").config({ path: "./.env" });
const { faker } = require('@faker-js/faker');
const sequelize = require('./config/db');
const User = require('./models/User');
const Item = require('./models/Item');
const Customer = require('./models/Customer');
const Supplier = require('./models/Supplier');
const Bill = require('./models/Bill');
const Payment = require('./models/Payment');

async function seedMassiveData() {
  console.log("Starting massive data seeding...");
  
  await sequelize.sync();
  
  // Create 500 Customers
  const customers = [];
  for(let i=0; i<500; i++) {
    customers.push({
      name: faker.company.name(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      address: faker.location.streetAddress(),
      balance: faker.number.float({ min: -5000, max: 50000, precision: 0.01 }),
      creditLimit: faker.number.int({ min: 10000, max: 100000 }),
      createdAt: faker.date.recent({ days: 30 })
    });
  }
  await Customer.bulkCreate(customers);
  console.log("Seeded 500 customers");

  // Create 500 Suppliers
  const suppliers = [];
  for(let i=0; i<500; i++) {
    suppliers.push({
      name: faker.company.name(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      address: faker.location.streetAddress(),
      balance: faker.number.float({ min: 0, max: 100000, precision: 0.01 }),
      createdAt: faker.date.recent({ days: 30 })
    });
  }
  await Supplier.bulkCreate(suppliers);
  console.log("Seeded 500 suppliers");

  // Create 1000 Items
  const items = [];
  for(let i=0; i<1000; i++) {
    items.push({
      name: faker.commerce.productName() + ' ' + faker.commerce.productMaterial(),
      batch: faker.string.alphanumeric(6).toUpperCase(),
      expiry: faker.date.future({ years: 2 }),
      stock_qty: faker.number.int({ min: 0, max: 1000 }),
      scheme_qty: faker.number.int({ min: 0, max: 50 }),
      selling_price: faker.number.float({ min: 10, max: 5000, precision: 0.01 }),
      mrp: faker.number.float({ min: 20, max: 6000, precision: 0.01 }),
      createdAt: faker.date.recent({ days: 30 })
    });
  }
  await Item.bulkCreate(items);
  console.log("Seeded 1000 items");

  // Create 2000 Bills (Invoices)
  const dbCustomers = await Customer.findAll({ limit: 100 });
  const bills = [];
  for(let i=0; i<2000; i++) {
    const cust = dbCustomers[faker.number.int({ min: 0, max: dbCustomers.length - 1 })];
    bills.push({
      billNo: 'INV-' + faker.number.int({ min: 100000, max: 999999 }),
      customerId: cust.id,
      customerName: cust.name,
      subtotal: faker.number.float({ min: 100, max: 50000, precision: 0.01 }),
      total: faker.number.float({ min: 100, max: 50000, precision: 0.01 }),
      paymentMode: faker.helpers.arrayElement(['cash', 'credit', 'upi']),
      status: faker.helpers.arrayElement(['paid', 'unpaid', 'cancelled']),
      createdAt: faker.date.recent({ days: 30 })
    });
  }
  await Bill.bulkCreate(bills);
  console.log("Seeded 2000 bills");

  console.log("Massive data seeding complete!");
}

seedMassiveData().catch(console.error).finally(() => process.exit(0));
