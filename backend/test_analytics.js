require('./config/db');
const Bill = require('./models/Bill');
const Item = require('./models/Item');
const { Op } = require('sequelize');

async function test() {
  try {
    const OVERHEADS = { freight: 0.02, packaging: 0.005, bankCharges: 0.01, warehouse: 0.015, salesman: 0.01 };
    const dateFilter = {};
    const bills = await Bill.findAll({ where: { status: { [Op.ne]: 'cancelled' } } });
    console.log('Bills fetched:', bills.length);
    
    const allItems = await Item.findAll();
    console.log('Items fetched:', allItems.length);
    
    const itemMaster = {};
    allItems.forEach(i => {
      itemMaster[`${i.name}-${i.batch || ''}`] = i;
      if (!itemMaster[i.name]) itemMaster[i.name] = i; 
    });

    let totalRevenue = 0, totalProductCost = 0;
    const invoiceWise = [], productWise = {}, customerWise = {}, batchWise = {}, supplierWise = {};
    const fastMovers = [], deadStock = [];

    bills.forEach(bill => {
      let billCost = 0, billRevenue = 0;
      (bill.items || []).forEach(row => {
        const qty = parseInt(row.qty) || 0;
        const rate = parseFloat(row.selling_price || row.rate || row.mrp || 0);
        const discount = parseFloat(row.discount || 0);
        const netRate = rate - (rate * discount / 100);
        const revenue = netRate * qty;
        
        let masterItem = itemMaster[`${row.name}-${row.batch || ''}`] || itemMaster[row.name];
        let costPrice = row.cost_price || (masterItem ? masterItem.cost_price : 0);
        const cost = costPrice * qty;

        billRevenue += revenue;
        billCost += cost;
        
        if (!productWise[row.name]) productWise[row.name] = { name: row.name, revenue: 0, cost: 0, qty: 0, stock: masterItem ? masterItem.stock_qty : 0 };
        productWise[row.name].revenue += revenue;
        productWise[row.name].cost += cost;
        productWise[row.name].qty += qty;
      });
      totalRevenue += billRevenue;
      totalProductCost += billCost;
    });

    console.log('Total Revenue:', totalRevenue);
    console.log('Total Cost:', totalProductCost);
    console.log('SUCCESS');
  } catch(e) {
    console.error('ERROR:', e.message);
  }
}
test().then(() => process.exit(0));
